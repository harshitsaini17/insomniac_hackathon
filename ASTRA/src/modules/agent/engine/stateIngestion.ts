// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — State Ingestion
// Collects a unified UserState snapshot from all ASTRA modules
// ─────────────────────────────────────────────────────────────────────────────

import type {
    UserState,
    StaticTraits,
    SemiDynamicSignals,
    DynamicSignals,
    BehavioralSignals,
} from '../types/orchestratorTypes';
import type { PersonalizationState } from '../../personalization/models/personalizationTypes';
import type { UserProfile } from '../../onboarding/models/onboardingTypes';
import type { HealthDayRecord, ComputedHealthScores, AttentionCapacity } from '../../shared/types';
import { getTimeOfDay } from '../../focusTrainer/math/normalize';

// ═══════════════════════════════════════════════════════════════════════════════
// Static Traits — from onboarding profile
// ═══════════════════════════════════════════════════════════════════════════════

export function extractStaticTraits(profile: UserProfile | null): StaticTraits {
    if (!profile) return DEFAULT_STATIC;
    return {
        conscientiousness: profile.bigFive.conscientiousness,
        neuroticism: profile.bigFive.neuroticism,
        openness: profile.bigFive.openness,
        agreeableness: profile.bigFive.agreeableness,
        extraversion: profile.bigFive.extraversion,
        impulsivityIndex: profile.impulsivityIndex,
        authorityResistance: profile.authorityResistanceScore,
        selfEfficacy: profile.selfEfficacyScore,
        emotionalReactivity: profile.emotionalReactivityScore,
        motivationType: profile.motivationType,
        goalCategory: profile.goalCategory,
        nudgeTone: profile.nudgeTone,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Semi-Dynamic Signals — from personalization + meditation stores
// ═══════════════════════════════════════════════════════════════════════════════

export function extractSemiDynamicSignals(
    personalization: PersonalizationState | null,
    meditationSessionCount: number,
    meditationTotalMinutes: number,
    meditationAvgRating: number,
): SemiDynamicSignals {
    if (!personalization) return DEFAULT_SEMI_DYNAMIC;

    const habit = personalization.habits;
    const attention = personalization.attention;
    const weeklyMinutes = habit.weeklyFocusMinutes.reduce((a, b) => a + b, 0);

    return {
        goalUrgency: personalization.goalDriveScore,
        habitStreak: habit.currentStreak,
        habitStrength: Math.min(habit.currentStreak / 21, 1), // 21-day habit benchmark
        attentionTrend: attention.trend,
        complianceTrend: getOverallComplianceTrend(personalization),
        weeklyFocusMinutes: weeklyMinutes,
        totalSessionCount: meditationSessionCount,
        averageMeditationRating: meditationAvgRating || 3,
    };
}

function getOverallComplianceTrend(p: PersonalizationState): 'improving' | 'declining' | 'stable' {
    const matrix = p.complianceMatrix;
    let recentTotal = 0;
    let overallTotal = 0;
    let count = 0;

    for (const key of Object.keys(matrix) as Array<keyof typeof matrix>) {
        const t = matrix[key];
        recentTotal += t.recentAttempts > 0 ? t.recentSuccesses / t.recentAttempts : 0.5;
        overallTotal += t.attempts > 0 ? t.successes / t.attempts : 0.5;
        count++;
    }

    if (count === 0) return 'stable';
    const recentAvg = recentTotal / count;
    const overallAvg = overallTotal / count;
    const diff = recentAvg - overallAvg;

    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dynamic Signals — from health store + focus store (real-time)
// ═══════════════════════════════════════════════════════════════════════════════

export function extractDynamicSignals(
    healthRecord: HealthDayRecord | null,
    mss: number,
    currentAFI: number,
): DynamicSignals {
    const now = new Date();
    const hour = now.getHours();

    if (!healthRecord) {
        return {
            ...DEFAULT_DYNAMIC,
            timeOfDay: getTimeOfDay(hour),
            hourOfDay: hour,
            meditationSuitability: mss,
            currentAFI,
        };
    }

    const computed = healthRecord.computed;

    return {
        cognitiveReadiness: computed.CognitiveReadiness / 100,
        meditationSuitability: mss,
        hrvState: healthRecord.input.hrv_rmssd_ms ?? -1,
        hrvNormalized: computed.HRVScore / 100,
        stressLevel: healthRecord.input.stress_level,
        fatigueLevel: healthRecord.input.fatigue_level,
        sleepHours: healthRecord.input.sleep_hours,
        sleepQuality: healthRecord.input.sleep_quality,
        attentionCapacity: computed.AttentionCapacity,
        currentAFI,
        timeOfDay: getTimeOfDay(hour),
        hourOfDay: hour,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral Signals — from personalization state
// ═══════════════════════════════════════════════════════════════════════════════

export function extractBehavioralSignals(
    personalization: PersonalizationState | null,
): BehavioralSignals {
    if (!personalization) return DEFAULT_BEHAVIORAL;

    const fatigue = personalization.fatigue;
    const strictness = personalization.strictness;
    const attention = personalization.attention;
    const habit = personalization.habits;

    // Days since last focus
    const today = new Date().toISOString().slice(0, 10);
    const lastFocus = habit.lastFocusDate;
    const daysSince = lastFocus
        ? Math.floor((Date.now() - new Date(lastFocus).getTime()) / 86400000)
        : 999;

    return {
        distractionRate: 1 - (attention.successRate || 0.5),
        complianceRate: strictness.complianceRate,
        overrideFrequency: strictness.overrideFrequency,
        sessionSurvivalRate: attention.successRate,
        nudgeDismissRate: fatigue.nudgesDeliveredToday > 0
            ? fatigue.dismissalsToday / fatigue.nudgesDeliveredToday
            : 0,
        consecutiveDismissals: fatigue.consecutiveDismissals,
        interventionFatigue: fatigue.fatigueScore,
        lastSessionWasSuccessful: attention.sessionHistory.length > 0
            ? attention.sessionHistory[attention.sessionHistory.length - 1].wasSuccessful
            : true,
        daysSinceLastFocus: daysSince,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main: Build Complete UserState
// ═══════════════════════════════════════════════════════════════════════════════

export function buildUserState(
    profile: UserProfile | null,
    personalization: PersonalizationState | null,
    healthRecord: HealthDayRecord | null,
    mss: number,
    currentAFI: number,
    meditationSessionCount: number,
    meditationTotalMinutes: number,
    meditationAvgRating: number,
): UserState {
    return {
        timestamp: Date.now(),
        static: extractStaticTraits(profile),
        semiDynamic: extractSemiDynamicSignals(
            personalization,
            meditationSessionCount,
            meditationTotalMinutes,
            meditationAvgRating,
        ),
        dynamic: extractDynamicSignals(healthRecord, mss, currentAFI),
        behavioral: extractBehavioralSignals(personalization),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Defaults (for when stores aren't initialized)
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_STATIC: StaticTraits = {
    conscientiousness: 4, neuroticism: 4, openness: 4,
    agreeableness: 4, extraversion: 4,
    impulsivityIndex: 0.5, authorityResistance: 0.3,
    selfEfficacy: 0.5, emotionalReactivity: 0.5,
    motivationType: 'mixed', goalCategory: 'personal',
    nudgeTone: 'supportive',
};

const DEFAULT_SEMI_DYNAMIC: SemiDynamicSignals = {
    goalUrgency: 0.5, habitStreak: 0, habitStrength: 0,
    attentionTrend: 'stable', complianceTrend: 'stable',
    weeklyFocusMinutes: 0, totalSessionCount: 0,
    averageMeditationRating: 3,
};

const DEFAULT_DYNAMIC: DynamicSignals = {
    cognitiveReadiness: 0.5, meditationSuitability: 50,
    hrvState: -1, hrvNormalized: 0.5,
    stressLevel: 2, fatigueLevel: 2,
    sleepHours: 7, sleepQuality: 3,
    attentionCapacity: { level: 'moderate', minutes: 25 },
    currentAFI: 0.5,
    timeOfDay: 'morning', hourOfDay: 9,
};

const DEFAULT_BEHAVIORAL: BehavioralSignals = {
    distractionRate: 0.3, complianceRate: 0.7,
    overrideFrequency: 0.1, sessionSurvivalRate: 0.7,
    nudgeDismissRate: 0.2, consecutiveDismissals: 0,
    interventionFatigue: 0.1,
    lastSessionWasSuccessful: true,
    daysSinceLastFocus: 0,
};
