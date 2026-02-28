// ─────────────────────────────────────────────────────────────────────────────
// Attention Evolution Tracking — Survival-Model Focus Tracking
// ─────────────────────────────────────────────────────────────────────────────

import {
    AttentionEvolution,
    SessionSnapshot,
    AttentionTrend,
} from '../models/personalizationTypes';
import { ATTENTION_CONFIG } from '../models/personalizationConstants';

/**
 * Record a completed focus session and update attention evolution.
 *
 * Tracks E[T] (expected focus time) via moving average,
 * adapts recommended session length based on success rate:
 *   success rate > 80% → grow by 8%
 *   success rate < 50% → shrink by 10%
 *   otherwise → hold at E[T]
 */
export function recordFocusSession(
    state: AttentionEvolution,
    session: SessionSnapshot,
): AttentionEvolution {
    // Add session to history (cap at maxHistory)
    const history = [...state.sessionHistory, session].slice(-ATTENTION_CONFIG.maxHistory);

    // Recent window for calculations
    const recent = history.slice(-ATTENTION_CONFIG.windowSize);

    // Compute E[T] — moving average of actual durations
    const totalDuration = recent.reduce((sum, s) => sum + s.duration, 0);
    const expectedFocusTime = recent.length > 0 ? totalDuration / recent.length : ATTENTION_CONFIG.defaultSessionLength;

    // Compute success rate
    const successCount = recent.filter(s => s.wasSuccessful).length;
    const successRate = recent.length > 0 ? successCount / recent.length : 0.5;

    // Determine adjustment factor
    let growthFactor: number;
    if (successRate >= ATTENTION_CONFIG.successThreshold) {
        growthFactor = ATTENTION_CONFIG.growthFactor;
    } else if (successRate < ATTENTION_CONFIG.failureThreshold) {
        growthFactor = ATTENTION_CONFIG.shrinkFactor;
    } else {
        growthFactor = 1.0;
    }

    // Calculate recommended session length
    const rawRecommended = expectedFocusTime * growthFactor;
    const recommendedSessionLength = clamp(
        rawRecommended,
        ATTENTION_CONFIG.minSessionLength,
        ATTENTION_CONFIG.maxSessionLength,
    );

    // Determine trend
    const trend = computeAttentionTrend(history);

    return {
        expectedFocusTime: Math.round(expectedFocusTime),
        successRate,
        sessionHistory: history,
        trend,
        recommendedSessionLength: Math.round(recommendedSessionLength),
        growthFactor,
    };
}

/**
 * Compute attention trend by comparing recent sessions vs earlier.
 */
export function computeAttentionTrend(
    history: SessionSnapshot[],
): AttentionTrend {
    if (history.length < 6) return 'stable';

    const mid = Math.floor(history.length / 2);
    const earlier = history.slice(Math.max(0, mid - 5), mid);
    const later = history.slice(-5);

    if (earlier.length < 3 || later.length < 3) return 'stable';

    const earlierAvg = earlier.reduce((s, h) => s + h.duration, 0) / earlier.length;
    const laterAvg = later.reduce((s, h) => s + h.duration, 0) / later.length;

    const change = (laterAvg - earlierAvg) / (earlierAvg || 1);

    if (change > 0.10) return 'improving';
    if (change < -0.10) return 'declining';
    return 'stable';
}

/**
 * Get the recommended focus session length.
 * Falls back to default if no history.
 */
export function getRecommendedSessionLength(state: AttentionEvolution): number {
    if (state.sessionHistory.length === 0) {
        return ATTENTION_CONFIG.defaultSessionLength;
    }
    return state.recommendedSessionLength;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}
