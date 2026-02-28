// ─────────────────────────────────────────────────────────────────────────────
// Personalization Store — Zustand State Management
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { UserProfile } from '../../onboarding/models/onboardingTypes';
import {
    PersonalizationState,
    PersonalizationProfile,
    PersonalizationContext,
    ComplianceEvent,
    SessionSnapshot,
} from '../models/personalizationTypes';

import {
    initializePersonalization,
    computePersonalizationProfile,
    processComplianceEvent,
    recordSession,
    performDailyUpdate,
    getPersonalizedGreeting,
} from '../engine/personalizationEngine';

// ── Store Interface ──────────────────────────────────────────────────────────

export interface PersonalizationStoreState {
    // Core state
    isInitialized: boolean;
    state: PersonalizationState | null;
    currentProfile: PersonalizationProfile | null;
    greeting: string;

    // Actions
    initialize: (profile: UserProfile) => void;
    computeProfile: (context: PersonalizationContext) => PersonalizationProfile | null;
    recordCompliance: (event: ComplianceEvent) => void;
    recordFocusSession: (session: SessionSnapshot) => void;
    dailyUpdate: () => void;
    loadState: (state: PersonalizationState) => void;
    getState: () => PersonalizationState | null;
    reset: () => void;
}

// ── Initial Values ───────────────────────────────────────────────────────────

const initialStoreState = {
    isInitialized: false,
    state: null as PersonalizationState | null,
    currentProfile: null as PersonalizationProfile | null,
    greeting: '',
};

// ── Store ────────────────────────────────────────────────────────────────────

export const usePersonalizationStore = create<PersonalizationStoreState>((set, get) => ({
    ...initialStoreState,

    initialize: (profile: UserProfile) => {
        const state = initializePersonalization(profile);
        const greeting = getPersonalizedGreeting(state);
        set({
            isInitialized: true,
            state,
            greeting,
        });
    },

    computeProfile: (context: PersonalizationContext) => {
        const current = get().state;
        if (!current) return null;

        const profile = computePersonalizationProfile(current, context);
        set({ currentProfile: profile });
        return profile;
    },

    recordCompliance: (event: ComplianceEvent) => {
        const current = get().state;
        if (!current) return;

        const updated = processComplianceEvent(current, event);
        const greeting = getPersonalizedGreeting(updated);
        set({ state: updated, greeting });
    },

    recordFocusSession: (session: SessionSnapshot) => {
        const current = get().state;
        if (!current) return;

        const updated = recordSession(current, session);
        const greeting = getPersonalizedGreeting(updated);
        set({ state: updated, greeting });
    },

    dailyUpdate: () => {
        const current = get().state;
        if (!current) return;

        const updated = performDailyUpdate(current);
        const greeting = getPersonalizedGreeting(updated);
        set({ state: updated, greeting });
    },

    loadState: (state: PersonalizationState) => {
        const greeting = getPersonalizedGreeting(state);
        set({
            isInitialized: true,
            state,
            greeting,
        });
    },

    getState: () => get().state,

    reset: () => set(initialStoreState),
}));
