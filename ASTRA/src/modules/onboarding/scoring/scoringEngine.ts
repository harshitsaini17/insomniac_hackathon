// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Scoring Engine
// Converts NLP text analysis results into quantitative behavioral metrics
// GUS, ERS, SES, DTV — all scaled 0–1
// ─────────────────────────────────────────────────────────────────────────────

import {
    TextAnalysisResult,
    DistractionTypeVector,
    DistractionCategory,
} from '../models/onboardingTypes';

// ── Goal Urgency Score (GUS) ─────────────────────────────────────────────────

/**
 * Compute Goal Urgency Score from NLP urgency analysis.
 * GUS = urgencyScore from text analysis (already 0–1).
 * If no markers found, uses a moderate default.
 */
export function computeGoalUrgencyScore(
    nlpResult: Pick<TextAnalysisResult, 'urgencyScore' | 'urgencyMarkers'>,
): number {
    // Already normalized in text analyzer
    return Math.min(1, Math.max(0, nlpResult.urgencyScore));
}

// ── Emotional Reactivity Score (ERS) ─────────────────────────────────────────

/**
 * Compute Emotional Reactivity Score from emotion word analysis.
 * Higher negative emotion intensity → higher ERS.
 *
 * ERS influences:
 * - Nudge tone (supportive vs sharp)
 * - Strictness pacing
 */
export function computeEmotionalReactivityScore(
    nlpResult: Pick<TextAnalysisResult, 'emotionWords' | 'emotionValences'>,
): number {
    const { emotionWords, emotionValences } = nlpResult;

    if (emotionWords.length === 0) {
        return 0.3; // mild default
    }

    // Count negative and positive emotions
    let negativeIntensity = 0;
    let positiveIntensity = 0;
    let indifferentCount = 0;

    for (const word of emotionWords) {
        const valence = emotionValences[word] ?? 0;
        if (valence < -0.3) {
            negativeIntensity += Math.abs(valence);
        } else if (valence > 0.3) {
            positiveIntensity += valence;
        } else {
            indifferentCount++;
        }
    }

    // Strong indifference → low ERS
    if (indifferentCount > 0 && negativeIntensity === 0) {
        return 0.15;
    }

    // Reactivity from negative emotion density
    const totalIntensity = negativeIntensity + positiveIntensity + 0.5;
    const raw = negativeIntensity / totalIntensity;

    return Math.min(1, Math.max(0, raw));
}

// ── Self-Efficacy Score (SES) ────────────────────────────────────────────────

/**
 * Compute Self-Efficacy Score from text efficacy analysis.
 * High SES = "I will", "I am determined"
 * Low SES = "I hope", "Maybe"
 *
 * SES influences:
 * - Nudge tone (challenge vs confidence-building)
 * - Uninstall risk
 */
export function computeSelfEfficacyScore(
    nlpResult: Pick<TextAnalysisResult, 'selfEfficacyScore' | 'efficacyIndicators'>,
): number {
    // Already normalized in text analyzer
    return Math.min(1, Math.max(0, nlpResult.selfEfficacyScore));
}

// ── Distraction Type Vector (DTV) ────────────────────────────────────────────

const ALL_DISTRACTION_CATEGORIES: DistractionCategory[] = [
    'social_media',
    'gaming',
    'mental_rumination',
    'social_interaction',
    'fatigue',
    'other',
];

/**
 * Compute Distraction Type Vector — a weight map from each category to 0–1.
 *
 * Primary distraction category gets weight 1.0.
 * Secondary categories get diminishing weights.
 * Unmatched categories get 0.
 *
 * DTV is used to:
 * - Target app blocking (social_media, gaming)
 * - Target meditation vs hard block (mental_rumination → meditation)
 */
export function computeDistractionTypeVector(
    nlpResult: Pick<TextAnalysisResult, 'distractionCategories'>,
): DistractionTypeVector {
    const vector: DistractionTypeVector = {
        social_media: 0,
        gaming: 0,
        mental_rumination: 0,
        social_interaction: 0,
        fatigue: 0,
        other: 0,
    };

    const { distractionCategories } = nlpResult;

    if (distractionCategories.length === 0) {
        vector.other = 1.0;
        return vector;
    }

    // Primary category gets full weight, subsequent get diminishing weights
    distractionCategories.forEach((cat, idx) => {
        const weight = 1.0 / (idx + 1); // 1.0, 0.5, 0.33, 0.25, ...
        vector[cat] = Math.min(1, vector[cat] + weight);
    });

    // Normalize so max = 1
    const maxVal = Math.max(...Object.values(vector));
    if (maxVal > 0) {
        for (const cat of ALL_DISTRACTION_CATEGORIES) {
            vector[cat] = vector[cat] / maxVal;
        }
    }

    return vector;
}
