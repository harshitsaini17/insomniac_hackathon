import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, generateId } from './storage';
import type { UserProfile } from '@/types';

interface UserState {
    profile: UserProfile;
    updateProfile: (partial: Partial<UserProfile>) => void;
    reset: () => void;
}

const defaultProfile: UserProfile = {
    id: generateId(),
    fitnessLevel: 'moderate',
    goal: 'balanced',
    personality: 'analytical',
    createdAt: Date.now(),
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            profile: defaultProfile,
            updateProfile: (partial) =>
                set((state) => ({ profile: { ...state.profile, ...partial } })),
            reset: () => set({ profile: { ...defaultProfile, id: generateId(), createdAt: Date.now() } }),
        }),
        {
            name: 'astra-user',
            storage: createJSONStorage(() => zustandStorage),
        },
    ),
);
