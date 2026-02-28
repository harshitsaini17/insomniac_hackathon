// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Response Prediction Matrix
// Seeds initial compliance probabilities via II, SES, ERS, SCS
// Supports future Bayesian updates during usage
// ─────────────────────────────────────────────────────────────────────────────

import { ResponsePredictionMatrix } from '../models/onboardingTypes';

// ── Seed Response Prediction ─────────────────────────────────────────────────

/**
 * Initialize compliance prediction matrix:
 * - P(comply | reflective) — lightest intervention
 * - P(comply | soft_delay)  — moderate intervention
 * - P(comply | hard_block)  — strictest intervention
 *
 * Seeded from personality + NLP scores:
 *
 * Base probabilities adjusted by:
 * - Higher II → lower P(comply | reflective), higher P(comply | hard_block)
 * - Higher SES → higher compliance across all types
 * - Higher ERS → more responsive to emotional nudges (reflective)
 * - Higher SCS → higher compliance with strict interventions
 *
 * These probabilities are starting points — updated via Bayesian learning
 * as the user interacts with the system.
 */
export function seedResponsePredictionMatrix(
    impulsivityIndex: number,
    selfEfficacyScore: number,
    emotionalReactivityScore: number,
    strictnessCompatibility: number,
): ResponsePredictionMatrix {
    // Base probabilities
    const baseReflective = 0.50;
    const baseSoftDelay = 0.45;
    const baseHardBlock = 0.35;

    // ── Reflective nudge compliance ──────────────────────────────────────
    // Higher ERS → more responsive (they feel the impact)
    // Higher SES → more likely to comply with gentle nudge
    // Higher II → less likely to comply with gentle nudge alone
    const reflective = clamp(
        baseReflective +
        emotionalReactivityScore * 0.15 +
        selfEfficacyScore * 0.20 -
        impulsivityIndex * 0.25,
    );

    // ── Soft delay compliance ────────────────────────────────────────────
    // Moderate intervention — affected by all factors
    const softDelay = clamp(
        baseSoftDelay +
        selfEfficacyScore * 0.15 +
        strictnessCompatibility * 0.15 -
        impulsivityIndex * 0.15,
    );

    // ── Hard block compliance ────────────────────────────────────────────
    // Strictest — higher SCS means they want it
    // Higher II users may actually need and respond to this
    const hardBlock = clamp(
        baseHardBlock +
        strictnessCompatibility * 0.25 +
        impulsivityIndex * 0.10 -
        (1 - selfEfficacyScore) * 0.10,
    );

    return {
        reflective,
        softDelay,
        hardBlock,
    };
}

// ── Bayesian Update ──────────────────────────────────────────────────────────

/**
 * Update a compliance probability using Bayesian learning.
 * Uses Beta-Binomial conjugate prior.
 *
 * posterior = (alpha + successes) / (alpha + beta + attempts)
 *
 * @param currentProbability - Current P(comply)
 * @param wasSuccessful - Did user comply with this nudge type?
 * @param totalAttempts - Total times this nudge type was shown
 * @returns Updated probability
 */
export function bayesianUpdate(
    currentProbability: number,
    wasSuccessful: boolean,
    totalAttempts: number,
): number {
    // Use current probability as prior mean with pseudo-count of 2
    const alpha = currentProbability * 2;
    const beta = (1 - currentProbability) * 2;

    const successes = wasSuccessful ? 1 : 0;
    const posterior = (alpha + successes) / (alpha + beta + 1);

    return clamp(posterior);
}

/**
 * Update the full prediction matrix based on a nudge interaction.
 */
export function updatePredictionMatrix(
    matrix: ResponsePredictionMatrix,
    nudgeType: 'reflective' | 'softDelay' | 'hardBlock',
    wasSuccessful: boolean,
    totalAttempts: number,
): ResponsePredictionMatrix {
    return {
        ...matrix,
        [nudgeType]: bayesianUpdate(
            matrix[nudgeType],
            wasSuccessful,
            totalAttempts,
        ),
    };
}

// ── Clamp Helper ─────────────────────────────────────────────────────────────

function clamp(value: number, min: number = 0.05, max: number = 0.95): number {
    return Math.min(max, Math.max(min, value));
}
