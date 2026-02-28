// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Behavioral Model
// Combines quantitative personality scores + qualitative NLP-derived scores
// to produce composite behavioral indices
// ─────────────────────────────────────────────────────────────────────────────

import { NudgeTone, BigFiveScores } from '../models/onboardingTypes';
import { SCORING_WEIGHTS } from '../models/onboardingConstants';

// ── Impulsivity Index (II) ───────────────────────────────────────────────────

/**
 * II = normalize((7 − Conscientiousness) + Neuroticism + ERS)
 *
 * Higher II → user is more impulsive → needs stricter intervention.
 *
 * @param conscientiousness - 1–7 Likert
 * @param neuroticism - 1–7 Likert
 * @param ers - Emotional Reactivity Score 0–1
 * @returns Impulsivity Index 0–1
 */
export function computeImpulsivityIndex(
    conscientiousness: number,
    neuroticism: number,
    ers: number,
): number {
    const w = SCORING_WEIGHTS.impulsivity;
    const raw =
        (7 - conscientiousness) * w.conscientiousnessInverse +
        neuroticism * w.neuroticism +
        ers * w.emotionalReactivity;

    return Math.min(1, Math.max(0, raw / w.maxRaw));
}

// ── Strictness Compatibility Score (SCS) ─────────────────────────────────────

/**
 * SCS = weighted sum of:
 * - Conscientiousness (normalized to 0–1)
 * - Self-reported strictness preference (normalized to 0–1)
 * - Self-efficacy score
 * - Inverse authority resistance (normalized to 0–1)
 *
 * Higher SCS → user is more compatible with strict interventions.
 *
 * @param conscientiousness - 1–7 Likert
 * @param strictnessPreference - 1–7 Likert
 * @param ses - Self-Efficacy Score 0–1
 * @param authorityResistance - 1–7 Likert (average of 2 items)
 * @returns SCS 0–1
 */
export function computeStrictnessCompatibility(
    conscientiousness: number,
    strictnessPreference: number,
    ses: number,
    authorityResistance: number,
): number {
    const w = SCORING_WEIGHTS.strictness;

    // Normalize Likert 1–7 → 0–1
    const cNorm = (conscientiousness - 1) / 6;
    const spNorm = (strictnessPreference - 1) / 6;
    const arInverse = 1 - (authorityResistance - 1) / 6;

    const scs =
        cNorm * w.conscientiousness +
        spNorm * w.strictnessPreference +
        ses * w.selfEfficacy +
        arInverse * w.authorityResistanceInverse;

    return Math.min(1, Math.max(0, scs));
}

// ── Authority Resistance Score ───────────────────────────────────────────────

/**
 * Normalize authority resistance Likert average to 0–1.
 */
export function computeAuthorityResistanceScore(
    ar1: number,
    ar2: number,
): number {
    const avg = (ar1 + ar2) / 2;
    return Math.min(1, Math.max(0, (avg - 1) / 6));
}

// ── Nudge Tone Selector ──────────────────────────────────────────────────────

/**
 * Select the best nudge tone based on emotional and efficacy profile.
 *
 * Rules:
 * - High ERS + high guilt → supportive
 * - Low ERS + indifferent → sharp
 * - High SES → challenge-based
 * - Low SES → confidence-building
 */
export function selectNudgeTone(
    ers: number,
    ses: number,
    hasGuilt: boolean,
    hasIndifference: boolean,
): NudgeTone {
    // Priority 1: High emotional reactivity + guilt → supportive
    if (ers > 0.5 && hasGuilt) {
        return 'supportive';
    }

    // Priority 2: Low emotional reactivity + indifference → sharp
    if (ers < 0.3 && hasIndifference) {
        return 'sharp';
    }

    // Priority 3: High self-efficacy → challenge
    if (ses > 0.65) {
        return 'challenge';
    }

    // Priority 4: Low self-efficacy → build confidence
    if (ses < 0.4) {
        return 'confidence_building';
    }

    // Default: supportive (safe, non-aggressive)
    return 'supportive';
}

// ── Uninstall Risk Probability (URP) ─────────────────────────────────────────

/**
 * Predict probability that user will uninstall using logistic function.
 *
 * URP = 1 / (1 + e^(-z))
 *
 * Where z = weighted sum of resistance variables + bias.
 *
 * Increase URP when:
 * - High authority resistance
 * - Low self-efficacy
 * - High emotional reactivity
 * - Strong autonomy preference
 *
 * @param authorityResistance - 0–1 normalized
 * @param ses - Self-Efficacy Score 0–1
 * @param ers - Emotional Reactivity Score 0–1
 * @param autonomyPreference - 1–7 Likert
 * @returns URP 0–1
 */
export function computeUninstallRiskProbability(
    authorityResistance: number,
    ses: number,
    ers: number,
    autonomyPreference: number,
): number {
    const w = SCORING_WEIGHTS.uninstallRisk;
    const autonomyNorm = (autonomyPreference - 1) / 6;

    const z =
        authorityResistance * w.authorityResistance +
        (1 - ses) * w.selfEfficacyInverse +
        ers * w.emotionalReactivity +
        autonomyNorm * w.autonomyPreference +
        w.bias;

    // Logistic sigmoid
    return 1 / (1 + Math.exp(-z));
}

// ── Baseline Focus Estimate ──────────────────────────────────────────────────

/**
 * Estimate user's baseline focus ability before any usage data.
 * Uses personality scores as a proxy.
 *
 * @param conscientiousness - 1–7 Likert
 * @param ses - Self-Efficacy Score 0–1
 * @param impulsivityIndex - 0–1
 * @returns Baseline focus 0–1
 */
export function computeBaselineFocusEstimate(
    conscientiousness: number,
    ses: number,
    impulsivityIndex: number,
): number {
    const w = SCORING_WEIGHTS.baselineFocus;
    const cNorm = (conscientiousness - 1) / 6;

    const estimate =
        cNorm * w.conscientiousness +
        ses * w.selfEfficacy +
        (1 - impulsivityIndex) * w.impulsivityInverse;

    return Math.min(1, Math.max(0, estimate));
}
