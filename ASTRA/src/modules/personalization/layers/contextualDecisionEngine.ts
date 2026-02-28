// ─────────────────────────────────────────────────────────────────────────────
// Layer 3: Contextual Decision Engine
// Uses real-time state to choose optimal intervention
// ─────────────────────────────────────────────────────────────────────────────

import {
    PersonalizationContext,
    InterventionSuitabilityResult,
    InterventionType,
    PersonalizationState,
    RecoveryRecommendation,
} from '../models/personalizationTypes';
import {
    ISS_WEIGHTS,
    ISS_THRESHOLDS,
    TIME_MODIFIERS,
    RECOVERY_PROTOCOLS,
    FATIGUE_CONFIG,
} from '../models/personalizationConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// Intervention Suitability Score (ISS)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ISS = GoalConflict × w1 + DistractionSeverity × w2 + CognitiveReadiness × w3
 *
 * Modulated by time-of-day factor.
 *
 * ISS low → reflective nudge
 * ISS medium → soft delay
 * ISS high → hard block
 */
export function computeInterventionSuitability(
    context: PersonalizationContext,
    state: PersonalizationState,
): InterventionSuitabilityResult {
    const { goalConflict, distractionSeverity, cognitiveReadinessScore } = context;

    // ── Raw ISS ──────────────────────────────────────────────────────────
    const rawISS =
        goalConflict * ISS_WEIGHTS.goalConflict +
        distractionSeverity * ISS_WEIGHTS.distractionSeverity +
        cognitiveReadinessScore * ISS_WEIGHTS.cognitiveReadiness;

    // ── Time-of-day modifier ─────────────────────────────────────────────
    const timeModifier = TIME_MODIFIERS[context.timeOfDay] ?? 1.0;
    const modifiedISS = clamp(rawISS * timeModifier);

    // ── Focus session boost ──────────────────────────────────────────────
    // During active focus sessions, escalate severity
    const sessionBoost = context.isInFocusSession ? 0.15 : 0;
    const finalISS = clamp(modifiedISS + sessionBoost);

    // ── Determine intervention type ──────────────────────────────────────
    let recommendedType: InterventionType;
    if (finalISS < ISS_THRESHOLDS.reflectiveMax) {
        recommendedType = 'reflective';
    } else if (finalISS < ISS_THRESHOLDS.softDelayMax) {
        recommendedType = 'soft_delay';
    } else {
        recommendedType = 'hard_block';
    }

    // ── Authority resistance override ────────────────────────────────────
    // High AR users → cap at soft_delay unless in focus session
    if (state.authorityResistanceScore > 0.65 &&
        recommendedType === 'hard_block' &&
        !context.isInFocusSession) {
        recommendedType = 'soft_delay';
    }

    // ── CRS gate: if cognitively depleted, delay strict intervention ─────
    const shouldDelay = cognitiveReadinessScore < 0.25 &&
        recommendedType !== 'reflective';

    // ── Fatigue gate ─────────────────────────────────────────────────────
    if (state.fatigue.fatigueScore >= FATIGUE_CONFIG.criticalFatigueThreshold) {
        recommendedType = 'reflective'; // back off when fatigued
    } else if (state.fatigue.fatigueScore >= FATIGUE_CONFIG.highFatigueThreshold &&
        recommendedType === 'hard_block') {
        recommendedType = 'soft_delay'; // reduce one level
    }

    return {
        score: finalISS,
        recommendedType,
        shouldDelay,
        timeModifier,
        components: {
            goalConflict,
            distractionSeverity,
            cognitiveReadiness: cognitiveReadinessScore,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Intervention Policy Mapping
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map behavioral profile + ISS → intervention policy with tone.
 *
 * Rules:
 * - High ESS → supportive tone
 * - Low ESS → challenge tone
 * - High ARS → avoid hard block
 * - Low SES → confidence-based
 * - High SES → accountability-based
 */
export function selectInterventionPolicy(
    iss: InterventionSuitabilityResult,
    state: PersonalizationState,
): {
    interventionType: InterventionType;
    tone: string;
    message: string;
} {
    const { emotionalSensitivityScore, authorityResistanceScore } = state;
    const type = iss.recommendedType;

    // Select tone based on emotional profile
    let tone: string;
    if (emotionalSensitivityScore > 0.6) {
        tone = 'supportive';
    } else if (emotionalSensitivityScore < 0.3) {
        tone = 'challenge';
    } else {
        tone = 'balanced';
    }

    // Generate message based on type + tone
    const message = generatePolicyMessage(type, tone, authorityResistanceScore);

    return { interventionType: type, tone, message };
}

function generatePolicyMessage(
    type: InterventionType,
    tone: string,
    ars: number,
): string {
    const messages: Record<InterventionType, Record<string, string>> = {
        reflective: {
            supportive: 'You\'re doing well. Is this app aligned with what matters most right now?',
            challenge: 'Quick check: is this moving you closer to your goal, or further away?',
            balanced: 'Pause — is this helping you reach your goal right now?',
        },
        soft_delay: {
            supportive: 'Let\'s pause for a moment. You\'ve got this — redirect your energy.',
            challenge: 'You know you\'re better than this. 10 seconds to reconsider.',
            balanced: 'Taking a brief pause before opening this app.',
        },
        hard_block: {
            supportive: 'This app is paused during your focus time. You\'re building real momentum.',
            challenge: 'Blocked. Stay locked in — your future self is counting on you.',
            balanced: 'This app is blocked during your focus session.',
        },
    };

    return messages[type][tone] || messages[type].balanced;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Recovery Recommendation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Select recovery protocol based on emotional profile and context.
 *
 * High ESS → breathing/meditation (gentle)
 * Low ESS → walk/cold_exposure (action-oriented)
 * Low CRS → rest-focused
 */
export function selectRecoveryRecommendation(
    ess: number,
    crs: number,
    stressProxy: number,
): RecoveryRecommendation {
    // Very depleted → rest
    if (crs < 0.20) {
        return RECOVERY_PROTOCOLS.meditation;
    }

    // High stress + high ESS → breathing
    if (stressProxy > 0.6 && ess > 0.5) {
        return RECOVERY_PROTOCOLS.breathing;
    }

    // High stress + low ESS → walk
    if (stressProxy > 0.5 && ess < 0.4) {
        return RECOVERY_PROTOCOLS.walk;
    }

    // Moderate → reflection
    if (ess > 0.5) {
        return RECOVERY_PROTOCOLS.reflection;
    }

    // Default
    return RECOVERY_PROTOCOLS.walk;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stress Proxy Computation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Estimate stress from HRV and fragmentation.
 * Low HRV + high fragmentation = high stress.
 */
export function computeStressProxy(
    hrvNormalized: number,
    recentAFI: number,
): number {
    // Invert HRV (low HRV = high stress)
    const hrvStress = 1 - clamp(hrvNormalized);
    // High fragmentation = high stress
    const fragmentationStress = clamp(1 - recentAFI);

    return clamp(hrvStress * 0.6 + fragmentationStress * 0.4);
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, v));
}
