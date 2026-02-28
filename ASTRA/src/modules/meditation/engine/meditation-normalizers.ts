/**
 * ASTRA Meditation Module — Normalizers
 *
 * Pure functions mapping raw inputs → 0..100 scores.
 * Ref: PMC6088366 (stress normalization), PMC9899909 (HRV normalization)
 */

import {
    STRESS_MAX,
    FATIGUE_MAX,
    MOOD_MAX,
    TIME_MAX_MINUTES,
    HRV_BASELINE_MEDITATION,
    EXPERIENCE_SCORES,
} from '@/constants/meditation-constants';

/** Clamp a value between min and max. */
export function clampMed(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/**
 * Normalize stress (1–5) → 0–100.
 * Higher stress → HIGHER readiness for relaxation meditation.
 * Inverted: stress 5 → 100 (most need), stress 1 → 20.
 */
export function normalizeStress(stress: number): number {
    return clampMed(((stress - 1) / (STRESS_MAX - 1)) * 100, 0, 100);
}

/**
 * Normalize fatigue (1–5) → 0–100.
 * Higher fatigue → HIGHER readiness for recovery.
 */
export function normalizeFatigue(fatigue: number): number {
    return clampMed(((fatigue - 1) / (FATIGUE_MAX - 1)) * 100, 0, 100);
}

/**
 * Normalize mood (1–5) → 0–100.
 * Higher mood → higher activation readiness.
 */
export function normalizeMood(mood: number): number {
    return clampMed(((mood - 1) / (MOOD_MAX - 1)) * 100, 0, 100);
}

/**
 * Normalize available time (minutes) → 0–100.
 * 0 min → 0, ≥30 min → 100 (linear).
 */
export function normalizeTime(minutes: number): number {
    return clampMed((minutes / TIME_MAX_MINUTES) * 100, 0, 100);
}

/**
 * Normalize experience level → 0–100.
 */
export function normalizeExperience(level: string): number {
    return EXPERIENCE_SCORES[level] ?? 50;
}

/**
 * Normalize HRV RMSSD → 0–100.
 * Baseline 50ms = 100. Higher HRV = better parasympathetic tone.
 * Ref: PMC9899909 — HRV biofeedback correlation with meditation depth.
 */
export function normalizeHRV(hrv?: number): number {
    if (hrv == null) return 50; // neutral when absent
    return clampMed((hrv / HRV_BASELINE_MEDITATION) * 100, 0, 100);
}
