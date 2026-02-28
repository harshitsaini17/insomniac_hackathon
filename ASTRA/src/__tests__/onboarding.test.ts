// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Unit Tests
// Text Analyzer, Scoring Engine, Behavioral Model, Profile Builder,
// Summary Generator, Response Prediction
// ─────────────────────────────────────────────────────────────────────────────

import {
    classifyGoal,
    detectUrgency,
    analyzeEmotionWords,
    analyzeSelfEfficacy,
    classifyDistraction,
    detectMotivationType,
    analyzeAllOpenInputs,
} from '../modules/onboarding/nlp/textAnalyzer';

import {
    computeGoalUrgencyScore,
    computeEmotionalReactivityScore,
    computeSelfEfficacyScore,
    computeDistractionTypeVector,
} from '../modules/onboarding/scoring/scoringEngine';

import {
    computeImpulsivityIndex,
    computeStrictnessCompatibility,
    computeAuthorityResistanceScore,
    selectNudgeTone,
    computeUninstallRiskProbability,
    computeBaselineFocusEstimate,
} from '../modules/onboarding/scoring/behavioralModel';

import { buildUserProfile } from '../modules/onboarding/engine/profileBuilder';
import { generatePersonalizedSummary } from '../modules/onboarding/engine/summaryGenerator';
import {
    seedResponsePredictionMatrix,
    bayesianUpdate,
    updatePredictionMatrix,
} from '../modules/onboarding/engine/responsePrediction';

import { OnboardingAnswers } from '../modules/onboarding/models/onboardingTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Text Analyzer — Goal Classification
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Goal Classification', () => {
    test('career keywords → career category', () => {
        const result = classifyGoal('I want to get an internship at a tech company');
        expect(result.category).toBe('career');
        expect(result.detectedKeywords).toContain('internship');
    });

    test('academic keywords → academic category', () => {
        const result = classifyGoal('I need to crack GATE exam with top rank');
        expect(result.category).toBe('academic');
        expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });

    test('health keywords → health category', () => {
        const result = classifyGoal('I want to lose weight and build muscle at the gym');
        expect(result.category).toBe('health');
    });

    test('no matching keywords → other', () => {
        const result = classifyGoal('xyz abc 123');
        expect(result.category).toBe('other');
    });

    test('mixed keywords → highest match wins', () => {
        const result = classifyGoal('I want a job promotion and also study for exam');
        // Both career and academic have matches; depends on count
        expect(['career', 'academic']).toContain(result.category);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Text Analyzer — Urgency Detection
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Urgency Detection', () => {
    test('time marker "3 months" → high urgency', () => {
        const result = detectUrgency('I need to achieve this in 3 months');
        expect(result.score).toBeGreaterThanOrEqual(0.6);
        expect(result.markers).toContain('3 months');
    });

    test('"urgent" keyword → very high urgency', () => {
        const result = detectUrgency('This is urgent, I need it now');
        expect(result.score).toBeGreaterThanOrEqual(0.85);
    });

    test('"someday" → low urgency', () => {
        const result = detectUrgency('I want to do this someday');
        expect(result.score).toBeLessThan(0.25);
    });

    test('no markers → moderate default', () => {
        const result = detectUrgency('I want to improve my skills');
        expect(result.score).toBeGreaterThanOrEqual(0.3);
        expect(result.score).toBeLessThanOrEqual(0.4);
    });

    test('score is in [0, 1]', () => {
        const result = detectUrgency('tomorrow ASAP urgent deadline this week');
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Text Analyzer — Emotion Words
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Emotion Words', () => {
    test('guilty + anxious → high reactivity', () => {
        const result = analyzeEmotionWords('I feel guilty and anxious after wasting time');
        expect(result.emotions).toContain('guilty');
        expect(result.emotions).toContain('anxious');
        expect(result.reactivityScore).toBeGreaterThan(0.3);
    });

    test('indifferent → low reactivity', () => {
        const result = analyzeEmotionWords('I feel indifferent about it');
        expect(result.emotions).toContain('indifferent');
        expect(result.reactivityScore).toBeLessThanOrEqual(0.3);
    });

    test('motivated + happy → low reactivity', () => {
        const result = analyzeEmotionWords('I feel motivated and happy');
        expect(result.emotions).toContain('motivated');
        expect(result.reactivityScore).toBeLessThan(0.3);
    });

    test('no emotion words → mild default', () => {
        const result = analyzeEmotionWords('I just move on');
        expect(result.emotions).toHaveLength(0);
        expect(result.reactivityScore).toBeCloseTo(0.3, 1);
    });

    test('reactivity score in [0, 1]', () => {
        const result = analyzeEmotionWords(
            'guilty anxious frustrated angry ashamed disappointed regretful',
        );
        expect(result.reactivityScore).toBeGreaterThanOrEqual(0);
        expect(result.reactivityScore).toBeLessThanOrEqual(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Text Analyzer — Self-Efficacy
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Self-Efficacy', () => {
    test('"I will" and "I am determined" → high efficacy', () => {
        const result = analyzeSelfEfficacy('I will do it. I am determined to succeed.');
        expect(result.score).toBeGreaterThan(0.6);
        expect(result.indicators.length).toBeGreaterThan(0);
    });

    test('"I hope" and "maybe" → low efficacy', () => {
        const result = analyzeSelfEfficacy('I hope I can. Maybe it will work.');
        expect(result.score).toBeLessThan(0.5);
    });

    test('no efficacy phrases → neutral (0.5)', () => {
        const result = analyzeSelfEfficacy('Just doing regular stuff');
        expect(result.score).toBeCloseTo(0.5, 1);
    });

    test('mixed phrases → balanced score', () => {
        const result = analyzeSelfEfficacy(
            'I will try but I hope it works. Maybe I can do it.',
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Text Analyzer — Distraction Classification
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Distraction Classification', () => {
    test('Instagram reels → social_media', () => {
        const result = classifyDistraction('Instagram reels consume all my time');
        expect(result.categories[0]).toBe('social_media');
        expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });

    test('gaming keywords → gaming', () => {
        const result = classifyDistraction('I play Valorant too much');
        expect(result.categories[0]).toBe('gaming');
    });

    test('overthinking → mental_rumination', () => {
        const result = classifyDistraction('I keep overthinking everything');
        expect(result.categories[0]).toBe('mental_rumination');
    });

    test('friends chatting → social_interaction', () => {
        const result = classifyDistraction('friends and chatting on calls');
        expect(result.categories[0]).toBe('social_interaction');
    });

    test('no match → other', () => {
        const result = classifyDistraction('abc xyz 123');
        expect(result.categories[0]).toBe('other');
    });

    test('multiple categories detected', () => {
        const result = classifyDistraction(
            'I waste time on Instagram reels and gaming on Valorant',
        );
        expect(result.categories.length).toBeGreaterThanOrEqual(2);
        expect(result.categories).toContain('social_media');
        expect(result.categories).toContain('gaming');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Text Analyzer — Motivation Type
// ═══════════════════════════════════════════════════════════════════════════════

describe('Text Analyzer — Motivation Type', () => {
    test('growth + passion → intrinsic', () => {
        const result = detectMotivationType(
            'I want to grow as a person',
            'Someone who is disciplined and happy',
        );
        expect(result).toBe('intrinsic');
    });

    test('salary + promotion → extrinsic', () => {
        const result = detectMotivationType(
            'I want a high salary job promotion',
            'Top ranked in my company',
        );
        expect(result).toBe('extrinsic');
    });

    test('mixed signals → mixed', () => {
        const result = detectMotivationType(
            'I want to learn and grow while getting a good salary',
            'A happy and fulfilled person with a great job',
        );
        expect(result).toBe('mixed');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Scoring Engine — GUS, ERS, SES, DTV
// ═══════════════════════════════════════════════════════════════════════════════

describe('Scoring Engine', () => {
    test('GUS is in [0, 1]', () => {
        const gus = computeGoalUrgencyScore({ urgencyScore: 0.8, urgencyMarkers: ['3 months'] });
        expect(gus).toBeGreaterThanOrEqual(0);
        expect(gus).toBeLessThanOrEqual(1);
    });

    test('ERS with negative emotions → high score', () => {
        const ers = computeEmotionalReactivityScore({
            emotionWords: ['guilty', 'anxious'],
            emotionValences: { guilty: -0.8, anxious: -0.7 },
        });
        expect(ers).toBeGreaterThan(0.4);
    });

    test('ERS with indifference → low score', () => {
        const ers = computeEmotionalReactivityScore({
            emotionWords: ['indifferent'],
            emotionValences: { indifferent: 0 },
        });
        expect(ers).toBeLessThan(0.2);
    });

    test('SES is clamped [0, 1]', () => {
        const ses = computeSelfEfficacyScore({ selfEfficacyScore: 1.5, efficacyIndicators: [] });
        expect(ses).toBeLessThanOrEqual(1);
    });

    test('DTV sums to expected distribution', () => {
        const dtv = computeDistractionTypeVector({
            distractionCategories: ['social_media', 'gaming'],
        });
        expect(dtv.social_media).toBe(1); // primary = max
        expect(dtv.gaming).toBeGreaterThan(0);
        expect(dtv.gaming).toBeLessThan(1);
        expect(dtv.mental_rumination).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Behavioral Model — Impulsivity Index
// ═══════════════════════════════════════════════════════════════════════════════

describe('Behavioral Model — Impulsivity Index', () => {
    test('high C, low N, low ERS → low II', () => {
        const ii = computeImpulsivityIndex(7, 1, 0.1);
        expect(ii).toBeLessThan(0.2);
    });

    test('low C, high N, high ERS → high II', () => {
        const ii = computeImpulsivityIndex(1, 7, 0.9);
        expect(ii).toBeGreaterThan(0.7);
    });

    test('moderate values → moderate II', () => {
        const ii = computeImpulsivityIndex(4, 4, 0.5);
        expect(ii).toBeGreaterThanOrEqual(0.3);
        expect(ii).toBeLessThanOrEqual(0.7);
    });

    test('II is always in [0, 1]', () => {
        for (let c = 1; c <= 7; c++) {
            for (let n = 1; n <= 7; n++) {
                const ii = computeImpulsivityIndex(c, n, 0.5);
                expect(ii).toBeGreaterThanOrEqual(0);
                expect(ii).toBeLessThanOrEqual(1);
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Behavioral Model — Strictness Compatibility
// ═══════════════════════════════════════════════════════════════════════════════

describe('Behavioral Model — Strictness Compatibility', () => {
    test('high C, high preference, high SES, low AR → high SCS', () => {
        const scs = computeStrictnessCompatibility(7, 7, 0.9, 1);
        expect(scs).toBeGreaterThan(0.7);
    });

    test('low C, low preference, low SES, high AR → low SCS', () => {
        const scs = computeStrictnessCompatibility(1, 1, 0.1, 7);
        expect(scs).toBeLessThan(0.2);
    });

    test('SCS is in [0, 1]', () => {
        const scs = computeStrictnessCompatibility(4, 4, 0.5, 4);
        expect(scs).toBeGreaterThanOrEqual(0);
        expect(scs).toBeLessThanOrEqual(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Behavioral Model — Nudge Tone Selection
// ═══════════════════════════════════════════════════════════════════════════════

describe('Behavioral Model — Nudge Tone Selection', () => {
    test('high ERS + guilt → supportive', () => {
        expect(selectNudgeTone(0.7, 0.5, true, false)).toBe('supportive');
    });

    test('low ERS + indifference → sharp', () => {
        expect(selectNudgeTone(0.2, 0.5, false, true)).toBe('sharp');
    });

    test('high SES → challenge', () => {
        expect(selectNudgeTone(0.4, 0.8, false, false)).toBe('challenge');
    });

    test('low SES → confidence_building', () => {
        expect(selectNudgeTone(0.4, 0.2, false, false)).toBe('confidence_building');
    });

    test('default → supportive', () => {
        expect(selectNudgeTone(0.4, 0.5, false, false)).toBe('supportive');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Behavioral Model — Uninstall Risk Probability
// ═══════════════════════════════════════════════════════════════════════════════

describe('Behavioral Model — URP (Logistic)', () => {
    test('URP is always in (0, 1)', () => {
        const urp = computeUninstallRiskProbability(0.9, 0.1, 0.9, 7);
        expect(urp).toBeGreaterThan(0);
        expect(urp).toBeLessThan(1);
    });

    test('high risk factors → higher URP', () => {
        const highRisk = computeUninstallRiskProbability(0.9, 0.1, 0.9, 7);
        const lowRisk = computeUninstallRiskProbability(0.1, 0.9, 0.1, 1);
        expect(highRisk).toBeGreaterThan(lowRisk);
    });

    test('uses logistic function (sigmoid bounded)', () => {
        // Even extreme values should not exceed bounds
        const urp = computeUninstallRiskProbability(1, 0, 1, 7);
        expect(urp).toBeLessThanOrEqual(1);
        expect(urp).toBeGreaterThanOrEqual(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Response Prediction Matrix
// ═══════════════════════════════════════════════════════════════════════════════

describe('Response Prediction Matrix', () => {
    test('all probabilities are valid (0–1)', () => {
        const matrix = seedResponsePredictionMatrix(0.5, 0.5, 0.5, 0.5);
        expect(matrix.reflective).toBeGreaterThanOrEqual(0);
        expect(matrix.reflective).toBeLessThanOrEqual(1);
        expect(matrix.softDelay).toBeGreaterThanOrEqual(0);
        expect(matrix.softDelay).toBeLessThanOrEqual(1);
        expect(matrix.hardBlock).toBeGreaterThanOrEqual(0);
        expect(matrix.hardBlock).toBeLessThanOrEqual(1);
    });

    test('low II profile → P(reflective) is relatively high', () => {
        const matrix = seedResponsePredictionMatrix(0.1, 0.8, 0.3, 0.7);
        expect(matrix.reflective).toBeGreaterThan(0.5);
    });

    test('high II profile → P(reflective) is lower', () => {
        const highII = seedResponsePredictionMatrix(0.9, 0.2, 0.8, 0.3);
        const lowII = seedResponsePredictionMatrix(0.1, 0.8, 0.3, 0.7);
        expect(lowII.reflective).toBeGreaterThan(highII.reflective);
    });

    test('Bayesian update increases probability on success', () => {
        const original = 0.5;
        const updated = bayesianUpdate(original, true, 1);
        expect(updated).toBeGreaterThan(original);
    });

    test('Bayesian update decreases probability on failure', () => {
        const original = 0.5;
        const updated = bayesianUpdate(original, false, 1);
        expect(updated).toBeLessThan(original);
    });

    test('updatePredictionMatrix updates correct field', () => {
        const matrix = seedResponsePredictionMatrix(0.5, 0.5, 0.5, 0.5);
        const updated = updatePredictionMatrix(matrix, 'reflective', true, 1);
        expect(updated.reflective).toBeGreaterThan(matrix.reflective);
        expect(updated.softDelay).toBe(matrix.softDelay);
        expect(updated.hardBlock).toBe(matrix.hardBlock);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Summary Generator
// ═══════════════════════════════════════════════════════════════════════════════

describe('Summary Generator', () => {
    test('generates non-empty summary', () => {
        const summary = generatePersonalizedSummary({
            bigFive: { conscientiousness: 5, neuroticism: 3, openness: 4, agreeableness: 5, extraversion: 3 },
            impulsivityIndex: 0.3,
            goalCategory: 'career',
            distractionTypeVector: {
                social_media: 1, gaming: 0, mental_rumination: 0,
                social_interaction: 0, fatigue: 0, other: 0,
            },
            nudgeTone: 'challenge',
            ses: 0.7,
            ers: 0.3,
            motivationType: 'intrinsic',
        });
        expect(summary.length).toBeGreaterThan(50);
    });

    test('mentions goal orientation', () => {
        const summary = generatePersonalizedSummary({
            bigFive: { conscientiousness: 5, neuroticism: 3, openness: 4, agreeableness: 5, extraversion: 3 },
            impulsivityIndex: 0.3,
            goalCategory: 'academic',
            distractionTypeVector: {
                social_media: 0, gaming: 0, mental_rumination: 1,
                social_interaction: 0, fatigue: 0, other: 0,
            },
            nudgeTone: 'supportive',
            ses: 0.4,
            ers: 0.6,
            motivationType: 'mixed',
        });
        expect(summary.toLowerCase()).toContain('academic');
    });

    test('does not contain clinical labels', () => {
        const summary = generatePersonalizedSummary({
            bigFive: { conscientiousness: 2, neuroticism: 6, openness: 4, agreeableness: 5, extraversion: 3 },
            impulsivityIndex: 0.8,
            goalCategory: 'personal',
            distractionTypeVector: {
                social_media: 1, gaming: 0, mental_rumination: 0,
                social_interaction: 0, fatigue: 0, other: 0,
            },
            nudgeTone: 'confidence_building',
            ses: 0.2,
            ers: 0.8,
            motivationType: 'intrinsic',
        });
        expect(summary.toLowerCase()).not.toContain('neurotic');
        expect(summary.toLowerCase()).not.toContain('impulsive person');
        expect(summary.toLowerCase()).not.toContain('you are neurotic');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Full Profile Builder — End-to-End
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile Builder — End-to-End', () => {
    const mockAnswers: OnboardingAnswers = {
        conscientiousness1: 5,
        conscientiousness2: 6,
        neuroticism1: 3,
        neuroticism2: 4,
        openness: 5,
        agreeableness: 4,
        extraversion: 3,
        authorityResistance1: 2,
        authorityResistance2: 3,
        strictnessPreference: 5,
        autonomyPreference: 4,
        coreGoal: 'I will get a software internship in 3 months at a top tech company',
        primaryDistraction: 'Instagram reels and YouTube shorts consuming my time',
        emotionalStateAfterDistraction: 'I feel guilty and anxious after wasting hours',
        idealFutureSelf: 'A disciplined engineer who ships projects and keeps learning',
        selfIdentifiedWeakness: 'I struggle with phone addiction and overthinking',
    };

    test('builds complete profile with all required fields', () => {
        const profile = buildUserProfile(mockAnswers);

        // All fields present
        expect(profile.bigFive).toBeDefined();
        expect(profile.impulsivityIndex).toBeDefined();
        expect(profile.authorityResistanceScore).toBeDefined();
        expect(profile.strictnessCompatibility).toBeDefined();
        expect(profile.uninstallRiskProbability).toBeDefined();
        expect(profile.motivationType).toBeDefined();
        expect(profile.goalCategory).toBeDefined();
        expect(profile.goalUrgencyScore).toBeDefined();
        expect(profile.emotionalReactivityScore).toBeDefined();
        expect(profile.selfEfficacyScore).toBeDefined();
        expect(profile.distractionTypeVector).toBeDefined();
        expect(profile.predictedResponseMatrix).toBeDefined();
        expect(profile.baselineFocusEstimate).toBeDefined();
        expect(profile.nudgeTone).toBeDefined();
        expect(profile.personalizedSummary).toBeDefined();
        expect(profile.idealFutureSelf).toBeDefined();
        expect(profile.rawAnswers).toEqual(mockAnswers);
    });

    test('Big Five scores are computed correctly', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.bigFive.conscientiousness).toBe(5.5); // (5+6)/2
        expect(profile.bigFive.neuroticism).toBe(3.5);       // (3+4)/2
        expect(profile.bigFive.openness).toBe(5);
    });

    test('goal is classified as career', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.goalCategory).toBe('career');
    });

    test('distraction vector has social_media as primary', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.distractionTypeVector.social_media).toBe(1);
    });

    test('all scores are in valid ranges', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.impulsivityIndex).toBeGreaterThanOrEqual(0);
        expect(profile.impulsivityIndex).toBeLessThanOrEqual(1);
        expect(profile.authorityResistanceScore).toBeGreaterThanOrEqual(0);
        expect(profile.authorityResistanceScore).toBeLessThanOrEqual(1);
        expect(profile.strictnessCompatibility).toBeGreaterThanOrEqual(0);
        expect(profile.strictnessCompatibility).toBeLessThanOrEqual(1);
        expect(profile.uninstallRiskProbability).toBeGreaterThan(0);
        expect(profile.uninstallRiskProbability).toBeLessThan(1);
        expect(profile.goalUrgencyScore).toBeGreaterThanOrEqual(0);
        expect(profile.goalUrgencyScore).toBeLessThanOrEqual(1);
        expect(profile.emotionalReactivityScore).toBeGreaterThanOrEqual(0);
        expect(profile.emotionalReactivityScore).toBeLessThanOrEqual(1);
        expect(profile.selfEfficacyScore).toBeGreaterThanOrEqual(0);
        expect(profile.selfEfficacyScore).toBeLessThanOrEqual(1);
        expect(profile.baselineFocusEstimate).toBeGreaterThanOrEqual(0);
        expect(profile.baselineFocusEstimate).toBeLessThanOrEqual(1);
    });

    test('summary is non-empty and human-readable', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.personalizedSummary.length).toBeGreaterThan(50);
        expect(profile.personalizedSummary).not.toContain('neurotic');
        expect(profile.personalizedSummary).not.toContain('undefined');
        expect(profile.personalizedSummary).not.toContain('NaN');
    });

    test('response prediction matrix has valid probabilities', () => {
        const profile = buildUserProfile(mockAnswers);
        const m = profile.predictedResponseMatrix;
        expect(m.reflective).toBeGreaterThan(0);
        expect(m.reflective).toBeLessThan(1);
        expect(m.softDelay).toBeGreaterThan(0);
        expect(m.softDelay).toBeLessThan(1);
        expect(m.hardBlock).toBeGreaterThan(0);
        expect(m.hardBlock).toBeLessThan(1);
    });

    test('timestamps are set', () => {
        const profile = buildUserProfile(mockAnswers);
        expect(profile.createdAt).toBeGreaterThan(0);
        expect(profile.updatedAt).toBeGreaterThan(0);
        expect(profile.createdAt).toBe(profile.updatedAt);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15. Analyze All Open Inputs — Integration
// ═══════════════════════════════════════════════════════════════════════════════

describe('Analyze All Open Inputs — Integration', () => {
    test('produces complete TextAnalysisResult', () => {
        const result = analyzeAllOpenInputs({
            coreGoal: 'Get into IIT for my masters degree',
            primaryDistraction: 'YouTube and gaming',
            emotionalStateAfterDistraction: 'Guilty and frustrated',
            idealFutureSelf: 'A focused and disciplined researcher',
            selfIdentifiedWeakness: 'I procrastinate and overthink too much',
        });

        expect(result.goalCategory).toBe('academic');
        expect(result.distractionCategories.length).toBeGreaterThan(0);
        expect(result.emotionWords.length).toBeGreaterThan(0);
        expect(result.selfEfficacyScore).toBeGreaterThanOrEqual(0);
        expect(result.selfEfficacyScore).toBeLessThanOrEqual(1);
        expect(result.urgencyScore).toBeGreaterThanOrEqual(0);
        expect(result.urgencyScore).toBeLessThanOrEqual(1);
        expect(result.motivationType).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16. Authority Resistance Score
// ═══════════════════════════════════════════════════════════════════════════════

describe('Authority Resistance Score', () => {
    test('high Likert scores → high resistance', () => {
        const ar = computeAuthorityResistanceScore(7, 7);
        expect(ar).toBeCloseTo(1, 1);
    });

    test('low Likert scores → low resistance', () => {
        const ar = computeAuthorityResistanceScore(1, 1);
        expect(ar).toBeCloseTo(0, 1);
    });

    test('always in [0, 1]', () => {
        for (let a = 1; a <= 7; a++) {
            for (let b = 1; b <= 7; b++) {
                const ar = computeAuthorityResistanceScore(a, b);
                expect(ar).toBeGreaterThanOrEqual(0);
                expect(ar).toBeLessThanOrEqual(1);
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17. Baseline Focus Estimate
// ═══════════════════════════════════════════════════════════════════════════════

describe('Baseline Focus Estimate', () => {
    test('high C, high SES, low II → high focus', () => {
        const focus = computeBaselineFocusEstimate(7, 0.9, 0.1);
        expect(focus).toBeGreaterThan(0.7);
    });

    test('low C, low SES, high II → low focus', () => {
        const focus = computeBaselineFocusEstimate(1, 0.1, 0.9);
        expect(focus).toBeLessThan(0.2);
    });

    test('always in [0, 1]', () => {
        const focus = computeBaselineFocusEstimate(4, 0.5, 0.5);
        expect(focus).toBeGreaterThanOrEqual(0);
        expect(focus).toBeLessThanOrEqual(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 18. Example User Profiles
// ═══════════════════════════════════════════════════════════════════════════════

describe('Example User Profiles', () => {
    test('Archetype: Disciplined Achiever', () => {
        const profile = buildUserProfile({
            conscientiousness1: 7, conscientiousness2: 6,
            neuroticism1: 2, neuroticism2: 2,
            openness: 5, agreeableness: 5, extraversion: 4,
            authorityResistance1: 2, authorityResistance2: 1,
            strictnessPreference: 6, autonomyPreference: 3,
            coreGoal: 'I will land a placement at Google within 6 months',
            primaryDistraction: 'YouTube shorts during study breaks',
            emotionalStateAfterDistraction: 'Frustrated with myself, I feel guilty',
            idealFutureSelf: 'A top engineer who ships quality code daily',
            selfIdentifiedWeakness: 'I start strong but lose consistency over weeks',
        });

        expect(profile.impulsivityIndex).toBeLessThan(0.4);
        expect(profile.strictnessCompatibility).toBeGreaterThan(0.5);
        expect(profile.goalCategory).toBe('career');
        expect(profile.nudgeTone).toBe('supportive'); // High ERS + guilt
    });

    test('Archetype: Impulsive Rebel', () => {
        const profile = buildUserProfile({
            conscientiousness1: 2, conscientiousness2: 1,
            neuroticism1: 6, neuroticism2: 7,
            openness: 6, agreeableness: 3, extraversion: 6,
            authorityResistance1: 7, authorityResistance2: 6,
            strictnessPreference: 1, autonomyPreference: 7,
            coreGoal: 'Maybe someday I hope to figure out my career',
            primaryDistraction: 'Gaming all night on Valorant and scrolling reels',
            emotionalStateAfterDistraction: 'Whatever, I dont care, I feel indifferent',
            idealFutureSelf: 'I guess someone who has their life together',
            selfIdentifiedWeakness: 'I cant stop gaming, I always fail at quitting',
        });

        expect(profile.impulsivityIndex).toBeGreaterThan(0.5);
        expect(profile.strictnessCompatibility).toBeLessThan(0.3);
        expect(profile.uninstallRiskProbability).toBeGreaterThan(0.5);
        expect(profile.nudgeTone).toBe('sharp'); // Low ERS + indifference
    });

    test('Archetype: Anxious Perfectionist', () => {
        const profile = buildUserProfile({
            conscientiousness1: 5, conscientiousness2: 5,
            neuroticism1: 6, neuroticism2: 6,
            openness: 4, agreeableness: 6, extraversion: 2,
            authorityResistance1: 2, authorityResistance2: 2,
            strictnessPreference: 5, autonomyPreference: 3,
            coreGoal: 'I need to crack GATE exam this year, it is urgent',
            primaryDistraction: 'Overthinking and anxiety spiral, I keep worrying',
            emotionalStateAfterDistraction: 'Anxious, ashamed, stressed, overwhelmed',
            idealFutureSelf: 'A focused researcher who doesnt let anxiety control them',
            selfIdentifiedWeakness: 'Overthinking paralyzes me, I hope I can overcome it',
        });

        expect(profile.emotionalReactivityScore).toBeGreaterThan(0.4);
        expect(profile.goalCategory).toBe('academic');
        expect(profile.distractionTypeVector.mental_rumination).toBeGreaterThan(0);
        expect(profile.nudgeTone).toBe('supportive'); // High ERS (guilt/anxiety)
    });
});
