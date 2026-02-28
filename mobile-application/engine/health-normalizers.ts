/**
 * ASTRA Health Module — Normalizer Functions
 * All normalizers return 0..100.
 *
 * Research references:
 * - Sleep & exec fn: quadratic optimum ~7h (PMC population study)
 * - HRV & vigilance: HRV explains ~33% PVT variance
 * - Hydration: 1–2% dehydration impairs cognition
 * - Aerobic exercise: cardio beneficial for cognition (review)
 */

import {
    SLEEP_MU,
    SLEEP_SIGMA,
    HRV_BASELINE_MS,
    HYDRATION_ML_PER_KG,
    DEFAULT_HYDRATION_TARGET_ML,
    SEDENTARY_MAX_HOURS,
    EXERCISE_IDEAL_MINUTES,
    EXERCISE_ZERO_FLOOR,
} from '@/constants/health-constants';

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * 1) normalize_sleep(hours)
 * Gaussian-like penalty around optimal 7h.
 * score = 100 * exp(-0.5 * ((x - mu)/sigma)^2)
 */
export function normalizeSleep(hours: number): number {
    const z = (hours - SLEEP_MU) / SLEEP_SIGMA;
    const score = 100 * Math.exp(-0.5 * z * z);
    return clamp(Math.round(score), 0, 100);
}

/**
 * 2) normalize_sleep_quality(q)
 * q in 1..5 → linear map to 0..100
 */
export function normalizeSleepQuality(q: number): number {
    return clamp(Math.round(((q - 1) / 4) * 100), 0, 100);
}

/**
 * 3) normalize_stress(level)
 * level in 1..5, lower is better → inverse linear
 */
export function normalizeStress(level: number): number {
    return clamp(Math.round((1 - (level - 1) / 4) * 100), 0, 100);
}

/**
 * 4) normalize_fatigue(level)
 * level in 1..5, lower is better → inverse linear
 */
export function normalizeFatigue(level: number): number {
    return clamp(Math.round((1 - (level - 1) / 4) * 100), 0, 100);
}

/**
 * 5) normalize_exercise(mins)
 * 0 mins → floor of 20, linear up to 100 at EXERCISE_IDEAL_MINUTES
 */
export function normalizeExercise(mins: number): number {
    if (mins <= 0) return EXERCISE_ZERO_FLOOR;
    return clamp(Math.round(Math.min(100, (mins / EXERCISE_IDEAL_MINUTES) * 100)), 0, 100);
}

/**
 * 6) normalize_sedentary(hours)
 * 0h → 100, SEDENTARY_MAX_HOURS → 0
 */
export function normalizeSedentary(hours: number): number {
    return clamp(Math.round(100 * (1 - hours / SEDENTARY_MAX_HOURS)), 0, 100);
}

/**
 * 7) normalize_hydration(water_ml, weight_kg?)
 * Target = 35 ml/kg/day or 2000ml default
 */
export function normalizeHydration(waterMl: number, weightKg?: number): number {
    const target = weightKg ? HYDRATION_ML_PER_KG * weightKg : DEFAULT_HYDRATION_TARGET_ML;
    return clamp(Math.round(Math.min(100, (waterMl / target) * 100)), 0, 100);
}

/**
 * 8) normalize_hrv(hrv_ms)
 * RMSSD: 50ms → 100. Linear, capped 0..100.
 */
export function normalizeHRV(hrvMs: number): number {
    return clamp(Math.round((hrvMs / HRV_BASELINE_MS) * 100), 0, 100);
}

/**
 * Get hydration target for display purposes.
 */
export function getHydrationTarget(weightKg?: number): number {
    return weightKg ? HYDRATION_ML_PER_KG * weightKg : DEFAULT_HYDRATION_TARGET_ML;
}
