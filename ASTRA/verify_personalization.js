// Direct verification script for ASTRA Adaptive Personalization Engine
// Uses compiled dist/ output (paths match tsc output structure)

const { initializeBaselineState, computeGoalDriveScore, computeEmotionalSensitivityScore, computeAuthorityResistanceScore, mapToStrictnessLevel, mapToFocusLength, computeInterventionTolerance } = require('./dist/personalization/layers/baselineInitializer');
const { updateCompliance, updateComplianceMatrix, evolveStrictness, recordNudgeFatigue, decayFatigue, shouldThrottleIntervention, updateNudgeEffectiveness, selectBestNudgeTone, getMostEffectiveIntervention, processComplianceEvent } = require('./dist/personalization/layers/behavioralAdaptation');
const { computeInterventionSuitability, selectInterventionPolicy, selectRecoveryRecommendation, computeStressProxy } = require('./dist/personalization/layers/contextualDecisionEngine');
const { recordFocusSession, computeAttentionTrend, getRecommendedSessionLength } = require('./dist/personalization/tracking/attentionEvolution');
const { recordFocusDay, checkStreakBroken, getHabitSuggestions, selectRecoveryProtocol, getStreakMessage } = require('./dist/personalization/tracking/habitEngine');
const { initializePersonalization, computePersonalizationProfile, processComplianceEvent: pce, recordSession: rs, performDailyUpdate: du, getPersonalizedGreeting } = require('./dist/personalization/engine/personalizationEngine');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; }
    else { failed++; console.log(`  FAIL: ${name}`); }
}

// Mock UserProfile (Disciplined Achiever archetype)
const achieverProfile = {
    bigFive: { conscientiousness: 6.5, neuroticism: 2, openness: 5, agreeableness: 5, extraversion: 4 },
    impulsivityIndex: 0.1,
    authorityResistanceScore: 0.08,
    strictnessCompatibility: 0.8,
    uninstallRiskProbability: 0.2,
    motivationType: 'extrinsic',
    goalCategory: 'career',
    goalUrgencyScore: 0.7,
    goalText: 'Land a placement at Google',
    emotionalReactivityScore: 0.55,
    selfEfficacyScore: 0.7,
    distractionTypeVector: { social_media: 1, gaming: 0, mental_rumination: 0.3, social_interaction: 0, fatigue: 0, other: 0 },
    predictedResponseMatrix: { reflective: 0.65, softDelay: 0.55, hardBlock: 0.45 },
    baselineFocusEstimate: 0.8,
    nudgeTone: 'supportive',
    personalizedSummary: 'Test',
    idealFutureSelf: 'Top engineer',
    rawAnswers: {},
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
};

// Rebel archetype
const rebelProfile = {
    bigFive: { conscientiousness: 1.5, neuroticism: 6.5, openness: 6, agreeableness: 3, extraversion: 6 },
    impulsivityIndex: 0.85,
    authorityResistanceScore: 0.75,
    strictnessCompatibility: 0.2,
    uninstallRiskProbability: 0.7,
    motivationType: 'mixed',
    goalCategory: 'other',
    goalUrgencyScore: 0.2,
    goalText: 'Maybe figure things out',
    emotionalReactivityScore: 0.15,
    selfEfficacyScore: 0.25,
    distractionTypeVector: { social_media: 0.5, gaming: 1, mental_rumination: 0, social_interaction: 0.3, fatigue: 0, other: 0 },
    predictedResponseMatrix: { reflective: 0.4, softDelay: 0.3, hardBlock: 0.2 },
    baselineFocusEstimate: 0.25,
    nudgeTone: 'sharp',
    personalizedSummary: 'Test',
    idealFutureSelf: 'Someone who has life together',
    rawAnswers: {},
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
};

console.log('=== ASTRA Adaptive Personalization Engine Verification ===\n');

// ── Layer 1: Baseline Initializer ────────────────────────────────────────────
console.log('[1] Layer 1: Baseline Initializer');
const gds = computeGoalDriveScore(achieverProfile);
assert(gds > 0.5, 'achiever GDS > 0.5 (' + gds.toFixed(3) + ')');
const ars = computeAuthorityResistanceScore(achieverProfile);
assert(ars < 0.15, 'achiever ARS low (' + ars.toFixed(3) + ')');
const ess = computeEmotionalSensitivityScore(achieverProfile);
assert(ess > 0.4 && ess < 0.7, 'achiever ESS moderate (' + ess.toFixed(3) + ')');

const sl = mapToStrictnessLevel(0.8);
assert(sl >= 4, 'SCS 0.8 → strictness 4+ (' + sl + ')');
assert(mapToStrictnessLevel(0.2) <= 2, 'SCS 0.2 → strictness ≤2');

const fl = mapToFocusLength(0.8);
assert(fl === 45 * 60 * 1000, 'high focus → 45min');
assert(mapToFocusLength(0.2) === 15 * 60 * 1000, 'low focus → 15min');

const tol = computeInterventionTolerance(0.08, 0.8, 0.55);
assert(tol > 0.5, 'tolerance high for achiever (' + tol.toFixed(3) + ')');

const achieverState = initializeBaselineState(achieverProfile);
assert(achieverState.baselineStrictness >= 4, 'achiever baseline strictness ≥ 4');
assert(achieverState.baselineNudgeTone === 'supportive', 'achiever nudge tone');
assert(achieverState.complianceMatrix.reflective.probability === 0.65, 'seeded reflective P');
assert(achieverState.impulsivityIndex === 0.1, 'II carried from profile');

const rebelState = initializeBaselineState(rebelProfile);
assert(rebelState.baselineStrictness <= 2, 'rebel baseline strictness ≤ 2');
assert(rebelState.baselineNudgeTone === 'sharp', 'rebel nudge tone');
assert(rebelState.impulsivityIndex === 0.85, 'rebel II');
console.log(`  ${passed} passed`);
let prev = passed;

// ── Layer 2: Bayesian Adaptation ─────────────────────────────────────────────
console.log('[2] Layer 2: Bayesian Adaptation');

let tracking = { successes: 0, attempts: 0, probability: 0.5, lastUpdated: 0, recentSuccesses: 0, recentAttempts: 0 };
tracking = updateCompliance(tracking, true);
assert(tracking.probability > 0.5, 'success increases P (' + tracking.probability.toFixed(3) + ')');
tracking = updateCompliance(tracking, false);
assert(tracking.attempts === 2, 'attempts = 2');

let strict = { currentLevel: 3, baselineLevel: 3, complianceRate: 0.5, overrideFrequency: 0, sessionSuccessRate: 0.5, lastAdjustment: Date.now() - 10 * 86400000, adjustmentDirection: 'hold' };
let evolved = evolveStrictness(strict, 0.85, 0.1, 0.85, 0.1);
assert(evolved.currentLevel === 4, 'escalate: 3 → 4');
evolved = evolveStrictness({ ...strict, currentLevel: 4, lastAdjustment: Date.now() - 10 * 86400000 }, 0.3, 0.5, 0.3, 0.1);
assert(evolved.currentLevel === 3, 'de-escalate: 4 → 3');
evolved = evolveStrictness({ ...strict, currentLevel: 3, lastAdjustment: Date.now() - 10 * 86400000 }, 0.9, 0.05, 0.9, 0.8);
assert(evolved.currentLevel <= 3, 'AR cap: never above 3 for high AR');

let fatigue = { fatigueScore: 0, nudgesDeliveredToday: 0, dismissalsToday: 0, lastNudgeTime: 0, consecutiveDismissals: 0 };
fatigue = recordNudgeFatigue(fatigue, false);
assert(fatigue.fatigueScore > 0, 'fatigue increases');
assert(fatigue.consecutiveDismissals === 0, 'no consecutive dismissals');
fatigue = recordNudgeFatigue(fatigue, true);
assert(fatigue.consecutiveDismissals === 1, 'consecutive = 1');
fatigue = recordNudgeFatigue(fatigue, true);
assert(fatigue.consecutiveDismissals === 2, 'consecutive = 2');
assert(fatigue.fatigueScore > 0.4, 'high fatigue after dismissals (' + fatigue.fatigueScore.toFixed(3) + ')');

let throttle = shouldThrottleIntervention(fatigue);
assert(throttle.severity !== 'none', 'should throttle');

let decayed = decayFatigue(fatigue);
assert(decayed.fatigueScore < fatigue.fatigueScore, 'decay reduces fatigue');
assert(decayed.nudgesDeliveredToday === 0, 'daily reset');

let eff = { supportive: 0.5, sharp: 0.5, challenge: 0.5, confidence_building: 0.5 };
eff = updateNudgeEffectiveness(eff, 'supportive', true);
assert(eff.supportive > 0.5, 'supportive increases on success');
const bestTone = selectBestNudgeTone(eff, 'challenge');
assert(bestTone === 'supportive', 'most effective tone selected');
console.log(`  ${passed - prev} passed`);
prev = passed;

// ── Layer 3: Contextual Decision Engine ──────────────────────────────────────
console.log('[3] Layer 3: Contextual Decision Engine');

const context = { timeOfDay: 'afternoon', hourOfDay: 14, cognitiveReadinessScore: 0.7, recentAFI: 0.6, goalConflict: 0.8, distractionSeverity: 0.7, isInFocusSession: false, stressProxy: 0.3, goalUrgency: 0.7 };

const iss = computeInterventionSuitability(context, achieverState);
assert(iss.score > 0.4, 'ISS > 0.4 (' + iss.score.toFixed(3) + ')');
assert(iss.recommendedType !== undefined, 'ISS recommends a type');

const lowContext = { ...context, goalConflict: 0.1, distractionSeverity: 0.1, cognitiveReadinessScore: 0.1 };
const lowISS = computeInterventionSuitability(lowContext, achieverState);
assert(lowISS.recommendedType === 'reflective', 'low ISS → reflective');

const highContext = { ...context, goalConflict: 0.9, distractionSeverity: 0.95, cognitiveReadinessScore: 0.9, isInFocusSession: true };
const highISS = computeInterventionSuitability(highContext, achieverState);
assert(highISS.score > 0.6, 'high ISS (' + highISS.score.toFixed(3) + ')');

const depletedContext = { ...context, cognitiveReadinessScore: 0.1, goalConflict: 0.5, distractionSeverity: 0.5 };
const depletedISS = computeInterventionSuitability(depletedContext, achieverState);
assert(depletedISS.shouldDelay === true, 'should delay when CRS < 0.25');

const recovery = selectRecoveryRecommendation(0.7, 0.3, 0.7);
assert(recovery.style === 'breathing', 'high ESS + high stress → breathing');
const recoveryLow = selectRecoveryRecommendation(0.2, 0.5, 0.6);
assert(recoveryLow.style === 'walk', 'low ESS + high stress → walk');

const stress = computeStressProxy(0.3, 0.3);
assert(stress > 0.5, 'low HRV & low AFI → high stress (' + stress.toFixed(3) + ')');

const policy = selectInterventionPolicy(iss, achieverState);
assert(policy.message.length > 10, 'policy message generated');
console.log(`  ${passed - prev} passed`);
prev = passed;

// ── Attention Evolution ──────────────────────────────────────────────────────
console.log('[4] Attention Evolution');

let attention = { expectedFocusTime: 25 * 60000, successRate: 0.5, sessionHistory: [], trend: 'stable', recommendedSessionLength: 25 * 60000, growthFactor: 1.0 };
for (let i = 0; i < 10; i++) {
    attention = recordFocusSession(attention, { timestamp: Date.now() - (10 - i) * 3600000, duration: 25 * 60000, planned: 25 * 60000, wasSuccessful: true });
}
assert(attention.successRate >= 0.8, 'high success rate');
assert(attention.growthFactor > 1, 'growth factor > 1');
assert(attention.recommendedSessionLength > 25 * 60000, 'length increases (' + Math.round(attention.recommendedSessionLength / 60000) + 'min)');

for (let i = 0; i < 8; i++) {
    attention = recordFocusSession(attention, { timestamp: Date.now(), duration: 10 * 60000, planned: 25 * 60000, wasSuccessful: false });
}
assert(attention.successRate < 0.5, 'low success rate');
assert(attention.growthFactor < 1, 'shrink factor');
assert(getRecommendedSessionLength(attention) >= 10 * 60000, 'min 10 min');
console.log(`  ${passed - prev} passed`);
prev = passed;

// ── Habit Engine ─────────────────────────────────────────────────────────────
console.log('[5] Habit Engine');

let habits = { currentStreak: 0, longestStreak: 0, lastFocusDate: '', totalFocusDays: 0, weeklyFocusMinutes: [0, 0, 0, 0, 0, 0, 0] };
habits = recordFocusDay(habits, '2026-02-25', 30);
assert(habits.currentStreak === 1, 'streak = 1');
habits = recordFocusDay(habits, '2026-02-26', 45);
assert(habits.currentStreak === 2, 'streak = 2');
habits = recordFocusDay(habits, '2026-02-27', 60);
assert(habits.currentStreak === 3, 'streak = 3');
habits = checkStreakBroken(habits, '2026-03-01');
assert(habits.currentStreak === 0, 'streak broken');
assert(habits.longestStreak === 3, 'longest streak = 3');

const suggestions = getHabitSuggestions('social_media', 0.5, 0);
assert(suggestions.length > 0 && suggestions.length <= 3, 'suggestions returned');

const proto = selectRecoveryProtocol('long-session', 0.7, 0.5);
assert(proto.style === 'breathing', 'long session + high ESS → breathing');
const protoLow = selectRecoveryProtocol('switch-burst', 0.2, 0.5);
assert(protoLow.style === 'cold_exposure', 'burst + low ESS → cold exposure');

assert(getStreakMessage(0).includes('Start'), 'streak 0 message');
assert(getStreakMessage(7).includes('7'), 'streak 7 message');
console.log(`  ${passed - prev} passed`);
prev = passed;

// ── End-to-End Orchestrator ──────────────────────────────────────────────────
console.log('[6] End-to-End Orchestrator');

let state = initializePersonalization(achieverProfile);
assert(state.baselineStrictness >= 4, 'init: strictness');
assert(state.goalDriveScore > 0.5, 'init: GDS');

const profile = computePersonalizationProfile(state, context);
assert(profile.strictnessLevel >= 1 && profile.strictnessLevel <= 5, 'profile: strictness bounded');
assert(profile.nudgeTone !== undefined, 'profile: nudge tone set');
assert(profile.focusSessionLength > 0, 'profile: session length');
assert(profile.recoveryRecommendation !== undefined, 'profile: recovery');
assert(profile.habitSuggestions.length > 0, 'profile: habits');
assert(profile.complianceProbabilityMatrix.reflective > 0, 'profile: compliance matrix');
assert(profile.uninstallRiskScore >= 0 && profile.uninstallRiskScore <= 1, 'profile: URP bounded');
assert(profile.attentionTrend !== undefined, 'profile: trend');
assert(profile.interventionSuitability.score > 0, 'profile: ISS');

state = pce(state, { timestamp: Date.now(), interventionType: 'reflective', wasSuccessful: true, wasOverride: false });
assert(state.complianceMatrix.reflective.attempts === 1, 'event recorded');
assert(state.totalInteractions === 1, 'interaction counted');

state = rs(state, { timestamp: Date.now(), duration: 25 * 60000, planned: 25 * 60000, wasSuccessful: true });
assert(state.attention.sessionHistory.length === 1, 'session recorded');

state = du(state);
assert(state.fatigue.nudgesDeliveredToday === 0, 'daily reset');

const greeting = getPersonalizedGreeting(state);
assert(greeting.length > 10, 'greeting generated');
console.log(`  ${passed - prev} passed`);
prev = passed;

// ── Rebel End-to-End ─────────────────────────────────────────────────────────
console.log('[7] Rebel Archetype');

const rebelS = initializePersonalization(rebelProfile);
const rebelP = computePersonalizationProfile(rebelS, { timeOfDay: 'evening', hourOfDay: 20, cognitiveReadinessScore: 0.3, recentAFI: 0.3, goalConflict: 0.5, distractionSeverity: 0.6, isInFocusSession: false, stressProxy: 0.5, goalUrgency: 0.2 });
assert(rebelP.strictnessLevel <= 2, 'rebel: low strictness');
assert(rebelP.uninstallRiskScore > 0.1, 'rebel: uninstall risk');
assert(rebelP.interventionPolicy !== 'hard_block', 'rebel: no hard blocks');
console.log(`  ${passed - prev} passed`);

// Final
console.log('\n' + '='.repeat(55));
if (failed === 0) { console.log(`ALL ${passed} TESTS PASSED`); }
else { console.log(`${passed} passed, ${failed} FAILED`); }
console.log('='.repeat(55));

console.log('\n--- Sample PersonalizationProfile ---');
console.log(JSON.stringify({
    strictnessLevel: profile.strictnessLevel,
    nudgeTone: profile.nudgeTone,
    interventionPolicy: profile.interventionPolicy,
    focusSessionLengthMin: Math.round(profile.focusSessionLength / 60000),
    recoveryStyle: profile.recoveryRecommendation.style,
    cognitiveReadiness: profile.cognitiveReadiness.toFixed(3),
    attentionTrend: profile.attentionTrend,
    uninstallRiskScore: profile.uninstallRiskScore.toFixed(3),
    fatigueLevel: profile.fatigueLevel.toFixed(3),
    ISS: profile.interventionSuitability.score.toFixed(3),
    compliance: {
        reflective: profile.complianceProbabilityMatrix.reflective.toFixed(3),
        soft_delay: profile.complianceProbabilityMatrix.soft_delay.toFixed(3),
        hard_block: profile.complianceProbabilityMatrix.hard_block.toFixed(3),
    },
    streak: profile.currentStreak,
}, null, 2));

console.log('\nAdaptive Personalization Engine Complete.');
process.exit(failed > 0 ? 1 : 0);
