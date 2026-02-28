// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Profile Builder
// Combines structured answers + NLP-derived scores → complete UserProfile
// ─────────────────────────────────────────────────────────────────────────────

import {
    OnboardingAnswers,
    UserProfile,
    BigFiveScores,
} from '../models/onboardingTypes';

import { analyzeAllOpenInputs } from '../nlp/textAnalyzer';

import {
    computeGoalUrgencyScore,
    computeEmotionalReactivityScore,
    computeSelfEfficacyScore,
    computeDistractionTypeVector,
} from '../scoring/scoringEngine';

import {
    computeImpulsivityIndex,
    computeStrictnessCompatibility,
    computeAuthorityResistanceScore,
    selectNudgeTone,
    computeUninstallRiskProbability,
    computeBaselineFocusEstimate,
} from '../scoring/behavioralModel';

import { generatePersonalizedSummary } from './summaryGenerator';
import { seedResponsePredictionMatrix } from './responsePrediction';

// ── Build User Profile ───────────────────────────────────────────────────────

/**
 * Build a complete UserProfile from raw onboarding answers.
 *
 * Pipeline:
 * 1. Extract Big Five scores from structured answers
 * 2. Run text analysis on open-ended inputs
 * 3. Compute scoring metrics (GUS, ERS, SES, DTV)
 * 4. Compute behavioral model (II, SCS, URP, nudge tone)
 * 5. Generate personalized summary
 * 6. Seed response prediction matrix
 */
export function buildUserProfile(answers: OnboardingAnswers): UserProfile {
    const now = Date.now();

    // ── Step 1: Big Five from Likert averages ────────────────────────────
    const bigFive: BigFiveScores = {
        conscientiousness: (answers.conscientiousness1 + answers.conscientiousness2) / 2,
        neuroticism: (answers.neuroticism1 + answers.neuroticism2) / 2,
        openness: answers.openness,
        agreeableness: answers.agreeableness,
        extraversion: answers.extraversion,
    };

    // ── Step 2: NLP text analysis ────────────────────────────────────────
    const nlpResult = analyzeAllOpenInputs({
        coreGoal: answers.coreGoal,
        primaryDistraction: answers.primaryDistraction,
        emotionalStateAfterDistraction: answers.emotionalStateAfterDistraction,
        idealFutureSelf: answers.idealFutureSelf,
        selfIdentifiedWeakness: answers.selfIdentifiedWeakness,
    });

    // ── Step 3: Compute derived scores ───────────────────────────────────
    const gus = computeGoalUrgencyScore(nlpResult);
    const ers = computeEmotionalReactivityScore(nlpResult);
    const ses = computeSelfEfficacyScore(nlpResult);
    const dtv = computeDistractionTypeVector(nlpResult);

    // ── Step 4: Behavioral model scores ──────────────────────────────────
    const ii = computeImpulsivityIndex(bigFive.conscientiousness, bigFive.neuroticism, ers);
    const arScore = computeAuthorityResistanceScore(
        answers.authorityResistance1,
        answers.authorityResistance2,
    );
    const scs = computeStrictnessCompatibility(
        bigFive.conscientiousness,
        answers.strictnessPreference,
        ses,
        (answers.authorityResistance1 + answers.authorityResistance2) / 2,
    );

    // Check for specific emotion flags
    const hasGuilt = nlpResult.emotionWords.some(w =>
        ['guilty', 'ashamed', 'regretful'].includes(w),
    );
    const hasIndifference = nlpResult.emotionWords.some(w =>
        ['indifferent', 'whatever', 'numb', 'unbothered'].includes(w),
    );

    const nudgeTone = selectNudgeTone(ers, ses, hasGuilt, hasIndifference);

    const urp = computeUninstallRiskProbability(
        arScore,
        ses,
        ers,
        answers.autonomyPreference,
    );

    const baselineFocus = computeBaselineFocusEstimate(
        bigFive.conscientiousness,
        ses,
        ii,
    );

    // ── Step 5: Response prediction matrix ───────────────────────────────
    const predictedResponseMatrix = seedResponsePredictionMatrix(ii, ses, ers, scs);

    // ── Step 6: Personalized summary ─────────────────────────────────────
    const personalizedSummary = generatePersonalizedSummary({
        bigFive,
        impulsivityIndex: ii,
        goalCategory: nlpResult.goalCategory,
        distractionTypeVector: dtv,
        nudgeTone,
        ses,
        ers,
        motivationType: nlpResult.motivationType,
    });

    // ── Assemble UserProfile ─────────────────────────────────────────────
    return {
        bigFive,
        impulsivityIndex: ii,
        authorityResistanceScore: arScore,
        strictnessCompatibility: scs,
        uninstallRiskProbability: urp,
        motivationType: nlpResult.motivationType,
        goalCategory: nlpResult.goalCategory,
        goalUrgencyScore: gus,
        goalText: answers.coreGoal,
        emotionalReactivityScore: ers,
        selfEfficacyScore: ses,
        distractionTypeVector: dtv,
        predictedResponseMatrix,
        baselineFocusEstimate: baselineFocus,
        nudgeTone,
        personalizedSummary,
        idealFutureSelf: answers.idealFutureSelf,
        rawAnswers: answers,
        createdAt: now,
        updatedAt: now,
    };
}
