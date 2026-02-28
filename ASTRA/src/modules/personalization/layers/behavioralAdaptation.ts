// ─────────────────────────────────────────────────────────────────────────────
// Layer 2: Behavioral Adaptation — Bayesian Learning + Strictness Evolution
// ─────────────────────────────────────────────────────────────────────────────

import {
    PersonalizationState,
    ComplianceEvent,
    InterventionType,
    ComplianceMatrix,
    InterventionTracking,
    AdaptiveStrictnessState,
    InterventionFatigueState,
    StrictnessLevel,
    ComplianceTrend,
} from '../models/personalizationTypes';
import { NudgeTone } from '../../onboarding/models/onboardingTypes';
import {
    BAYESIAN_CONFIG,
    STRICTNESS_CONFIG,
    FATIGUE_CONFIG,
} from '../models/personalizationConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// Bayesian Compliance Update
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update compliance probability for a specific intervention type.
 *
 * P_new = (successes + alpha) / (attempts + alpha + beta)
 *
 * Uses Laplace smoothing (Beta prior) for stable estimates
 * even with very few data points.
 */
export function updateCompliance(
    tracking: InterventionTracking,
    wasSuccessful: boolean,
): InterventionTracking {
    const { priorAlpha, priorBeta } = BAYESIAN_CONFIG;

    const newSuccesses = tracking.successes + (wasSuccessful ? 1 : 0);
    const newAttempts = tracking.attempts + 1;
    const newRecentSuccesses = tracking.recentSuccesses + (wasSuccessful ? 1 : 0);
    const newRecentAttempts = tracking.recentAttempts + 1;

    const probability = (newSuccesses + priorAlpha) / (newAttempts + priorAlpha + priorBeta);

    return {
        successes: newSuccesses,
        attempts: newAttempts,
        probability,
        lastUpdated: Date.now(),
        recentSuccesses: newRecentSuccesses,
        recentAttempts: newRecentAttempts,
    };
}

/**
 * Update the full compliance matrix with a new event.
 */
export function updateComplianceMatrix(
    matrix: ComplianceMatrix,
    event: ComplianceEvent,
): ComplianceMatrix {
    return {
        ...matrix,
        [event.interventionType]: updateCompliance(
            matrix[event.interventionType],
            event.wasSuccessful,
        ),
    };
}

/**
 * Compute compliance trend by comparing recent vs overall.
 */
export function getComplianceTrend(tracking: InterventionTracking): ComplianceTrend {
    const { priorAlpha, priorBeta, minAttemptsForTrust } = BAYESIAN_CONFIG;

    if (tracking.attempts < minAttemptsForTrust || tracking.recentAttempts < 3) {
        return 'stable';
    }

    const overallP = (tracking.successes + priorAlpha) / (tracking.attempts + priorAlpha + priorBeta);
    const recentP = (tracking.recentSuccesses + priorAlpha) / (tracking.recentAttempts + priorAlpha + priorBeta);
    const delta = recentP - overallP;

    if (delta > 0.10) return 'improving';
    if (delta < -0.10) return 'declining';
    return 'stable';
}

/**
 * Find the most effective intervention type based on compliance data.
 */
export function getMostEffectiveIntervention(matrix: ComplianceMatrix): InterventionType {
    const types: InterventionType[] = ['reflective', 'soft_delay', 'hard_block'];
    let best: InterventionType = 'reflective';
    let bestP = -1;

    for (const type of types) {
        if (matrix[type].probability > bestP) {
            bestP = matrix[type].probability;
            best = type;
        }
    }

    return best;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Adaptive Strictness Evolution
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evolve strictness based on compliance rate, override frequency,
 * and session success rate.
 *
 * Rules:
 * - Compliance ↑ + sessions ↑ → escalate slowly
 * - Overrides ↑ → de-escalate
 * - Minimum cooldown between adjustments
 */
export function evolveStrictness(
    state: AdaptiveStrictnessState,
    complianceRate: number,
    overrideFrequency: number,
    sessionSuccessRate: number,
    authorityResistance: number,
): AdaptiveStrictnessState {
    const now = Date.now();
    const daysSinceAdjust = (now - state.lastAdjustment) / (24 * 3600 * 1000);

    // Cooldown check
    if (daysSinceAdjust < STRICTNESS_CONFIG.adjustmentCooldownDays) {
        return {
            ...state,
            complianceRate,
            overrideFrequency,
            sessionSuccessRate,
        };
    }

    let newLevel = state.currentLevel;
    let direction: 'up' | 'down' | 'hold' = 'hold';

    // ── Escalate conditions ──────────────────────────────────────────────
    if (
        complianceRate >= STRICTNESS_CONFIG.escalateThreshold &&
        sessionSuccessRate >= STRICTNESS_CONFIG.escalateSessionThreshold &&
        overrideFrequency < STRICTNESS_CONFIG.deescalateOverrideThreshold
    ) {
        if (state.currentLevel < STRICTNESS_CONFIG.maxLevel) {
            newLevel = (state.currentLevel + 1) as StrictnessLevel;
            direction = 'up';
        }
    }

    // ── De-escalate conditions ───────────────────────────────────────────
    if (
        overrideFrequency >= STRICTNESS_CONFIG.deescalateOverrideThreshold ||
        sessionSuccessRate < STRICTNESS_CONFIG.deescalateSessionThreshold
    ) {
        if (state.currentLevel > STRICTNESS_CONFIG.minLevel) {
            newLevel = (state.currentLevel - 1) as StrictnessLevel;
            direction = 'down';
        }
    }

    // ── Authority resistance cap ─────────────────────────────────────────
    // High AR users should never go above level 3
    if (authorityResistance > 0.65 && newLevel > 3) {
        newLevel = 3 as StrictnessLevel;
    }

    return {
        currentLevel: newLevel,
        baselineLevel: state.baselineLevel,
        complianceRate,
        overrideFrequency,
        sessionSuccessRate,
        lastAdjustment: direction !== 'hold' ? now : state.lastAdjustment,
        adjustmentDirection: direction,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Intervention Fatigue Tracking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update fatigue state after a nudge delivery.
 */
export function recordNudgeFatigue(
    state: InterventionFatigueState,
    wasDismissed: boolean,
): InterventionFatigueState {
    const now = Date.now();

    let fatigueDelta = FATIGUE_CONFIG.fatiguePerNudge;
    let consecutive = wasDismissed ? state.consecutiveDismissals + 1 : 0;

    if (wasDismissed) {
        fatigueDelta += FATIGUE_CONFIG.fatiguePerDismissal;
        // Compound consecutive dismissals
        fatigueDelta *= Math.pow(FATIGUE_CONFIG.consecutiveDismissalMultiplier, consecutive - 1);
    }

    return {
        fatigueScore: clamp(state.fatigueScore + fatigueDelta),
        nudgesDeliveredToday: state.nudgesDeliveredToday + 1,
        dismissalsToday: state.dismissalsToday + (wasDismissed ? 1 : 0),
        lastNudgeTime: now,
        consecutiveDismissals: consecutive,
    };
}

/**
 * Apply daily fatigue decay (call once per day).
 */
export function decayFatigue(state: InterventionFatigueState): InterventionFatigueState {
    return {
        ...state,
        fatigueScore: clamp(state.fatigueScore * (1 - FATIGUE_CONFIG.dailyDecayRate)),
        nudgesDeliveredToday: 0,
        dismissalsToday: 0,
        consecutiveDismissals: 0,
    };
}

/**
 * Check if interventions should be throttled due to fatigue.
 */
export function shouldThrottleIntervention(fatigue: InterventionFatigueState): {
    throttle: boolean;
    severity: 'none' | 'reduce' | 'critical';
} {
    if (fatigue.fatigueScore >= FATIGUE_CONFIG.criticalFatigueThreshold) {
        return { throttle: true, severity: 'critical' };
    }
    if (fatigue.fatigueScore >= FATIGUE_CONFIG.highFatigueThreshold) {
        return { throttle: true, severity: 'reduce' };
    }
    return { throttle: false, severity: 'none' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nudge Effectiveness
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update nudge tone effectiveness based on compliance after that tone.
 */
export function updateNudgeEffectiveness(
    current: Record<NudgeTone, number>,
    tone: NudgeTone,
    wasEffective: boolean,
): Record<NudgeTone, number> {
    const alpha = current[tone] * 2;
    const beta = (1 - current[tone]) * 2;
    const success = wasEffective ? 1 : 0;
    const posterior = (alpha + success) / (alpha + beta + 1);

    return {
        ...current,
        [tone]: clamp(posterior),
    };
}

/**
 * Select the most effective nudge tone.
 */
export function selectBestNudgeTone(
    effectiveness: Record<NudgeTone, number>,
    baselineTone: NudgeTone,
): NudgeTone {
    const tones: NudgeTone[] = ['supportive', 'sharp', 'challenge', 'confidence_building'];
    let best = baselineTone;
    let bestScore = -1;

    for (const tone of tones) {
        if (effectiveness[tone] > bestScore) {
            bestScore = effectiveness[tone];
            best = tone;
        }
    }

    return best;
}

// ── Process Full Compliance Event ────────────────────────────────────────────

/**
 * Process a compliance event and update all Layer 2 state.
 */
export function processComplianceEvent(
    state: PersonalizationState,
    event: ComplianceEvent,
): PersonalizationState {
    // 1. Update compliance matrix
    const newMatrix = updateComplianceMatrix(state.complianceMatrix, event);

    // 2. Compute aggregate rates
    const totalSuccesses = Object.values(newMatrix).reduce((s, t) => s + t.successes, 0);
    const totalAttempts = Object.values(newMatrix).reduce((s, t) => s + t.attempts, 0);
    const complianceRate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0.5;
    const overrideFrequency = event.wasOverride
        ? clamp(state.strictness.overrideFrequency * 0.9 + 0.1)
        : clamp(state.strictness.overrideFrequency * 0.95);

    // 3. Evolve strictness
    const newStrictness = evolveStrictness(
        state.strictness,
        complianceRate,
        overrideFrequency,
        state.attention.successRate,
        state.authorityResistanceScore,
    );

    // 4. Update fatigue
    const newFatigue = recordNudgeFatigue(
        state.fatigue,
        !event.wasSuccessful,
    );

    // 5. Update nudge effectiveness (infer tone from baseline)
    const newEffectiveness = updateNudgeEffectiveness(
        state.nudgeEffectiveness,
        state.baselineNudgeTone,
        event.wasSuccessful,
    );

    return {
        ...state,
        complianceMatrix: newMatrix,
        strictness: newStrictness,
        fatigue: newFatigue,
        nudgeEffectiveness: newEffectiveness,
        totalInteractions: state.totalInteractions + 1,
        updatedAt: Date.now(),
    };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, v));
}
