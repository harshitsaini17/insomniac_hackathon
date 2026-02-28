// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — Behavioral Gap Analysis
// Evaluates tension between user's goals and actual behavior
// ─────────────────────────────────────────────────────────────────────────────

import type { UserState, BehavioralGapScore } from '../types/orchestratorTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// Gap Component Computations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Goal vs Focus: How well is the user investing time toward their goals?
 * High urgency + low weekly focus = high gap.
 */
function computeGoalVsFocus(state: UserState): number {
    const urgency = state.semiDynamic.goalUrgency;
    const weeklyMinutes = state.semiDynamic.weeklyFocusMinutes;

    // Expectation: urgency 0.8 → at least ~200 min/week
    const expectedMinutes = 60 + urgency * 200; // 60–260 min range
    const ratio = Math.min(weeklyMinutes / expectedMinutes, 1);

    return clamp(urgency * (1 - ratio));
}

/**
 * Distraction Deviation: How much more distracted is the user
 * than their personality predicts?
 */
function computeDistractionDeviation(state: UserState): number {
    // Base expected distraction from impulsivity
    const expectedDistraction = state.static.impulsivityIndex * 0.5 + 0.2;
    const actual = state.behavioral.distractionRate;

    // Positive = more distracted than expected
    return clamp(actual - expectedDistraction);
}

/**
 * Compliance Gap: Are they following through on interventions?
 */
function computeComplianceGap(state: UserState): number {
    const expectedCompliance = 0.5 + state.static.conscientiousness / 14; // ~0.57–1.0
    const actual = state.behavioral.complianceRate;

    return clamp(expectedCompliance - actual);
}

/**
 * Session Skip Rate: How often do they skip or fail sessions?
 */
function computeSessionSkipRate(state: UserState): number {
    const survivalRate = state.behavioral.sessionSurvivalRate;
    const daysSince = state.behavioral.daysSinceLastFocus;

    // Penalize for skipping days
    const skipPenalty = Math.min(daysSince / 7, 1) * 0.3;

    return clamp((1 - survivalRate) * 0.7 + skipPenalty);
}

/**
 * Recovery Neglect: Is the user pushing through when they should rest?
 */
function computeRecoveryNeglect(state: UserState): number {
    const fatigue = state.dynamic.fatigueLevel;
    const crs = state.dynamic.cognitiveReadiness;
    const stress = state.dynamic.stressLevel;

    // High fatigue/stress + recent sessions = neglecting recovery
    const fatiguePressure = (fatigue - 2) / 3; // 0 when ≤2, 1 when 5
    const stressPressure = (stress - 2) / 3;
    const crsSignal = 1 - crs;

    // Only counts if they're NOT already resting (had recent sessions)
    const wasActive = state.behavioral.daysSinceLastFocus <= 1 ? 1 : 0;

    return clamp(
        (fatiguePressure * 0.4 + stressPressure * 0.3 + crsSignal * 0.3) * wasActive
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main: Compute Behavioral Gap
// ═══════════════════════════════════════════════════════════════════════════════

export function computeBehavioralGap(state: UserState): BehavioralGapScore {
    const breakdown = {
        goalVsFocus: computeGoalVsFocus(state),
        distractionDeviation: computeDistractionDeviation(state),
        complianceGap: computeComplianceGap(state),
        sessionSkipRate: computeSessionSkipRate(state),
        recoveryNeglect: computeRecoveryNeglect(state),
    };

    // Weighted overall score
    const weights = {
        goalVsFocus: 0.30,
        distractionDeviation: 0.25,
        complianceGap: 0.20,
        sessionSkipRate: 0.15,
        recoveryNeglect: 0.10,
    };

    const overall = clamp(
        breakdown.goalVsFocus * weights.goalVsFocus +
        breakdown.distractionDeviation * weights.distractionDeviation +
        breakdown.complianceGap * weights.complianceGap +
        breakdown.sessionSkipRate * weights.sessionSkipRate +
        breakdown.recoveryNeglect * weights.recoveryNeglect
    );

    // Classify level
    const level = overall < 0.2 ? 'low'
        : overall < 0.45 ? 'moderate'
            : overall < 0.7 ? 'high'
                : 'critical';

    // Identify primary tension
    const tensionEntries = Object.entries(breakdown) as [string, number][];
    tensionEntries.sort((a, b) => b[1] - a[1]);
    const primaryKey = tensionEntries[0][0];

    const tensionLabels: Record<string, string> = {
        goalVsFocus: 'Not investing enough time toward goals',
        distractionDeviation: 'Higher distraction than expected',
        complianceGap: 'Low compliance with interventions',
        sessionSkipRate: 'Too many skipped or failed sessions',
        recoveryNeglect: 'Pushing through without adequate recovery',
    };

    return {
        overall,
        level,
        breakdown,
        primaryTension: tensionLabels[primaryKey] || 'General misalignment',
    };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, v));
}
