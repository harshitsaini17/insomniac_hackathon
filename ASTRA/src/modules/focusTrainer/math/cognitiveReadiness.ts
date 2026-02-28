// ─────────────────────────────────────────────────────────────────────────────
// Model 7: Cognitive Readiness Score (CRS)
// CRS = a*(sleep) + b*(HRV) + c*(activity) − d*(AFI_recent)
// ─────────────────────────────────────────────────────────────────────────────

import { HealthSignals, CRSResult } from '../models/types';
import { CRS_WEIGHTS, CRS_THRESHOLDS } from '../models/constants';
import { clamp } from './normalize';

/**
 * Compute Cognitive Readiness Score.
 *
 * CRS = a*sleep_quality + b*hrv_normalized + c*activity_level − d*AFI_recent
 *
 * All inputs should be normalized to [0, 1].
 *
 * Recommendation mapping:
 *   CRS ≥ 0.65  → focus session
 *   0.40–0.65   → meditation
 *   0.25–0.40   → exercise
 *   < 0.25      → rest
 *
 * @param health     Latest health signals (normalized)
 * @param recentAFI  Most recent AFI score (0–1)
 * @returns CRSResult with score and activity recommendation
 */
export function computeCRS(
    health: HealthSignals,
    recentAFI: number,
): CRSResult {
    const { a, b, c, d } = CRS_WEIGHTS;

    const sleepQ = clamp(health.sleepQuality, 0, 1);
    const hrv = clamp(health.hrvNormalized, 0, 1);
    const activity = clamp(health.activityLevel, 0, 1);
    const afi = clamp(recentAFI, 0, 1);

    const score = clamp(
        a * sleepQ + b * hrv + c * activity - d * afi,
        0,
        1,
    );

    const recommendation = getRecommendation(score);

    return { score, recommendation };
}

/**
 * Map CRS score to activity recommendation
 */
function getRecommendation(
    score: number,
): CRSResult['recommendation'] {
    if (score >= CRS_THRESHOLDS.focus) return 'focus';
    if (score >= CRS_THRESHOLDS.meditation) return 'meditation';
    if (score >= CRS_THRESHOLDS.exercise) return 'exercise';
    return 'rest';
}

/**
 * Generate a human-readable suggestion based on CRS
 */
export function getCRSSuggestion(result: CRSResult): string {
    switch (result.recommendation) {
        case 'focus':
            return `Your cognitive readiness is high (${(result.score * 100).toFixed(0)}%). Great time for a deep focus session!`;
        case 'meditation':
            return `Your readiness is moderate (${(result.score * 100).toFixed(0)}%). Try a short meditation to sharpen your focus.`;
        case 'exercise':
            return `Your readiness is low (${(result.score * 100).toFixed(0)}%). Light exercise could boost your cognitive state.`;
        case 'rest':
            return `Your readiness is very low (${(result.score * 100).toFixed(0)}%). Consider resting or taking a break.`;
    }
}
