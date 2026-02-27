import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, generateId } from './storage';
import type { MeditationSession, MeditationType } from '@/types';

interface MeditationState {
    sessions: MeditationSession[];
    preferredType: MeditationType;
    addSession: (session: Omit<MeditationSession, 'id'>) => void;
    getAverageRating: () => number;
    getSessionCount: () => number;
    getTotalMinutes: () => number;
    setPreferredType: (type: MeditationType) => void;
}

export const useMeditationStore = create<MeditationState>()(
    persist(
        (set, get) => ({
            sessions: [],
            preferredType: 'mindfulness',

            addSession: (session) => {
                const full: MeditationSession = { ...session, id: generateId() };
                set((s) => ({ sessions: [...s.sessions, full] }));
            },

            getAverageRating: () => {
                const sessions = get().sessions;
                if (sessions.length === 0) return 0;
                const last10 = sessions.slice(-10);
                return Math.round((last10.reduce((a, s) => a + s.rating, 0) / last10.length) * 10) / 10;
            },

            getSessionCount: () => get().sessions.length,

            getTotalMinutes: () =>
                Math.round(get().sessions.reduce((a, s) => a + s.duration, 0) / 60),

            setPreferredType: (type) => set({ preferredType: type }),
        }),
        {
            name: 'astra-meditation',
            storage: createJSONStorage(() => zustandStorage),
        },
    ),
);
