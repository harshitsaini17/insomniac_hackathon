// ─────────────────────────────────────────────────────────────────────────────
// Personalization Engine — Main Orchestrator
// Bridges all 3 layers into a unified intelligence API
// ─────────────────────────────────────────────────────────────────────────────

import { UserProfile, DistractionCategory, NudgeTone } from '../../onboarding/models/onboardingTypes';
import {
    PersonalizationState,
    PersonalizationProfile,
    PersonalizationContext,
    ComplianceEvent,
    SessionSnapshot,
    StrictnessLevel,
} from '../models/personalizationTypes';

// Layer 1
import { initializeBaselineState } from '../layers/baselineInitializer';

// Layer 2
import {
    processComplianceEvent as processEvent,
    decayFatigue,
    shouldThrottleIntervention,
    selectBestNudgeTone,
    getMostEffectiveIntervention,
} from '../layers/behavioralAdaptation';

// Layer 3
import {
    computeInterventionSuitability,
    selectInterventionPolicy,
    selectRecoveryRecommendation,
    computeStressProxy,
} from '../layers/contextualDecisionEngine';

// Tracking
import {
    recordFocusSession,
    getRecommendedSessionLength,
} from '../tracking/attentionEvolution';
import {
    recordFocusDay,
    checkStreakBroken,
    getHabitSuggestions,
    selectRecoveryProtocol,
    getStreakMessage,
} from '../tracking/habitEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Initialization (Cold Start from Onboarding)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the personalization engine from a UserProfile.
 * Called once after onboarding completes.
 */
export function initializePersonalization(profile: UserProfile): PersonalizationState {
    return initializeBaselineState(profile);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Compute PersonalizationProfile (Runtime)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main decision function: given current state + real-time context,
 * produce a complete PersonalizationProfile.
 *
 * This is called each time an intervention decision is needed.
 */
export function computePersonalizationProfile(
    state: PersonalizationState,
    context: PersonalizationContext,
): PersonalizationProfile {
    // ── Layer 3: Contextual decision ─────────────────────────────────────
    const iss = computeInterventionSuitability(context, state);

    // ── Intervention policy ──────────────────────────────────────────────
    const policy = selectInterventionPolicy(iss, state);

    // ── Select nudge tone (adaptive) ─────────────────────────────────────
    const nudgeTone = selectBestNudgeTone(
        state.nudgeEffectiveness,
        state.baselineNudgeTone,
    );

    // ── Focus session length ─────────────────────────────────────────────
    const focusSessionLength = getRecommendedSessionLength(state.attention);

    // ── Recovery recommendation ──────────────────────────────────────────
    const stressProxy = computeStressProxy(
        context.cognitiveReadinessScore,
        context.recentAFI,
    );
    const recovery = selectRecoveryRecommendation(
        state.emotionalSensitivityScore,
        context.cognitiveReadinessScore,
        stressProxy,
    );

    // ── Habit suggestions ────────────────────────────────────────────────
    const primaryDistraction = getPrimaryDistraction(state);
    const habitSuggestions = getHabitSuggestions(
        primaryDistraction,
        context.cognitiveReadinessScore,
        state.habits.currentStreak,
    );

    // ── Compliance probability matrix ────────────────────────────────────
    const complianceProbabilityMatrix = {
        reflective: state.complianceMatrix.reflective.probability,
        soft_delay: state.complianceMatrix.soft_delay.probability,
        hard_block: state.complianceMatrix.hard_block.probability,
    };

    // ── Uninstall risk ───────────────────────────────────────────────────
    const uninstallRiskScore = computeAdaptiveUninstallRisk(state);

    // ── Fatigue ──────────────────────────────────────────────────────────
    const fatigue = shouldThrottleIntervention(state.fatigue);

    return {
        strictnessLevel: state.strictness.currentLevel,
        nudgeTone,
        interventionPolicy: iss.recommendedType,
        focusSessionLength,
        recoveryRecommendation: recovery,
        habitSuggestions,
        complianceProbabilityMatrix,
        uninstallRiskScore,
        cognitiveReadiness: context.cognitiveReadinessScore,
        attentionTrend: state.attention.trend,
        interventionSuitability: iss,
        fatigueLevel: state.fatigue.fatigueScore,
        currentStreak: state.habits.currentStreak,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Process Compliance Event
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process a compliance event (user complied or overrode an intervention).
 * Updates all Layer 2 adaptive state.
 */
export function processComplianceEvent(
    state: PersonalizationState,
    event: ComplianceEvent,
): PersonalizationState {
    return processEvent(state, event);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Record Focus Session
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record a completed focus session for attention evolution tracking.
 */
export function recordSession(
    state: PersonalizationState,
    session: SessionSnapshot,
): PersonalizationState {
    const newAttention = recordFocusSession(state.attention, session);

    // Also record focus day for streak
    const today = new Date().toISOString().split('T')[0];
    const focusMinutes = session.duration / 60000;
    const newHabits = recordFocusDay(state.habits, today, focusMinutes);

    return {
        ...state,
        attention: newAttention,
        habits: newHabits,
        updatedAt: Date.now(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Daily Update (Once per day)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perform once-daily maintenance:
 * - Decay intervention fatigue
 * - Check/reset streaks
 * - Reset recent compliance windows
 * - Update days since onboarding
 */
export function performDailyUpdate(state: PersonalizationState): PersonalizationState {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];

    // 1. Decay fatigue
    const newFatigue = decayFatigue(state.fatigue);

    // 2. Check streak
    const newHabits = checkStreakBroken(state.habits, today);

    // 3. Update days since onboarding
    const daysSinceOnboarding = Math.floor(
        (now - state.createdAt) / (24 * 3600 * 1000),
    );

    // 4. Reset recent compliance windows (weekly reset)
    const daysSinceLastUpdate = Math.floor(
        (now - state.lastDailyUpdate) / (24 * 3600 * 1000),
    );
    let newMatrix = { ...state.complianceMatrix };

    if (daysSinceLastUpdate >= 7) {
        // Reset recent counters for weekly window
        for (const type of ['reflective', 'soft_delay', 'hard_block'] as const) {
            newMatrix[type] = {
                ...newMatrix[type],
                recentSuccesses: 0,
                recentAttempts: 0,
            };
        }
    }

    return {
        ...state,
        fatigue: newFatigue,
        habits: newHabits,
        complianceMatrix: newMatrix,
        daysSinceOnboarding,
        lastDailyUpdate: now,
        updatedAt: now,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the user's primary distraction category.
 * Infers from baseline state (set during onboarding initialization).
 */
function getPrimaryDistraction(state: PersonalizationState): DistractionCategory {
    // Default to 'social_media' — would ideally come from UserProfile
    // The store should set this during initialization
    return 'social_media';
}

/**
 * Compute adaptive uninstall risk.
 *
 * Factors: override frequency, fatigue, declining compliance, low streak
 */
function computeAdaptiveUninstallRisk(state: PersonalizationState): number {
    const overrideFactor = state.strictness.overrideFrequency * 0.30;
    const fatigueFactor = state.fatigue.fatigueScore * 0.25;
    const lowStreak = state.habits.currentStreak < 3 ? 0.15 : 0;
    const lowCompliance = averageCompliance(state) < 0.3 ? 0.20 : 0;
    const arsFactor = state.authorityResistanceScore * 0.10;

    return clamp(overrideFactor + fatigueFactor + lowStreak + lowCompliance + arsFactor);
}

function averageCompliance(state: PersonalizationState): number {
    const m = state.complianceMatrix;
    const total = m.reflective.probability + m.soft_delay.probability + m.hard_block.probability;
    return total / 3;
}

/**
 * Get a personalized greeting/context line.
 */
export function getPersonalizedGreeting(state: PersonalizationState): string {
    const streak = getStreakMessage(state.habits.currentStreak);
    const trend = state.attention.trend;
    const trendMsg = trend === 'improving' ? 'Your focus is getting sharper!' :
        trend === 'declining' ? 'Let\'s get back on track today.' :
            'Steady progress — keep going.';

    return `${streak} ${trendMsg}`;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, v));
}
