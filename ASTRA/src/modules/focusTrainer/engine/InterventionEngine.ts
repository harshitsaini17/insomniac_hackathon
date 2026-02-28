// ─────────────────────────────────────────────────────────────────────────────
// Intervention Engine — Orchestrator
// Reads all models and decides what intervention to trigger
// ─────────────────────────────────────────────────────────────────────────────

import {
    AppUsageSession,
    AppDailyStats,
    HealthSignals,
    PersonalityProfile,
    FocusGoal,
    BlockingLevel,
    DistractivenessResult,
} from '../models/types';
import { computeAFI } from '../math/attentionFragmentation';
import { computeDistractivenessScores } from '../math/distractivenessScore';
import { computeImpulsivityIndex } from '../math/personalityStrictness';
import { computeGoalConflict, computeContextMismatch } from '../math/goalConflict';
import { computeComplianceProbability } from '../math/complianceProbability';
import { computeCRS } from '../math/cognitiveReadiness';
import { detectDopamineBinge, getResetMessage } from '../math/dopamineDetection';
import { computeBlockingDecision, BlockingDecision } from './AdaptiveBlocker';
import {
    canDeliverNudge,
    recordNudgeDelivery,
    NudgeState,
} from './NudgeManager';

export interface InterventionContext {
    recentSessions: AppUsageSession[];
    windowMs: number;
    appStats: AppDailyStats[];
    health: HealthSignals;
    personality: PersonalityProfile;
    activeGoal: FocusGoal | null;
    isInFocusSession: boolean;
    complianceSuccesses: number;
    complianceAttempts: number;
    nudgeState: NudgeState;
    currentApp: string;    // package name of the current app
    userBlockingOverride?: BlockingLevel | null;
}

export interface InterventionResult {
    blocking: BlockingDecision;
    bingeAlert: { isBinge: boolean; message: string };
    crsRecommendation: string;
    afiLevel: string;
    shouldDeliver: boolean;  // final gate: should this actually show?
    reason?: string;
}

/**
 * Main orchestrator: evaluate ALL models and decide on intervention.
 *
 * Flow:
 *   1. Compute AFI
 *   2. Score app distractiveness
 *   3. Check personality strictness
 *   4. Compute goal conflict
 *   5. Check compliance probability
 *   6. Compute CRS
 *   7. Check for dopamine binge
 *   8. Determine blocking level
 *   9. Check nudge rate limit
 *   10. Return final decision
 */
export function evaluateIntervention(
    ctx: InterventionContext,
): InterventionResult {
    const now = Date.now();

    // ── 1. AFI ──────────────────────────────────────────────────────────────
    const afi = computeAFI(ctx.recentSessions, ctx.windowMs);

    // ── 2. Distractiveness ──────────────────────────────────────────────────
    const dsResults = computeDistractivenessScores(ctx.appStats);
    const currentAppDS = dsResults.find(
        r => r.packageName === ctx.currentApp,
    ) || {
        appName: ctx.currentApp,
        packageName: ctx.currentApp,
        score: 0,
        isDistractive: false,
    };

    // ── 3. Personality strictness ───────────────────────────────────────────
    const strictness = computeImpulsivityIndex(ctx.personality);

    // ── 4. Goal conflict ────────────────────────────────────────────────────
    let goalConflict = { score: 0, shouldEscalate: false };
    if (ctx.activeGoal) {
        const mismatch = computeContextMismatch(
            ctx.currentApp,
            ctx.activeGoal,
            now,
        );
        goalConflict = computeGoalConflict(
            ctx.activeGoal,
            mismatch,
            currentAppDS.score,
        );
    }

    // ── 5. Compliance ───────────────────────────────────────────────────────
    const compliance = computeComplianceProbability(
        ctx.complianceSuccesses,
        ctx.complianceAttempts,
    );

    // ── 6. CRS ──────────────────────────────────────────────────────────────
    const crs = computeCRS(ctx.health, afi.score);

    // ── 7. Dopamine binge ───────────────────────────────────────────────────
    const distractiveApps = new Set(
        dsResults.filter(r => r.isDistractive).map(r => r.packageName),
    );
    const binge = detectDopamineBinge(ctx.recentSessions, distractiveApps);
    const bingeMessage = getResetMessage(binge);

    // ── 8. Blocking decision ────────────────────────────────────────────────
    const blocking = computeBlockingDecision({
        appResult: currentAppDS,
        strictness,
        compliance,
        goalConflict,
        activeGoal: ctx.activeGoal,
        isInFocusSession: ctx.isInFocusSession,
        userBlockingOverride: ctx.userBlockingOverride,
    });

    // ── 9. Nudge rate limit ─────────────────────────────────────────────────
    const nudgeCheck = canDeliverNudge(ctx.nudgeState, now);

    // ── 10. Final decision ──────────────────────────────────────────────────
    const shouldDeliver = blocking.shouldBlock && nudgeCheck.allowed;

    return {
        blocking,
        bingeAlert: { isBinge: binge.isBinge, message: bingeMessage },
        crsRecommendation: crs.recommendation,
        afiLevel: afi.level,
        shouldDeliver,
        reason: nudgeCheck.allowed ? undefined : nudgeCheck.reason,
    };
}
