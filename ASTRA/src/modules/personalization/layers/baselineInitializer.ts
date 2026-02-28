// ─────────────────────────────────────────────────────────────────────────────
// Layer 1: Rule-Based Foundation — Baseline Initializer
// Converts UserProfile → PersonalizationState₀ (cold start)
// ─────────────────────────────────────────────────────────────────────────────

import { UserProfile, NudgeTone } from '../../onboarding/models/onboardingTypes';
import {
    PersonalizationState,
    StrictnessLevel,
    ComplianceMatrix,
    AdaptiveStrictnessState,
    InterventionFatigueState,
    AttentionEvolution,
    HabitState,
} from '../models/personalizationTypes';
import { BASELINE_MAPPING, ATTENTION_CONFIG } from '../models/personalizationConstants';

// ── Goal Drive Score (GDS) ───────────────────────────────────────────────────

/**
 * GDS = weighted combination of GoalUrgency, SelfEfficacy, MotivationType
 *
 * Higher GDS → user is more driven → can handle stricter interventions
 */
export function computeGoalDriveScore(profile: UserProfile): number {
    const motivationBonus =
        profile.motivationType === 'intrinsic' ? 0.15 :
            profile.motivationType === 'mixed' ? 0.08 : 0;

    const gds =
        profile.goalUrgencyScore * 0.40 +
        profile.selfEfficacyScore * 0.40 +
        motivationBonus +
        (profile.baselineFocusEstimate * 0.10);

    return clamp(gds);
}

// ── Authority Resistance Score (ARS) ─────────────────────────────────────────

/**
 * ARS from onboarding → controls max tolerable strictness.
 * High ARS = avoid hard blocks, keep interventions gentle.
 */
export function computeAuthorityResistanceScore(profile: UserProfile): number {
    // Already computed in onboarding, normalize for this engine
    return clamp(profile.authorityResistanceScore);
}

// ── Emotional Sensitivity Score (ESS) ────────────────────────────────────────

/**
 * ESS determines nudge tone and recovery style.
 * High ESS = supportive/gentle nudges, breathing-based recovery.
 * Low ESS = challenge/sharp nudges, action-based recovery.
 */
export function computeEmotionalSensitivityScore(profile: UserProfile): number {
    return clamp(profile.emotionalReactivityScore);
}

// ── Map to Default Strictness Level ──────────────────────────────────────────

/**
 * Map SCS (Strictness Compatibility Score) from onboarding → StrictnessLevel 1-5
 */
export function mapToStrictnessLevel(scs: number): StrictnessLevel {
    const t = BASELINE_MAPPING.strictness.thresholds;
    if (scs >= t[4]) return 5;
    if (scs >= t[3]) return 4;
    if (scs >= t[2]) return 3;
    if (scs >= t[1]) return 2;
    return 1;
}

// ── Map to Default Focus Length ──────────────────────────────────────────────

/**
 * Map baseline focus estimate → initial session length (ms)
 */
export function mapToFocusLength(baselineFocus: number): number {
    const cfg = BASELINE_MAPPING.focusLength;
    if (baselineFocus >= cfg.thresholdHigh) return cfg.highFocus;
    if (baselineFocus >= cfg.thresholdLow) return cfg.moderateFocus;
    return cfg.lowFocus;
}

// ── Map to Intervention Tolerance ────────────────────────────────────────────

/**
 * How many interventions per day the user can handle before fatigue.
 * High ARS → lower tolerance. High SCS → higher tolerance.
 */
export function computeInterventionTolerance(
    ars: number,
    scs: number,
    ess: number,
): number {
    const base = 0.50;
    const tolerance = base + scs * 0.30 - ars * 0.25 - ess * 0.10;
    return clamp(tolerance);
}

// ── Initialize Full State ────────────────────────────────────────────────────

/**
 * Create initial PersonalizationState from UserProfile.
 * This is the cold start — Layer 2 & 3 will evolve this over time.
 */
export function initializeBaselineState(profile: UserProfile): PersonalizationState {
    const now = Date.now();

    const gds = computeGoalDriveScore(profile);
    const ars = computeAuthorityResistanceScore(profile);
    const ess = computeEmotionalSensitivityScore(profile);
    const ii = profile.impulsivityIndex;

    const baselineStrictness = mapToStrictnessLevel(profile.strictnessCompatibility);
    const baselineFocusLength = mapToFocusLength(profile.baselineFocusEstimate);
    const interventionTolerance = computeInterventionTolerance(ars, profile.strictnessCompatibility, ess);

    // Seed compliance matrix from onboarding prediction
    const complianceMatrix: ComplianceMatrix = {
        reflective: {
            successes: 0,
            attempts: 0,
            probability: profile.predictedResponseMatrix.reflective,
            lastUpdated: now,
            recentSuccesses: 0,
            recentAttempts: 0,
        },
        soft_delay: {
            successes: 0,
            attempts: 0,
            probability: profile.predictedResponseMatrix.softDelay,
            lastUpdated: now,
            recentSuccesses: 0,
            recentAttempts: 0,
        },
        hard_block: {
            successes: 0,
            attempts: 0,
            probability: profile.predictedResponseMatrix.hardBlock,
            lastUpdated: now,
            recentSuccesses: 0,
            recentAttempts: 0,
        },
    };

    const strictness: AdaptiveStrictnessState = {
        currentLevel: baselineStrictness,
        baselineLevel: baselineStrictness,
        complianceRate: 0.5,  // uninformative prior
        overrideFrequency: 0,
        sessionSuccessRate: 0.5,
        lastAdjustment: now,
        adjustmentDirection: 'hold',
    };

    const fatigue: InterventionFatigueState = {
        fatigueScore: 0,
        nudgesDeliveredToday: 0,
        dismissalsToday: 0,
        lastNudgeTime: 0,
        consecutiveDismissals: 0,
    };

    const attention: AttentionEvolution = {
        expectedFocusTime: baselineFocusLength,
        successRate: 0.5,
        sessionHistory: [],
        trend: 'stable',
        recommendedSessionLength: baselineFocusLength,
        growthFactor: 1.0,
    };

    const habits: HabitState = {
        currentStreak: 0,
        longestStreak: 0,
        lastFocusDate: '',
        totalFocusDays: 0,
        weeklyFocusMinutes: [0, 0, 0, 0, 0, 0, 0],
    };

    // Initialize nudge effectiveness from onboarding nudge tone
    const nudgeEffectiveness: Record<NudgeTone, number> = {
        supportive: 0.5,
        sharp: 0.5,
        challenge: 0.5,
        confidence_building: 0.5,
    };
    // Boost the recommended tone
    nudgeEffectiveness[profile.nudgeTone] = 0.7;

    return {
        baselineStrictness,
        baselineNudgeTone: profile.nudgeTone,
        baselineFocusLength,
        baselineInterventionTolerance: interventionTolerance,
        goalDriveScore: gds,
        authorityResistanceScore: ars,
        emotionalSensitivityScore: ess,
        impulsivityIndex: ii,
        complianceMatrix,
        strictness,
        fatigue,
        nudgeEffectiveness,
        attention,
        habits,
        totalInteractions: 0,
        daysSinceOnboarding: 0,
        lastDailyUpdate: now,
        createdAt: now,
        updatedAt: now,
    };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, v));
}
