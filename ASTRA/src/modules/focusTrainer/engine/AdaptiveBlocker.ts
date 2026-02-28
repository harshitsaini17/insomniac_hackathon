// ─────────────────────────────────────────────────────────────────────────────
// Adaptive Blocker — Three-level blocking engine
// Level 1: Reflective popup  |  Level 2: Soft delay  |  Level 3: Hard block
// ─────────────────────────────────────────────────────────────────────────────

import {
    BlockingLevel,
    FocusGoal,
    NudgeType,
    DistractivenessResult,
    StrictnessResult,
    ComplianceResult,
    GoalConflictResult,
} from '../models/types';
import { clamp } from '../math/normalize';

export interface BlockingDecision {
    shouldBlock: boolean;
    level: BlockingLevel;
    nudgeType: NudgeType;
    message: string;
    delaySeconds?: number;  // for Level 2
}

/**
 * Determine what blocking level to apply for a given app.
 *
 * Decision factors:
 *   1. Is the app classified as distractive?
 *   2. Personality-based strictness (recommended max level)
 *   3. Compliance probability (low compliance → escalate)
 *   4. Goal conflict score (high conflict → escalate)
 *   5. Is the user in an active focus session?
 *
 * Level 1: Reflective popup — "Is this helping your goal of [X]?"
 * Level 2: Soft delay — 10–15s countdown before app opens
 * Level 3: Hard block — Cannot open during focus window
 *
 * User override is ALWAYS respected.
 */
export function computeBlockingDecision(params: {
    appResult: DistractivenessResult;
    strictness: StrictnessResult;
    compliance: ComplianceResult;
    goalConflict: GoalConflictResult;
    activeGoal: FocusGoal | null;
    isInFocusSession: boolean;
    userBlockingOverride?: BlockingLevel | null;
}): BlockingDecision {
    const {
        appResult,
        strictness,
        compliance,
        goalConflict,
        activeGoal,
        isInFocusSession,
        userBlockingOverride,
    } = params;

    // ── Not distractive → no block ─────────────────────────────────────────
    if (!appResult.isDistractive) {
        return {
            shouldBlock: false,
            level: 1,
            nudgeType: 'reflective',
            message: '',
        };
    }

    // ── Determine base level from personality strictness ────────────────────
    let level = strictness.recommendedLevel;

    // ── Escalate if compliance is low ───────────────────────────────────────
    if (compliance.shouldEscalate && level < 3) {
        level = Math.min(level + 1, 3) as BlockingLevel;
    }

    // ── Escalate if goal conflict is high ───────────────────────────────────
    if (goalConflict.shouldEscalate && level < 3) {
        level = Math.min(level + 1, 3) as BlockingLevel;
    }

    // ── In focus session → at least Level 2 ─────────────────────────────────
    if (isInFocusSession && level < 2) {
        level = 2;
    }

    // ── Apply user override (always respected) ──────────────────────────────
    if (userBlockingOverride !== null && userBlockingOverride !== undefined) {
        level = userBlockingOverride;
    }

    // ── Cap at strictness recommended maximum ───────────────────────────────
    // (unless explicitly overridden by user)
    if (userBlockingOverride === null || userBlockingOverride === undefined) {
        level = Math.min(level, strictness.recommendedLevel) as BlockingLevel;
    }

    // ── Generate decision ──────────────────────────────────────────────────
    return buildDecision(level, appResult, activeGoal);
}

/**
 * Build the final blocking decision with message and parameters.
 */
function buildDecision(
    level: BlockingLevel,
    app: DistractivenessResult,
    goal: FocusGoal | null,
): BlockingDecision {
    const goalName = goal?.title || 'your goals';

    switch (level) {
        case 1:
            return {
                shouldBlock: true,
                level: 1,
                nudgeType: 'reflective',
                message: `Is opening ${app.appName} helping your goal of "${goalName}"?`,
            };

        case 2:
            return {
                shouldBlock: true,
                level: 2,
                nudgeType: 'soft-delay',
                message: `Take a moment to reconsider. ${app.appName} will open in 10 seconds.`,
                delaySeconds: 10 + Math.floor(Math.random() * 6), // 10–15 seconds
            };

        case 3:
            return {
                shouldBlock: true,
                level: 3,
                nudgeType: 'hard-block',
                message: `${app.appName} is blocked during your focus session for "${goalName}".`,
            };
    }
}
