// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Adaptive Personalization Engine — Core Types
// ─────────────────────────────────────────────────────────────────────────────

import { NudgeTone, GoalCategory, DistractionTypeVector, MotivationType } from '../../onboarding/models/onboardingTypes';

// ── Intervention Types ───────────────────────────────────────────────────────

export type InterventionType = 'reflective' | 'soft_delay' | 'hard_block';

export type StrictnessLevel = 1 | 2 | 3 | 4 | 5; // 1=minimal, 5=maximum

export type RecoveryStyle = 'breathing' | 'reflection' | 'walk' | 'meditation' | 'cold_exposure';

export type ComplianceTrend = 'improving' | 'declining' | 'stable';

export type AttentionTrend = 'improving' | 'declining' | 'stable';

// ── Compliance Event ─────────────────────────────────────────────────────────

export interface ComplianceEvent {
    timestamp: number;
    interventionType: InterventionType;
    wasSuccessful: boolean;   // did user comply?
    wasOverride: boolean;     // did user force-override?
    appPackage?: string;
    sessionDuration?: number; // ms — how long user focused after
}

// ── Per-Intervention Bayesian Tracking ───────────────────────────────────────

export interface InterventionTracking {
    successes: number;
    attempts: number;
    probability: number;         // current P(comply)
    lastUpdated: number;
    recentSuccesses: number;     // last 7 days
    recentAttempts: number;
}

export type ComplianceMatrix = Record<InterventionType, InterventionTracking>;

// ── Adaptive Strictness State ────────────────────────────────────────────────

export interface AdaptiveStrictnessState {
    currentLevel: StrictnessLevel;
    baselineLevel: StrictnessLevel;
    complianceRate: number;       // 0–1
    overrideFrequency: number;    // 0–1
    sessionSuccessRate: number;   // 0–1
    lastAdjustment: number;       // epoch ms
    adjustmentDirection: 'up' | 'down' | 'hold';
}

// ── Intervention Fatigue ─────────────────────────────────────────────────────

export interface InterventionFatigueState {
    fatigueScore: number;         // 0–1 (decays over time)
    nudgesDeliveredToday: number;
    dismissalsToday: number;
    lastNudgeTime: number;
    consecutiveDismissals: number;
}

// ── Attention Evolution ──────────────────────────────────────────────────────

export interface AttentionEvolution {
    expectedFocusTime: number;    // ms — E[T]
    successRate: number;          // 0–1
    sessionHistory: SessionSnapshot[];
    trend: AttentionTrend;
    recommendedSessionLength: number; // ms
    growthFactor: number;
}

export interface SessionSnapshot {
    timestamp: number;
    duration: number;            // ms actual
    planned: number;             // ms planned
    wasSuccessful: boolean;
}

// ── Habit Tracking ───────────────────────────────────────────────────────────

export interface HabitState {
    currentStreak: number;       // consecutive focus days
    longestStreak: number;
    lastFocusDate: string;       // YYYY-MM-DD
    totalFocusDays: number;
    weeklyFocusMinutes: number[];  // last 7 days
}

export interface HabitSuggestion {
    id: string;
    title: string;
    description: string;
    category: 'pre_focus' | 'during_focus' | 'post_focus' | 'recovery';
    priority: number;            // 0–1
}

export interface RecoveryRecommendation {
    style: RecoveryStyle;
    message: string;
    durationMinutes: number;
    priority: number;
}

// ── Intervention Suitability Score ───────────────────────────────────────────

export interface InterventionSuitabilityResult {
    score: number;               // 0–1
    recommendedType: InterventionType;
    shouldDelay: boolean;        // CRS too low → delay strict intervention
    timeModifier: number;        // time-of-day adjustment factor
    components: {
        goalConflict: number;
        distractionSeverity: number;
        cognitiveReadiness: number;
    };
}

// ── Personalization Context (real-time inputs) ───────────────────────────────

export interface PersonalizationContext {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    hourOfDay: number;
    cognitiveReadinessScore: number;  // 0–1 from CRS
    recentAFI: number;               // 0–1 attention fragmentation
    goalConflict: number;            // 0–1
    distractionSeverity: number;     // 0–1
    isInFocusSession: boolean;
    stressProxy: number;             // 0–1 (derived from HRV + fragmentation)
    goalUrgency: number;             // 0–1
    currentApp?: string;
}

// ── Full Personalization State (evolves over time) ───────────────────────────

export interface PersonalizationState {
    // Layer 1: Baseline (set at onboarding, rarely changes)
    baselineStrictness: StrictnessLevel;
    baselineNudgeTone: NudgeTone;
    baselineFocusLength: number;       // ms
    baselineInterventionTolerance: number; // 0–1

    // Computed indices from onboarding
    goalDriveScore: number;            // 0–1
    authorityResistanceScore: number;  // 0–1
    emotionalSensitivityScore: number; // 0–1
    impulsivityIndex: number;          // 0–1

    // Layer 2: Adaptive (evolves with usage)
    complianceMatrix: ComplianceMatrix;
    strictness: AdaptiveStrictnessState;
    fatigue: InterventionFatigueState;
    nudgeEffectiveness: Record<NudgeTone, number>; // tone → effectiveness 0–1

    // Attention tracking
    attention: AttentionEvolution;

    // Habit tracking
    habits: HabitState;

    // Meta
    totalInteractions: number;
    daysSinceOnboarding: number;
    lastDailyUpdate: number;           // epoch ms
    createdAt: number;
    updatedAt: number;
}

// ── Final Output: PersonalizationProfile ─────────────────────────────────────

export interface PersonalizationProfile {
    strictnessLevel: StrictnessLevel;
    nudgeTone: NudgeTone;
    interventionPolicy: InterventionType;
    focusSessionLength: number;            // ms
    recoveryRecommendation: RecoveryRecommendation;
    habitSuggestions: HabitSuggestion[];
    complianceProbabilityMatrix: Record<InterventionType, number>;
    uninstallRiskScore: number;            // 0–1
    cognitiveReadiness: number;            // 0–1
    attentionTrend: AttentionTrend;
    interventionSuitability: InterventionSuitabilityResult;
    fatigueLevel: number;                  // 0–1
    currentStreak: number;
}
