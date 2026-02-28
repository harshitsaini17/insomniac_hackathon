// ─────────────────────────────────────────────────────────────────────────────
// Nudge Manager — Rate-limited intervention delivery
// Max 3–5 nudges per day, respects cooldowns
// ─────────────────────────────────────────────────────────────────────────────

import { NudgeRecord, NudgeType, BlockingLevel } from '../models/types';
import { NUDGE_LIMITS } from '../models/constants';

export interface NudgeState {
    todayCount: number;
    lastNudgeTime: number;      // epoch ms
    lastDismissTime: number;    // epoch ms
    dailyResetDate: string;     // YYYY-MM-DD
}

/**
 * Check if a nudge can be delivered right now.
 *
 * Rate-limiting rules:
 *   1. Max 5 nudges per day
 *   2. Minimum 30 minutes between nudges
 *   3. 1 hour cooldown after a dismiss
 *
 * @param state  Current nudge state
 * @param now    Current epoch ms
 * @returns Whether a nudge is allowed and reason if not
 */
export function canDeliverNudge(
    state: NudgeState,
    now: number,
): { allowed: boolean; reason?: string } {
    // Check daily reset
    const today = new Date(now).toISOString().split('T')[0];
    const effectiveCount = state.dailyResetDate === today ? state.todayCount : 0;

    // Rule 1: Daily limit
    if (effectiveCount >= NUDGE_LIMITS.maxPerDay) {
        return {
            allowed: false,
            reason: `Daily limit reached (${NUDGE_LIMITS.maxPerDay} nudges). Will reset tomorrow.`,
        };
    }

    // Rule 2: Minimum interval
    if (state.lastNudgeTime > 0) {
        const elapsed = now - state.lastNudgeTime;
        if (elapsed < NUDGE_LIMITS.minIntervalMs) {
            const remaining = Math.ceil(
                (NUDGE_LIMITS.minIntervalMs - elapsed) / 60000,
            );
            return {
                allowed: false,
                reason: `Cooldown active. Next nudge available in ${remaining} minutes.`,
            };
        }
    }

    // Rule 3: Post-dismiss cooldown
    if (state.lastDismissTime > 0) {
        const elapsed = now - state.lastDismissTime;
        if (elapsed < NUDGE_LIMITS.cooldownAfterDismiss) {
            const remaining = Math.ceil(
                (NUDGE_LIMITS.cooldownAfterDismiss - elapsed) / 60000,
            );
            return {
                allowed: false,
                reason: `Post-dismiss cooldown. Next nudge in ${remaining} minutes.`,
            };
        }
    }

    return { allowed: true };
}

/**
 * Record a nudge delivery and update state.
 */
export function recordNudgeDelivery(
    state: NudgeState,
    now: number,
): NudgeState {
    const today = new Date(now).toISOString().split('T')[0];

    return {
        todayCount: state.dailyResetDate === today ? state.todayCount + 1 : 1,
        lastNudgeTime: now,
        lastDismissTime: state.lastDismissTime,
        dailyResetDate: today,
    };
}

/**
 * Record a nudge dismissal (user said "no").
 */
export function recordNudgeDismissal(
    state: NudgeState,
    now: number,
): NudgeState {
    return {
        ...state,
        lastDismissTime: now,
    };
}

/**
 * Create a NudgeRecord for logging.
 */
export function createNudgeRecord(params: {
    type: NudgeType;
    level: BlockingLevel;
    targetApp: string;
    goalId?: string;
    wasAccepted: boolean;
    message: string;
}): NudgeRecord {
    return {
        timestamp: Date.now(),
        ...params,
    };
}

/**
 * Get initial nudge state.
 */
export function getInitialNudgeState(): NudgeState {
    return {
        todayCount: 0,
        lastNudgeTime: 0,
        lastDismissTime: 0,
        dailyResetDate: new Date().toISOString().split('T')[0],
    };
}
