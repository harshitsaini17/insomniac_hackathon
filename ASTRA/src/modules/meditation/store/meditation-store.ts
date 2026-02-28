/**
 * ASTRA Meditation Module — Zustand Store
 * Manages meditation inputs, computed scores, session records, and integration API.
 */

import { create } from 'zustand';
import { useUserStore } from '../../shared/store/user-store';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, generateId } from '../../shared/store/storage';
import type {
    DailyMeditationInput,
    ComputedMeditationScores,
    MeditationSessionRecord,
    MeditationDayRecord,
    MeditationType,
    MeditationFlag,
    MeditationIntent,
} from '@/types';
import { computeFullScores } from '@/engine/meditation-scores';
import { runMeditationRules } from '@/engine/meditation-rules';
import { clampMed } from '@/engine/meditation-normalizers';
import { BASE_BOOST_BY_TYPE, EFFICACY_HRV_RATIO, EFFICACY_RATING_MIN } from '@/constants/meditation-constants';

// ─── Event Listeners ───
type MeditationEventListener = (record: MeditationSessionRecord) => void;
const completionListeners: MeditationEventListener[] = [];

export function onMeditationCompleted(listener: MeditationEventListener) {
    completionListeners.push(listener);
    return () => {
        const idx = completionListeners.indexOf(listener);
        if (idx >= 0) completionListeners.splice(idx, 1);
    };
}

// ─── Store Interface ───
interface MeditationState {
    dayRecords: MeditationDayRecord[];
    sessionRecords: MeditationSessionRecord[];

    /** Process daily meditation input → compute MSS + run rules. */
    addMeditationInput: (input: DailyMeditationInput) => ComputedMeditationScores;

    /** Record a completed/abandoned session. */
    recordSession: (record: Omit<MeditationSessionRecord, 'id'>) => void;

    /** Get today's sessions. */
    getTodaySessions: () => MeditationSessionRecord[];

    /** Get latest day record. */
    getLatestDayRecord: () => MeditationDayRecord | null;

    /** Get records for the last N days. */
    getRecordsForDays: (days: number) => MeditationDayRecord[];

    /** Get all session records for the last N days. */
    getSessionsForDays: (days: number) => MeditationSessionRecord[];

    /** Integration API: returns latest MSS + recommendation for other modules. */
    getLatestMeditationOutput: () => {
        MSS: number;
        recommended_type: MeditationType;
        recommended_duration: number;
        attention_boost_est: number;
        flags: MeditationFlag[];
    } | null;

    /** Summary data for charts. */
    getMeditationSummary: (days: number) => {
        mssHistory: { date: string; mss: number }[];
        ratingHistory: { date: string; avg: number }[];
        hrvDelta: { date: string; delta: number }[];
        timeSpent: { date: string; minutes: number }[];
    };

    /** Legacy getters for backward compat. */
    getSessionCount: () => number;
    getTotalMinutes: () => number;
    getAverageRating: () => number;
}

export const useMeditationStore = create<MeditationState>()(
    persist(
        (set, get) => ({
            dayRecords: [],
            sessionRecords: [],

            addMeditationInput: (input: DailyMeditationInput) => {
                const todaySessions = get().getTodaySessions();
                let computed = computeFullScores(input);

                // Run rules
                const ruleResult = runMeditationRules(input, computed, todaySessions);

                // Apply MSS adjustment
                if (ruleResult.mssAdjust) {
                    const adjustedMSS = Math.round(clampMed(computed.MSS + ruleResult.mssAdjust, 0, 100));
                    computed = { ...computed, MSS: adjustedMSS };
                }

                // Apply type/duration overrides
                if (ruleResult.typeOverride) {
                    const boost = Math.round(BASE_BOOST_BY_TYPE[ruleResult.typeOverride] * (computed.MSS / 100) * 10) / 10;
                    computed = { ...computed, recommended_type: ruleResult.typeOverride, attention_boost_est: boost };
                }
                if (ruleResult.durationOverride) {
                    const core = Math.max(0, ruleResult.durationOverride * 60 - computed.prep_seconds);
                    computed = { ...computed, recommended_duration: ruleResult.durationOverride, core_seconds: core };
                }

                // Merge flags
                computed = { ...computed, flags: [...computed.flags, ...ruleResult.flags] };

                const record: MeditationDayRecord = {
                    input,
                    computed,
                    sessions: todaySessions,
                };

                // Upsert by date
                set((s) => {
                    const idx = s.dayRecords.findIndex((r) => r.input.date === input.date);
                    if (idx >= 0) {
                        const updated = [...s.dayRecords];
                        updated[idx] = record;
                        return { dayRecords: updated };
                    }
                    return { dayRecords: [...s.dayRecords, record] };
                });

                return computed;
            },

            recordSession: (record) => {
                const full: MeditationSessionRecord = { ...record, id: generateId() };

                // Check efficacy
                if (
                    full.completed &&
                    full.rating >= EFFICACY_RATING_MIN &&
                    full.pre_hrv != null &&
                    full.post_hrv != null &&
                    full.post_hrv > full.pre_hrv * EFFICACY_HRV_RATIO
                ) {
                    full.efficacy_marked = true;
                }

                set((s) => ({ sessionRecords: [...s.sessionRecords, full] }));

                // Notify listeners
                for (const listener of completionListeners) {
                    try { listener(full); } catch (_) { /* swallow */ }
                }
            },

            getTodaySessions: () => {
                const today = new Date().toISOString().slice(0, 10);
                return get().sessionRecords.filter((s) => s.date === today);
            },

            getLatestDayRecord: () => {
                const recs = get().dayRecords;
                if (recs.length === 0) return null;
                return recs.reduce((latest, r) =>
                    r.input.date > latest.input.date ? r : latest
                );
            },

            getRecordsForDays: (days: number) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                const cutoffStr = cutoff.toISOString().slice(0, 10);
                return get()
                    .dayRecords.filter((r) => r.input.date >= cutoffStr)
                    .sort((a, b) => a.input.date.localeCompare(b.input.date));
            },

            getSessionsForDays: (days: number) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                const cutoffStr = cutoff.toISOString().slice(0, 10);
                return get()
                    .sessionRecords.filter((s) => s.date >= cutoffStr)
                    .sort((a, b) => a.date.localeCompare(b.date));
            },

            getLatestMeditationOutput: () => {
                const latest = get().getLatestDayRecord();
                if (!latest) return null;
                return {
                    MSS: latest.computed.MSS,
                    recommended_type: latest.computed.recommended_type,
                    recommended_duration: latest.computed.recommended_duration,
                    attention_boost_est: latest.computed.attention_boost_est,
                    flags: latest.computed.flags,
                };
            },

            getMeditationSummary: (days: number) => {
                const dayRecs = get().getRecordsForDays(days);
                const sessions = get().getSessionsForDays(days);

                const mssHistory = dayRecs.map((r) => ({
                    date: r.input.date,
                    mss: r.computed.MSS,
                }));

                // Group sessions by date for ratings
                const byDate = new Map<string, MeditationSessionRecord[]>();
                for (const s of sessions) {
                    const arr = byDate.get(s.date) || [];
                    arr.push(s);
                    byDate.set(s.date, arr);
                }

                const ratingHistory = Array.from(byDate.entries()).map(([date, ss]) => ({
                    date,
                    avg: Math.round((ss.reduce((a, s) => a + s.rating, 0) / ss.length) * 10) / 10,
                }));

                const hrvDelta = sessions
                    .filter((s) => s.pre_hrv != null && s.post_hrv != null)
                    .map((s) => ({
                        date: s.date,
                        delta: (s.post_hrv ?? 0) - (s.pre_hrv ?? 0),
                    }));

                const timeSpent = Array.from(byDate.entries()).map(([date, ss]) => ({
                    date,
                    minutes: Math.round(ss.reduce((a, s) => a + s.duration_seconds, 0) / 60),
                }));

                return { mssHistory, ratingHistory, hrvDelta, timeSpent };
            },

            // Legacy getters
            getSessionCount: () => get().sessionRecords.length,
            getTotalMinutes: () =>
                Math.round(get().sessionRecords.reduce((a, s) => a + s.duration_seconds, 0) / 60),
            getAverageRating: () => {
                const sessions = get().sessionRecords;
                if (sessions.length === 0) return 0;
                const last10 = sessions.slice(-10);
                return Math.round((last10.reduce((a, s) => a + s.rating, 0) / last10.length) * 10) / 10;
            },
        }),
        {
            name: 'astra-meditation-v2',
            storage: createJSONStorage(() => zustandStorage),
        },
    ),
);
