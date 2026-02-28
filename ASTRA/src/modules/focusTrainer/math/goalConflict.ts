// ─────────────────────────────────────────────────────────────────────────────
// Model 4: Goal Conflict Score (GCS)
// GCS = Goal_importance × Context_mismatch × DS_i
// ─────────────────────────────────────────────────────────────────────────────

import { FocusGoal, GoalConflictResult } from '../models/types';
import { GOAL_CONFLICT_ESCALATION_THRESHOLD } from '../models/constants';
import { clamp } from './normalize';

/**
 * Compute Goal Conflict Score.
 *
 * GCS = goal.importance × contextMismatch × distractivenessScore
 *
 * Where:
 *   goal.importance  = 0–1 (how important the active goal is)
 *   contextMismatch  = 0–1 (how mismatched the current app usage is with the goal)
 *   distractivenessScore = DS_i for the currently used app
 *
 * If GCS > threshold → escalate intervention.
 *
 * @param goal             Active focus goal
 * @param contextMismatch  How mismatched current usage is (0 = aligned, 1 = conflicting)
 * @param dsScore          Distractiveness score of the app being used
 * @returns GoalConflictResult with score and escalation flag
 */
export function computeGoalConflict(
    goal: FocusGoal,
    contextMismatch: number,
    dsScore: number,
): GoalConflictResult {
    const importance = clamp(goal.importance, 0, 1);
    const mismatch = clamp(contextMismatch, 0, 1);
    const ds = clamp(dsScore, 0, 1);

    const score = clamp(importance * mismatch * ds, 0, 1);

    return {
        score,
        shouldEscalate: score > GOAL_CONFLICT_ESCALATION_THRESHOLD,
    };
}

/**
 * Determine context mismatch for a given app and goal.
 *
 * If the app is in the goal's allowed list → mismatch = 0
 * Otherwise → mismatch based on time into the focus window
 *
 * @param appPackageName  Package name of the current app
 * @param goal            Active focus goal
 * @param currentTime     Current epoch ms
 * @returns Context mismatch score 0–1
 */
export function computeContextMismatch(
    appPackageName: string,
    goal: FocusGoal,
    currentTime: number,
): number {
    // App is explicitly allowed for this goal
    if (goal.associatedApps.includes(appPackageName)) {
        return 0;
    }

    // Not in a scheduled window → lower mismatch
    if (!goal.scheduledStart || !goal.scheduledEnd) {
        return 0.5; // moderate mismatch for unscheduled goals
    }

    // In scheduled window → high mismatch
    if (currentTime >= goal.scheduledStart && currentTime <= goal.scheduledEnd) {
        // Deeper into the window = slightly higher mismatch
        const progress = (currentTime - goal.scheduledStart) /
            (goal.scheduledEnd - goal.scheduledStart);
        return clamp(0.7 + 0.3 * progress, 0.7, 1.0);
    }

    // Outside scheduled window
    return 0.3;
}
