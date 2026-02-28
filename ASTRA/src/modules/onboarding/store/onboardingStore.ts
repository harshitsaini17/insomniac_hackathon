// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Zustand State Store
// Manages onboarding flow state, step navigation, and computed profile
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import {
    OnboardingStep,
    ONBOARDING_STEPS,
    OnboardingAnswers,
    UserProfile,
} from '../models/onboardingTypes';

// ── State Shape ──────────────────────────────────────────────────────────────

export interface OnboardingState {
    // Navigation
    currentStepIndex: number;
    currentStep: OnboardingStep;
    isComplete: boolean;

    // Answers (accumulate as user progresses)
    answers: Partial<OnboardingAnswers>;

    // Computed profile (set after final step)
    profile: UserProfile | null;

    // Validation
    stepErrors: Record<string, string>;

    // Actions
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (index: number) => void;
    setAnswer: <K extends keyof OnboardingAnswers>(
        key: K,
        value: OnboardingAnswers[K],
    ) => void;
    setAnswers: (answers: Partial<OnboardingAnswers>) => void;
    setProfile: (profile: UserProfile) => void;
    setStepError: (field: string, error: string) => void;
    clearStepErrors: () => void;
    markComplete: () => void;
    resetOnboarding: () => void;
}

// ── Initial State ────────────────────────────────────────────────────────────

const initialState = {
    currentStepIndex: 0,
    currentStep: ONBOARDING_STEPS[0] as OnboardingStep,
    isComplete: false,
    answers: {},
    profile: null,
    stepErrors: {},
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingState>((set) => ({
    ...initialState,

    goToNextStep: () =>
        set((state) => {
            const nextIndex = Math.min(
                state.currentStepIndex + 1,
                ONBOARDING_STEPS.length - 1,
            );
            return {
                currentStepIndex: nextIndex,
                currentStep: ONBOARDING_STEPS[nextIndex],
                stepErrors: {},
            };
        }),

    goToPreviousStep: () =>
        set((state) => {
            const prevIndex = Math.max(state.currentStepIndex - 1, 0);
            return {
                currentStepIndex: prevIndex,
                currentStep: ONBOARDING_STEPS[prevIndex],
                stepErrors: {},
            };
        }),

    goToStep: (index: number) =>
        set({
            currentStepIndex: index,
            currentStep: ONBOARDING_STEPS[index],
            stepErrors: {},
        }),

    setAnswer: (key, value) =>
        set((state) => ({
            answers: { ...state.answers, [key]: value },
        })),

    setAnswers: (answers) =>
        set((state) => ({
            answers: { ...state.answers, ...answers },
        })),

    setProfile: (profile) => set({ profile }),

    setStepError: (field, error) =>
        set((state) => ({
            stepErrors: { ...state.stepErrors, [field]: error },
        })),

    clearStepErrors: () => set({ stepErrors: {} }),

    markComplete: () => set({ isComplete: true }),

    resetOnboarding: () => set(initialState),
}));
