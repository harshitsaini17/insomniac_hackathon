// ─────────────────────────────────────────────────────────────────────────────
// Zustand State Store — Central reactive state for Focus Trainer
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import {
    AFIResult,
    CRSResult,
    FocusGoal,
    PomodoroSession,
    PersonalityProfile,
    StrictnessResult,
    HourBlock,
    DistractivenessResult,
    CognitiveTrainingResult,
    NBackGameState,
    AttentionSwitchState,
    BingeDetectionResult,
    BlockingLevel,
} from '../models/types';
import { BlockingDecision } from '../engine/AdaptiveBlocker';
import { NudgeState, getInitialNudgeState } from '../engine/NudgeManager';

// ── State Shape ──────────────────────────────────────────────────────────────

export interface FocusState {
    // Module status
    isModuleEnabled: boolean;
    isInitialized: boolean;

    // Current metrics
    currentAFI: AFIResult | null;
    currentCRS: CRSResult | null;
    currentStrictness: StrictnessResult | null;

    // Active session
    isInFocusSession: boolean;
    activeSession: PomodoroSession | null;
    sessionTimeRemaining: number; // ms
    completedSessionsToday: number;

    // Goals
    activeGoal: FocusGoal | null;
    goals: FocusGoal[];

    // App analysis
    distractiveApps: DistractivenessResult[];

    // Blocking
    activeBlockingDecision: BlockingDecision | null;
    nudgeState: NudgeState;
    userBlockingOverride: BlockingLevel | null;

    // Personality
    personality: PersonalityProfile;

    // Heatmap
    focusHeatmap: HourBlock[];
    suggestedWindows: HourBlock[];

    // Cognitive training
    nBackGame: NBackGameState | null;
    switchGame: AttentionSwitchState | null;
    trainingHistory: CognitiveTrainingResult[];

    // Binge detection
    bingeAlert: BingeDetectionResult | null;

    // Actions
    setModuleEnabled: (enabled: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    setAFI: (afi: AFIResult) => void;
    setCRS: (crs: CRSResult) => void;
    setStrictness: (strictness: StrictnessResult) => void;
    startFocusSession: (session: PomodoroSession) => void;
    endFocusSession: () => void;
    updateTimeRemaining: (ms: number) => void;
    setActiveGoal: (goal: FocusGoal | null) => void;
    setGoals: (goals: FocusGoal[]) => void;
    setDistractiveApps: (apps: DistractivenessResult[]) => void;
    setBlockingDecision: (decision: BlockingDecision | null) => void;
    setNudgeState: (state: NudgeState) => void;
    setUserBlockingOverride: (level: BlockingLevel | null) => void;
    setPersonality: (profile: PersonalityProfile) => void;
    setFocusHeatmap: (heatmap: HourBlock[]) => void;
    setSuggestedWindows: (windows: HourBlock[]) => void;
    setNBackGame: (game: NBackGameState | null) => void;
    setSwitchGame: (game: AttentionSwitchState | null) => void;
    addTrainingResult: (result: CognitiveTrainingResult) => void;
    setBingeAlert: (alert: BingeDetectionResult | null) => void;
    resetState: () => void;
}

// ── Initial State ────────────────────────────────────────────────────────────

const initialState = {
    isModuleEnabled: true,
    isInitialized: false,
    currentAFI: null,
    currentCRS: null,
    currentStrictness: null,
    isInFocusSession: false,
    activeSession: null,
    sessionTimeRemaining: 0,
    completedSessionsToday: 0,
    activeGoal: null,
    goals: [],
    distractiveApps: [],
    activeBlockingDecision: null,
    nudgeState: getInitialNudgeState(),
    userBlockingOverride: null,
    personality: { conscientiousness: 4, neuroticism: 4 },
    focusHeatmap: [],
    suggestedWindows: [],
    nBackGame: null,
    switchGame: null,
    trainingHistory: [],
    bingeAlert: null,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useFocusStore = create<FocusState>((set) => ({
    ...initialState,

    setModuleEnabled: (enabled) => set({ isModuleEnabled: enabled }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    setAFI: (afi) => set({ currentAFI: afi }),
    setCRS: (crs) => set({ currentCRS: crs }),
    setStrictness: (strictness) => set({ currentStrictness: strictness }),

    startFocusSession: (session) =>
        set({
            isInFocusSession: true,
            activeSession: session,
            sessionTimeRemaining: session.plannedDuration,
        }),

    endFocusSession: () =>
        set((state) => ({
            isInFocusSession: false,
            activeSession: null,
            sessionTimeRemaining: 0,
            completedSessionsToday: state.completedSessionsToday + 1,
        })),

    updateTimeRemaining: (ms) => set({ sessionTimeRemaining: ms }),
    setActiveGoal: (goal) => set({ activeGoal: goal }),
    setGoals: (goals) => set({ goals }),
    setDistractiveApps: (apps) => set({ distractiveApps: apps }),
    setBlockingDecision: (decision) =>
        set({ activeBlockingDecision: decision }),
    setNudgeState: (state) => set({ nudgeState: state }),
    setUserBlockingOverride: (level) =>
        set({ userBlockingOverride: level }),
    setPersonality: (profile) => set({ personality: profile }),
    setFocusHeatmap: (heatmap) => set({ focusHeatmap: heatmap }),
    setSuggestedWindows: (windows) => set({ suggestedWindows: windows }),
    setNBackGame: (game) => set({ nBackGame: game }),
    setSwitchGame: (game) => set({ switchGame: game }),

    addTrainingResult: (result) =>
        set((state) => ({
            trainingHistory: [result, ...state.trainingHistory].slice(0, 50),
        })),

    setBingeAlert: (alert) => set({ bingeAlert: alert }),

    resetState: () => set(initialState),
}));
