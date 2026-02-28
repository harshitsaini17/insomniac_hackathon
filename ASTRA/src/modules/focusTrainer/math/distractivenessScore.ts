// ─────────────────────────────────────────────────────────────────────────────
// Model 2: Distractiveness Score (DS) — Per App
// DS_i = w1*T_i + w2*F_i + w3*C_i
// ─────────────────────────────────────────────────────────────────────────────

import { AppDailyStats, DistractivenessResult } from '../models/types';
import { DS_WEIGHTS, DS_THRESHOLD, NORM_RANGES } from '../models/constants';
import { minMaxNormalize, clamp } from './normalize';

/**
 * Compute Distractiveness Score for each app.
 *
 * For each app i:
 *   T_i = normalized average daily time
 *   F_i = normalized open frequency
 *   C_i = conflict during scheduled focus (already 0–1)
 *
 * DS_i = w1*T_i + w2*F_i + w3*C_i
 *
 * If DS_i > threshold → classify as distractive
 *
 * @param appsStats  Array of per-app daily aggregated stats
 * @returns Array of DistractivenessResult (one per app)
 */
export function computeDistractivenessScores(
    appsStats: AppDailyStats[],
): DistractivenessResult[] {
    return appsStats.map(app => computeSingleDS(app));
}

/**
 * Compute DS for a single app
 */
export function computeSingleDS(app: AppDailyStats): DistractivenessResult {
    const { w1, w2, w3 } = DS_WEIGHTS;

    // Normalize inputs to [0, 1]
    const T = minMaxNormalize(
        app.totalTime,
        NORM_RANGES.dailyAppTime.min,
        NORM_RANGES.dailyAppTime.max,
    );

    const F = minMaxNormalize(
        app.openFrequency,
        NORM_RANGES.openFrequency.min,
        NORM_RANGES.openFrequency.max,
    );

    // C is already 0–1
    const C = clamp(app.conflictDuringFocus, 0, 1);

    const score = clamp(w1 * T + w2 * F + w3 * C, 0, 1);

    return {
        appName: app.appName,
        packageName: app.packageName,
        score,
        isDistractive: score > DS_THRESHOLD,
    };
}

/**
 * Filter only distractive apps from results
 */
export function getDistractiveApps(
    results: DistractivenessResult[],
): DistractivenessResult[] {
    return results.filter(r => r.isDistractive);
}

/**
 * Rank apps by distractiveness (highest first)
 */
export function rankByDistractiveness(
    results: DistractivenessResult[],
): DistractivenessResult[] {
    return [...results].sort((a, b) => b.score - a.score);
}
