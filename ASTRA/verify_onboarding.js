// Direct verification script — uses compiled dist/ output
const {
    classifyGoal,
    detectUrgency,
    analyzeEmotionWords,
    analyzeSelfEfficacy,
    classifyDistraction,
    analyzeAllOpenInputs,
} = require('./dist/nlp/textAnalyzer');

const {
    computeGoalUrgencyScore,
    computeEmotionalReactivityScore,
    computeSelfEfficacyScore,
    computeDistractionTypeVector,
} = require('./dist/scoring/scoringEngine');

const {
    computeImpulsivityIndex,
    computeStrictnessCompatibility,
    computeAuthorityResistanceScore,
    selectNudgeTone,
    computeUninstallRiskProbability,
    computeBaselineFocusEstimate,
} = require('./dist/scoring/behavioralModel');

const { buildUserProfile } = require('./dist/engine/profileBuilder');
const { generatePersonalizedSummary } = require('./dist/engine/summaryGenerator');
const {
    seedResponsePredictionMatrix,
    bayesianUpdate,
} = require('./dist/engine/responsePrediction');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.log(`  FAIL: ${name}`);
    }
}

console.log('=== ASTRA Onboarding Verification ===\n');

// 1. Goal Classification
console.log('[1] Goal Classification');
let r = classifyGoal('I want to get an internship at a tech company');
assert(r.category === 'career', 'career classification');
r = classifyGoal('I need to crack GATE exam');
assert(r.category === 'academic', 'academic classification');
r = classifyGoal('I want to lose weight at gym');
assert(r.category === 'health', 'health classification');
r = classifyGoal('xyz abc 123');
assert(r.category === 'other', 'other fallback');
console.log(`  ${passed} passed`);
let prev = passed;

// 2. Urgency Detection
console.log('[2] Urgency Detection');
r = detectUrgency('I need to achieve this in 3 months');
assert(r.score >= 0.6, 'high urgency (' + r.score + ')');
r = detectUrgency('This is urgent');
assert(r.score >= 0.85, 'very high urgency (' + r.score + ')');
r = detectUrgency('someday');
assert(r.score < 0.25, 'low urgency (' + r.score + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 3. Emotion Words
console.log('[3] Emotion Analysis');
r = analyzeEmotionWords('I feel guilty and anxious');
assert(r.emotions.includes('guilty'), 'guilty detected');
assert(r.reactivityScore > 0.3, 'high reactivity (' + r.reactivityScore + ')');
r = analyzeEmotionWords('I feel indifferent');
assert(r.reactivityScore <= 0.3, 'low reactivity for indifference (' + r.reactivityScore + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 4. Self-Efficacy
console.log('[4] Self-Efficacy');
r = analyzeSelfEfficacy('I will do it. I am determined');
assert(r.score > 0.6, 'high efficacy (' + r.score + ')');
r = analyzeSelfEfficacy('I hope maybe it works');
assert(r.score < 0.5, 'low efficacy (' + r.score + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 5. Distraction Classification
console.log('[5] Distraction Classification');
r = classifyDistraction('Instagram reels');
assert(r.categories[0] === 'social_media', 'social media');
r = classifyDistraction('Valorant gaming');
assert(r.categories[0] === 'gaming', 'gaming');
r = classifyDistraction('overthinking');
assert(r.categories[0] === 'mental_rumination', 'rumination');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 6. Scoring Engine
console.log('[6] Scoring Engine');
const gus = computeGoalUrgencyScore({ urgencyScore: 0.8, urgencyMarkers: [] });
assert(gus >= 0 && gus <= 1, 'GUS range');
const ers = computeEmotionalReactivityScore({
    emotionWords: ['guilty', 'anxious'],
    emotionValences: { guilty: -0.8, anxious: -0.7 },
});
assert(ers > 0.4, 'ERS high (' + ers + ')');
const ersLow = computeEmotionalReactivityScore({
    emotionWords: ['indifferent'],
    emotionValences: { indifferent: 0 },
});
assert(ersLow < 0.2, 'ERS low (' + ersLow + ')');
const dtv = computeDistractionTypeVector({ distractionCategories: ['social_media', 'gaming'] });
assert(dtv.social_media === 1, 'DTV primary = 1');
assert(dtv.gaming > 0 && dtv.gaming < 1, 'DTV secondary');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 7. Behavioral Model
console.log('[7] Behavioral Model');
let ii = computeImpulsivityIndex(7, 1, 0.1);
assert(ii < 0.2, 'II low (' + ii + ')');
ii = computeImpulsivityIndex(1, 7, 0.9);
assert(ii > 0.7, 'II high (' + ii + ')');
const scs = computeStrictnessCompatibility(7, 7, 0.9, 1);
assert(scs > 0.7, 'SCS high (' + scs + ')');
assert(selectNudgeTone(0.7, 0.5, true, false) === 'supportive', 'nudge: supportive');
assert(selectNudgeTone(0.2, 0.5, false, true) === 'sharp', 'nudge: sharp');
assert(selectNudgeTone(0.4, 0.8, false, false) === 'challenge', 'nudge: challenge');
assert(selectNudgeTone(0.4, 0.2, false, false) === 'confidence_building', 'nudge: confidence');
const urp1 = computeUninstallRiskProbability(0.9, 0.1, 0.9, 7);
const urp2 = computeUninstallRiskProbability(0.1, 0.9, 0.1, 1);
assert(urp1 > urp2, 'URP high > low');
assert(urp1 > 0 && urp1 < 1, 'URP bounded');
const bf = computeBaselineFocusEstimate(7, 0.9, 0.1);
assert(bf > 0.7, 'baseline focus high (' + bf + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 8. Response Prediction
console.log('[8] Response Prediction');
const matrix = seedResponsePredictionMatrix(0.5, 0.5, 0.5, 0.5);
assert(matrix.reflective > 0 && matrix.reflective < 1, 'reflective valid');
assert(matrix.softDelay > 0 && matrix.softDelay < 1, 'softDelay valid');
assert(matrix.hardBlock > 0 && matrix.hardBlock < 1, 'hardBlock valid');
const updated = bayesianUpdate(0.5, true, 1);
assert(updated > 0.5, 'Bayesian success increases (' + updated + ')');
const updated2 = bayesianUpdate(0.5, false, 1);
assert(updated2 < 0.5, 'Bayesian failure decreases (' + updated2 + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 9. Summary Generator
console.log('[9] Summary Generator');
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
assert(summary.length > 50, 'summary length');
assert(summary.toLowerCase().includes('academic'), 'mentions academic');
assert(!summary.toLowerCase().includes('neurotic'), 'no clinical labels');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 10. End-to-End Profile Builder
console.log('[10] End-to-End Profile Builder');
const profile = buildUserProfile({
    conscientiousness1: 5, conscientiousness2: 6,
    neuroticism1: 3, neuroticism2: 4,
    openness: 5, agreeableness: 4, extraversion: 3,
    authorityResistance1: 2, authorityResistance2: 3,
    strictnessPreference: 5, autonomyPreference: 4,
    coreGoal: 'I will get a software internship in 3 months',
    primaryDistraction: 'Instagram reels and YouTube shorts',
    emotionalStateAfterDistraction: 'I feel guilty and anxious',
    idealFutureSelf: 'A disciplined engineer who ships projects',
    selfIdentifiedWeakness: 'I struggle with phone addiction',
});
assert(profile.bigFive.conscientiousness === 5.5, 'Big Five C = 5.5');
assert(profile.bigFive.neuroticism === 3.5, 'Big Five N = 3.5');
assert(profile.goalCategory === 'career', 'goal = career');
assert(profile.distractionTypeVector.social_media === 1, 'DTV social_media = 1');
assert(profile.impulsivityIndex >= 0 && profile.impulsivityIndex <= 1, 'II in range');
assert(profile.strictnessCompatibility >= 0 && profile.strictnessCompatibility <= 1, 'SCS in range');
assert(profile.uninstallRiskProbability > 0 && profile.uninstallRiskProbability < 1, 'URP in range');
assert(profile.personalizedSummary.length > 50, 'summary generated');
assert(!profile.personalizedSummary.includes('undefined'), 'no undefined in summary');
assert(!profile.personalizedSummary.includes('NaN'), 'no NaN in summary');
assert(profile.createdAt > 0, 'timestamp set');
assert(profile.rawAnswers !== undefined, 'raw answers preserved');
assert(profile.predictedResponseMatrix.reflective > 0, 'prediction matrix seeded');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 11. Archetype: Impulsive Rebel
console.log('[11] Archetype: Impulsive Rebel');
const rebel = buildUserProfile({
    conscientiousness1: 2, conscientiousness2: 1,
    neuroticism1: 6, neuroticism2: 7,
    openness: 6, agreeableness: 3, extraversion: 6,
    authorityResistance1: 7, authorityResistance2: 6,
    strictnessPreference: 1, autonomyPreference: 7,
    coreGoal: 'Maybe someday I hope to figure out my career',
    primaryDistraction: 'Gaming all night on Valorant and scrolling reels',
    emotionalStateAfterDistraction: 'Whatever, I dont care, I feel indifferent',
    idealFutureSelf: 'I guess someone who has their life together',
    selfIdentifiedWeakness: 'I cant stop gaming, I always fail',
});
assert(rebel.impulsivityIndex > 0.5, 'rebel: high II (' + rebel.impulsivityIndex + ')');
assert(rebel.strictnessCompatibility < 0.3, 'rebel: low SCS (' + rebel.strictnessCompatibility + ')');
assert(rebel.uninstallRiskProbability > 0.5, 'rebel: high URP (' + rebel.uninstallRiskProbability + ')');
console.log(`  ${passed - prev} passed`);
prev = passed;

// 12. Archetype: Disciplined Achiever
console.log('[12] Archetype: Disciplined Achiever');
const achiever = buildUserProfile({
    conscientiousness1: 7, conscientiousness2: 6,
    neuroticism1: 2, neuroticism2: 2,
    openness: 5, agreeableness: 5, extraversion: 4,
    authorityResistance1: 2, authorityResistance2: 1,
    strictnessPreference: 6, autonomyPreference: 3,
    coreGoal: 'I will land a placement at Google within 6 months',
    primaryDistraction: 'YouTube shorts during study breaks',
    emotionalStateAfterDistraction: 'Frustrated with myself, I feel guilty',
    idealFutureSelf: 'A top engineer who ships quality code daily',
    selfIdentifiedWeakness: 'I start strong but lose consistency',
});
assert(achiever.impulsivityIndex < 0.4, 'achiever: low II (' + achiever.impulsivityIndex + ')');
assert(achiever.strictnessCompatibility > 0.5, 'achiever: high SCS (' + achiever.strictnessCompatibility + ')');
assert(achiever.goalCategory === 'career', 'achiever: career goal');
console.log(`  ${passed - prev} passed`);

// Final Report
console.log('\n' + '='.repeat(50));
if (failed === 0) {
    console.log(`ALL ${passed} TESTS PASSED`);
} else {
    console.log(`${passed} passed, ${failed} FAILED`);
}
console.log('='.repeat(50));

// Print sample profile for inspection
console.log('\n--- Sample Profile (Disciplined Achiever) ---');
console.log(JSON.stringify({
    bigFive: achiever.bigFive,
    impulsivityIndex: achiever.impulsivityIndex.toFixed(3),
    authorityResistanceScore: achiever.authorityResistanceScore.toFixed(3),
    strictnessCompatibility: achiever.strictnessCompatibility.toFixed(3),
    uninstallRiskProbability: achiever.uninstallRiskProbability.toFixed(3),
    goalCategory: achiever.goalCategory,
    goalUrgencyScore: achiever.goalUrgencyScore.toFixed(3),
    emotionalReactivityScore: achiever.emotionalReactivityScore.toFixed(3),
    selfEfficacyScore: achiever.selfEfficacyScore.toFixed(3),
    nudgeTone: achiever.nudgeTone,
    motivationType: achiever.motivationType,
    baselineFocusEstimate: achiever.baselineFocusEstimate.toFixed(3),
    personalizedSummary: achiever.personalizedSummary,
}, null, 2));

console.log('\nOnboarding + Personality Hybrid Module Complete.');

process.exit(failed > 0 ? 1 : 0);
