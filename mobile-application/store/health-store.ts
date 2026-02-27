import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { HealthSnapshot, Recommendation } from '@/types';

interface HealthState {
    snapshots: HealthSnapshot[];
    recommendations: Recommendation[];
    updateSnapshot: (snapshot: HealthSnapshot) => void;
    getLatestSnapshot: () => HealthSnapshot | null;
    setRecommendations: (recs: Recommendation[]) => void;
}

const emptySnapshot: HealthSnapshot = {
    date: new Date().toISOString().slice(0, 10),
    steps: 0,
    sleepHours: 7,
    sedentaryMinutes: 0,
    hydrationGlasses: 0,
};

export const useHealthStore = create<HealthState>()(
    persist(
        (set, get) => ({
            snapshots: [],
            recommendations: [],

            updateSnapshot: (snapshot) => {
                set((s) => {
                    const existing = s.snapshots.findIndex((sn) => sn.date === snapshot.date);
                    if (existing >= 0) {
                        const updated = [...s.snapshots];
                        updated[existing] = snapshot;
                        return { snapshots: updated };
                    }
                    return { snapshots: [...s.snapshots, snapshot] };
                });
            },

            getLatestSnapshot: () => {
                const snaps = get().snapshots;
                return snaps.length > 0 ? snaps[snaps.length - 1] : null;
            },

            setRecommendations: (recs) => set({ recommendations: recs }),
        }),
        {
            name: 'astra-health',
            storage: createJSONStorage(() => zustandStorage),
        },
    ),
);
