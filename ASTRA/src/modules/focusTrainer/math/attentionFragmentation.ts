// ─────────────────────────────────────────────────────────────────────────────
// Model 1: Attention Fragmentation Index (AFI)
// AFI = αS + βU + γ(1/D) + δH
// ─────────────────────────────────────────────────────────────────────────────

import { AppUsageSession, AFIResult } from '../models/types';
import { AFI_WEIGHTS, AFI_THRESHOLDS, NORM_RANGES } from '../models/constants';
import {
    minMaxNormalize,
    normalizedEntropy,
    safeDivide,
    clamp,
} from './normalize';

/**
 * Compute the Attention Fragmentation Index from raw usage sessions.
 *
 * Inputs are normalized to [0,1] before weighting:
 *   S = app switches per hour (normalized)
 *   U = unlocks per hour (normalized)
 *   D = average session duration → 1/D (inverted, normalized)
 *   H = normalized Shannon entropy of app time distribution
 *
 * @param sessions  App usage sessions within the measurement window
 * @param windowMs  Duration of the measurement window in ms
 * @returns AFIResult with score 0–1 and classification
 */
export function computeAFI(
    sessions: AppUsageSession[],
    windowMs: number,
): AFIResult {
    if (sessions.length === 0 || windowMs <= 0) {
        return {
            score: 0,
            level: 'deep',
            switchesPerHour: 0,
            unlocksPerHour: 0,
            avgSessionDuration: 0,
            entropy: 0,
        };
    }

    const windowHours = windowMs / (1000 * 60 * 60);

    // ── S: Switches per hour ────────────────────────────────────────────────
    const totalSwitches = sessions.reduce((s, ses) => s + ses.switchCount, 0);
    const switchesPerHour = safeDivide(totalSwitches, windowHours);
    const S = minMaxNormalize(
        switchesPerHour,
        NORM_RANGES.switchesPerHour.min,
        NORM_RANGES.switchesPerHour.max,
    );

    // ── U: Unlocks per hour ─────────────────────────────────────────────────
    const totalUnlocks = sessions.reduce((s, ses) => s + ses.unlockCount, 0);
    const unlocksPerHour = safeDivide(totalUnlocks, windowHours);
    const U = minMaxNormalize(
        unlocksPerHour,
        NORM_RANGES.unlocksPerHour.min,
        NORM_RANGES.unlocksPerHour.max,
    );

    // ── D: Average session duration (inverted) ──────────────────────────────
    const avgDuration =
        sessions.reduce((s, ses) => s + ses.duration, 0) / sessions.length;
    // Invert: shorter sessions → higher fragmentation
    const inverseDuration = safeDivide(1, avgDuration, 1);
    const maxInverse = safeDivide(1, NORM_RANGES.avgSessionDuration.min, 1);
    const minInverse = safeDivide(1, NORM_RANGES.avgSessionDuration.max, 0);
    const D = minMaxNormalize(inverseDuration, minInverse, maxInverse);

    // ── H: Normalized Shannon entropy of app time distribution ──────────────
    const appTimeMap = new Map<string, number>();
    for (const ses of sessions) {
        appTimeMap.set(
            ses.packageName,
            (appTimeMap.get(ses.packageName) || 0) + ses.duration,
        );
    }
    const appTimes = Array.from(appTimeMap.values());
    const H = normalizedEntropy(appTimes);

    // ── Weighted sum ────────────────────────────────────────────────────────
    const { alpha, beta, gamma, delta } = AFI_WEIGHTS;
    const score = clamp(alpha * S + beta * U + gamma * D + delta * H, 0, 1);

    // ── Classification ──────────────────────────────────────────────────────
    let level: AFIResult['level'];
    if (score < AFI_THRESHOLDS.deep) {
        level = 'deep';
    } else if (score < AFI_THRESHOLDS.moderate) {
        level = 'moderate';
    } else {
        level = 'fragmented';
    }

    return {
        score,
        level,
        switchesPerHour,
        unlocksPerHour,
        avgSessionDuration: avgDuration,
        entropy: H,
    };
}
