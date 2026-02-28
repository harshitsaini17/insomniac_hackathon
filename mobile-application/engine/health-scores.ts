/**
 * ASTRA Health Module — Composite Score Computation
 * Combines normalized sub-scores into RecoveryScore, LifestyleScore,
 * CognitiveReadiness, and AttentionCapacity.
 */

import type { DailyHealthInput, ComputedHealthScores, AttentionCapacity } from '@/types';
import {
    normalizeSleep,
    normalizeSleepQuality,
    normalizeStress,
    normalizeFatigue,
    normalizeExercise,
    normalizeSedentary,
    normalizeHydration,
    normalizeHRV,
    clamp,
} from './health-normalizers';
import {
    RECOVERY_SLEEP_WEIGHT,
    RECOVERY_HRV_WEIGHT,
    RECOVERY_STRESS_WEIGHT,
    SLEEP_SCORE_HOURS_WEIGHT,
    SLEEP_SCORE_QUALITY_WEIGHT,
    LIFESTYLE_EXERCISE_WEIGHT,
    LIFESTYLE_HYDRATION_WEIGHT,
    LIFESTYLE_SEDENTARY_WEIGHT,
    COGNITIVE_RECOVERY_WEIGHT,
    COGNITIVE_LIFESTYLE_WEIGHT,
    HRV_DEFAULT_SCORE,
    ATTENTION_HIGH_THRESHOLD,
    ATTENTION_MODERATE_THRESHOLD,
    ATTENTION_LIGHT_THRESHOLD,
    ATTENTION_HIGH_MINUTES,
    ATTENTION_MODERATE_MINUTES,
    ATTENTION_LIGHT_MINUTES,
    ATTENTION_RECOVERY_MINUTES,
} from '@/constants/health-constants';

/**
 * Map CognitiveReadiness score to an attention capacity recommendation.
 */
export function mapReadinessToAttention(score: number): AttentionCapacity {
    if (score >= ATTENTION_HIGH_THRESHOLD)
        return { level: 'high', minutes: ATTENTION_HIGH_MINUTES };
    if (score >= ATTENTION_MODERATE_THRESHOLD)
        return { level: 'moderate', minutes: ATTENTION_MODERATE_MINUTES };
    if (score >= ATTENTION_LIGHT_THRESHOLD)
        return { level: 'light', minutes: ATTENTION_LIGHT_MINUTES };
    return { level: 'recovery', minutes: ATTENTION_RECOVERY_MINUTES };
}

/**
 * Compute all health scores for a single day's input.
 */
export function computeDayScores(input: DailyHealthInput): ComputedHealthScores {
    // 1. Individual sub-scores
    const sleepScore = normalizeSleep(input.sleep_hours);
    const sleepQualityScore = normalizeSleepQuality(input.sleep_quality);
    const stressScore = normalizeStress(input.stress_level);
    const fatigueScore = normalizeFatigue(input.fatigue_level);
    const exerciseScore = normalizeExercise(input.exercise_minutes);
    const hydrationScore = normalizeHydration(input.water_ml, input.weight_kg);
    const sedentaryScore = normalizeSedentary(input.sedentary_hours);
    const hrvScore = input.hrv_rmssd_ms != null
        ? normalizeHRV(input.hrv_rmssd_ms)
        : HRV_DEFAULT_SCORE;

    // 2. Composite: SleepScore (blended hours + quality)
    const SleepScore = Math.round(
        SLEEP_SCORE_HOURS_WEIGHT * sleepScore +
        SLEEP_SCORE_QUALITY_WEIGHT * sleepQualityScore
    );

    // 3. RecoveryScore = 0.55*SleepScore + 0.25*HRVScore + 0.20*StressScore
    const RecoveryScore = Math.round(
        RECOVERY_SLEEP_WEIGHT * SleepScore +
        RECOVERY_HRV_WEIGHT * hrvScore +
        RECOVERY_STRESS_WEIGHT * stressScore
    );

    // 4. LifestyleScore = 0.45*Exercise + 0.35*Hydration + 0.20*Sedentary
    const LifestyleScore = Math.round(
        LIFESTYLE_EXERCISE_WEIGHT * exerciseScore +
        LIFESTYLE_HYDRATION_WEIGHT * hydrationScore +
        LIFESTYLE_SEDENTARY_WEIGHT * sedentaryScore
    );

    // 5. CognitiveReadiness = 0.6*Recovery + 0.4*Lifestyle
    const CognitiveReadiness = clamp(
        Math.round(
            COGNITIVE_RECOVERY_WEIGHT * RecoveryScore +
            COGNITIVE_LIFESTYLE_WEIGHT * LifestyleScore
        ),
        0,
        100
    );

    // 6. Attention
    const attention = mapReadinessToAttention(CognitiveReadiness);

    return {
        SleepScore,
        SleepQualityScore: sleepQualityScore,
        HRVScore: hrvScore,
        StressScore: stressScore,
        FatigueScore: fatigueScore,
        RecoveryScore,
        ExerciseScore: exerciseScore,
        HydrationScore: hydrationScore,
        SedentaryScore: sedentaryScore,
        LifestyleScore,
        CognitiveReadiness,
        AttentionCapacity: attention,
    };
}
