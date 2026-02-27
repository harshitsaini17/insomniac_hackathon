import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, generateId } from './storage';
import type { FocusSession, FocusScore, FocusTaskType } from '@/types';

interface FocusState {
    sessions: FocusSession[];
    currentDifficulty: number;
    addSession: (session: Omit<FocusSession, 'id'>) => void;

    /** Average focus score: weighted blend of accuracy, duration consistency, and reaction time. */
    getFocusScore: () => number;

    /** Daily scores for the last 7 days. */
    getWeeklyScores: () => FocusScore[];

    /** Consecutive days with at least one completed session. */
    getStreak: () => number;

    /** Adjust difficulty based on recent performance. */
    adjustDifficulty: () => void;
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentDifficulty: 1,

            addSession: (session) => {
                const full: FocusSession = { ...session, id: generateId() };
                set((s) => ({ sessions: [...s.sessions, full] }));
                // Auto-adjust after each session
                get().adjustDifficulty();
            },

            getFocusScore: () => {
                const completed = get().sessions.filter((s) => s.completed);
                if (completed.length === 0) return 0;
                const last5 = completed.slice(-5);
                const avgAccuracy = last5.reduce((a, s) => a + s.accuracy, 0) / last5.length;
                const avgReaction = last5.reduce((a, s) => a + s.reactionTimeMs, 0) / last5.length;
                // Normalize: accuracy 0-100 stays, reaction time penalised >500ms
                const reactionPenalty = Math.max(0, 1 - (avgReaction - 300) / 700);
                return Math.round(avgAccuracy * 0.7 + reactionPenalty * 30);
            },

            getWeeklyScores: () => {
                const sessions = get().sessions.filter((s) => s.completed);
                const scores: FocusScore[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().slice(0, 10);
                    const daySessions = sessions.filter(
                        (s) => new Date(s.startedAt).toISOString().slice(0, 10) === dateStr,
                    );
                    const avg =
                        daySessions.length > 0
                            ? Math.round(daySessions.reduce((a, s) => a + s.accuracy, 0) / daySessions.length)
                            : 0;
                    scores.push({ date: dateStr, score: avg });
                }
                return scores;
            },

            getStreak: () => {
                const sessions = get().sessions.filter((s) => s.completed);
                if (sessions.length === 0) return 0;
                const dates = new Set(
                    sessions.map((s) => new Date(s.startedAt).toISOString().slice(0, 10)),
                );
                let streak = 0;
                const d = new Date();
                while (dates.has(d.toISOString().slice(0, 10))) {
                    streak++;
                    d.setDate(d.getDate() - 1);
                }
                return streak;
            },

            adjustDifficulty: () => {
                const completed = get().sessions.filter((s) => s.completed);
                const last3 = completed.slice(-3);
                if (last3.length < 3) return;
                const avgAcc = last3.reduce((a, s) => a + s.accuracy, 0) / 3;
                set((s) => ({
                    currentDifficulty:
                        avgAcc > 80
                            ? Math.min(10, s.currentDifficulty + 1)
                            : avgAcc < 50
                                ? Math.max(1, s.currentDifficulty - 1)
                                : s.currentDifficulty,
                }));
            },
        }),
        {
            name: 'astra-focus',
            storage: createJSONStorage(() => zustandStorage),
        },
    ),
);
