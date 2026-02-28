// ─────────────────────────────────────────────────────────────────────────────
// Model 5: Pomodoro Optimization via Survival Modeling
// Adaptive session length based on distraction survival time
// ─────────────────────────────────────────────────────────────────────────────

import { PomodoroSession, PomodoroOptimizationResult } from '../models/types';
import { POMODORO_DEFAULTS } from '../models/constants';
import { clamp, movingAverage } from './normalize';

/**
 * Compute optimal next Pomodoro session length using survival analysis.
 *
 * For each past session:
 *   Event = distraction occurred (wasSuccessful = false)
 *   Time  = actualDuration (how long before distraction / completion)
 *
 * E[T] = moving average of actual focus durations
 *
 * Decision logic (over last N sessions):
 *   If success rate > 80%  → increase by growth_factor (5–10%)
 *   If success rate < 50%  → decrease by shrink_factor
 *   Otherwise              → keep at E[T]
 *
 * Next session = E[T] × adjustment_factor
 *
 * @param history  Array of past PomodoroSessions (most recent last)
 * @returns PomodoroOptimizationResult with next duration and metrics
 */
export function computeNextSessionLength(
    history: PomodoroSession[],
): PomodoroOptimizationResult {
    const {
        initialDuration,
        minDuration,
        maxDuration,
        growthFactor,
        shrinkFactor,
        successThreshold,
        failureThreshold,
        windowSize,
    } = POMODORO_DEFAULTS;

    // No history → use default
    if (history.length === 0) {
        return {
            nextDuration: initialDuration,
            expectedFocusTime: initialDuration,
            successRate: 0,
            growthFactor: 1.0,
        };
    }

    // ── Compute E[T] = expected focus time ──────────────────────────────────
    const recentSessions = history.slice(-windowSize);
    const durations = recentSessions.map(s => s.actualDuration);
    const expectedFocusTime = movingAverage(durations, windowSize);

    // ── Compute success rate ────────────────────────────────────────────────
    const successCount = recentSessions.filter(s => s.wasSuccessful).length;
    const successRate = successCount / recentSessions.length;

    // ── Determine adjustment factor ────────────────────────────────────────
    let factor: number;
    if (successRate >= successThreshold) {
        // Doing great — grow the session length
        factor = growthFactor;
    } else if (successRate < failureThreshold) {
        // Struggling — shorten the session
        factor = shrinkFactor;
    } else {
        // Stable — maintain current expected time
        factor = 1.0;
    }

    // ── Calculate next duration ─────────────────────────────────────────────
    const rawNext = expectedFocusTime * factor;
    const nextDuration = clamp(rawNext, minDuration, maxDuration);

    return {
        nextDuration: Math.round(nextDuration),
        expectedFocusTime: Math.round(expectedFocusTime),
        successRate,
        growthFactor: factor,
    };
}

/**
 * Determine break duration based on session count.
 * Every longBreakInterval sessions → long break.
 */
export function computeBreakDuration(completedSessions: number): number {
    const { breakDuration, longBreakDuration, longBreakInterval } = POMODORO_DEFAULTS;

    if (completedSessions > 0 && completedSessions % longBreakInterval === 0) {
        return longBreakDuration;
    }
    return breakDuration;
}

/**
 * Check if a session should be considered successful.
 * A session is successful if the user focused for at least 90% of the planned duration.
 */
export function isSessionSuccessful(
    actualDuration: number,
    plannedDuration: number,
): boolean {
    if (plannedDuration <= 0) return false;
    return actualDuration / plannedDuration >= 0.90;
}
