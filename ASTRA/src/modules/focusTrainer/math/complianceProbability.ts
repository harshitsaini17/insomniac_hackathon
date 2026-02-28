// ─────────────────────────────────────────────────────────────────────────────
// Model 6: Compliance Probability (Bayesian Update)
// P(reminder effective) = (success_count + 1) / (attempts + 2)
// ─────────────────────────────────────────────────────────────────────────────

import { ComplianceResult } from '../models/types';
import { COMPLIANCE_THRESHOLD } from '../models/constants';

/**
 * Bayesian estimate of how likely the user is to comply with a nudge.
 *
 * Uses Laplace smoothing (Beta(1,1) prior):
 *   P = (successes + 1) / (attempts + 2)
 *
 * This gives a reasonable estimate even with very few data points:
 *   - 0 attempts → P = 0.50 (uninformative prior)
 *   - 1/1        → P = 0.67
 *   - 0/1        → P = 0.33
 *
 * If P < threshold → escalate to stronger intervention.
 *
 * @param successCount  Number of times user complied with nudges
 * @param attemptCount  Total nudges delivered
 * @returns ComplianceResult with probability and escalation flag
 */
export function computeComplianceProbability(
    successCount: number,
    attemptCount: number,
): ComplianceResult {
    // Ensure non-negative
    const successes = Math.max(0, Math.floor(successCount));
    const attempts = Math.max(0, Math.floor(attemptCount));

    // Bayesian posterior with Laplace smoothing
    const probability = (successes + 1) / (attempts + 2);

    return {
        probability,
        shouldEscalate: probability < COMPLIANCE_THRESHOLD,
    };
}

/**
 * Update compliance tracking after a nudge outcome.
 *
 * @param current  Current success/attempt counts
 * @param accepted Whether the user accepted this nudge
 * @returns Updated counts
 */
export function updateComplianceTracking(
    current: { successCount: number; attemptCount: number },
    accepted: boolean,
): { successCount: number; attemptCount: number } {
    return {
        successCount: current.successCount + (accepted ? 1 : 0),
        attemptCount: current.attemptCount + 1,
    };
}

/**
 * Compute compliance trend (improving / declining / stable)
 * by comparing recent window vs overall.
 */
export function computeComplianceTrend(
    overallSuccesses: number,
    overallAttempts: number,
    recentSuccesses: number,
    recentAttempts: number,
): 'improving' | 'declining' | 'stable' {
    if (overallAttempts < 3 || recentAttempts < 2) return 'stable';

    const overallP = (overallSuccesses + 1) / (overallAttempts + 2);
    const recentP = (recentSuccesses + 1) / (recentAttempts + 2);
    const delta = recentP - overallP;

    if (delta > 0.10) return 'improving';
    if (delta < -0.10) return 'declining';
    return 'stable';
}
