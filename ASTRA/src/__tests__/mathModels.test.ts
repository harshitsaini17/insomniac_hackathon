// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Focus Trainer — Unit Tests for Mathematical Models
// ─────────────────────────────────────────────────────────────────────────────

import {
    minMaxNormalize,
    clamp,
    shannonEntropy,
    normalizedEntropy,
    weightedSum,
    movingAverage,
    safeDivide,
    getTimeOfDay,
} from '../modules/focusTrainer/math/normalize';

import { computeAFI } from '../modules/focusTrainer/math/attentionFragmentation';
import { computeSingleDS } from '../modules/focusTrainer/math/distractivenessScore';
import { computeImpulsivityIndex } from '../modules/focusTrainer/math/personalityStrictness';
import { computeGoalConflict } from '../modules/focusTrainer/math/goalConflict';
import {
    computeNextSessionLength,
    isSessionSuccessful,
    computeBreakDuration,
} from '../modules/focusTrainer/math/pomodoroSurvival';
import { computeComplianceProbability } from '../modules/focusTrainer/math/complianceProbability';
import { computeCRS } from '../modules/focusTrainer/math/cognitiveReadiness';
import { detectDopamineBinge } from '../modules/focusTrainer/math/dopamineDetection';
import { generateFocusHeatmap, findOptimalWindows } from '../modules/focusTrainer/math/attentionForecasting';

import { AppUsageSession, PomodoroSession } from '../modules/focusTrainer/models/types';

// ═══════════════════════════════════════════════════════════════════════════════
// Normalization Utilities
// ═══════════════════════════════════════════════════════════════════════════════

describe('Normalization Utilities', () => {
    test('minMaxNormalize maps to [0,1]', () => {
        expect(minMaxNormalize(50, 0, 100)).toBe(0.5);
        expect(minMaxNormalize(0, 0, 100)).toBe(0);
        expect(minMaxNormalize(100, 0, 100)).toBe(1);
    });

    test('minMaxNormalize clamps out-of-range values', () => {
        expect(minMaxNormalize(-10, 0, 100)).toBe(0);
        expect(minMaxNormalize(150, 0, 100)).toBe(1);
    });

    test('minMaxNormalize handles equal min/max', () => {
        expect(minMaxNormalize(5, 5, 5)).toBe(0.5);
    });

    test('clamp constrains values', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    test('shannonEntropy of uniform distribution', () => {
        // 4 equal values → max entropy = log2(4) = 2
        const entropy = shannonEntropy([25, 25, 25, 25]);
        expect(entropy).toBeCloseTo(2, 5);
    });

    test('shannonEntropy of single-element is 0', () => {
        expect(shannonEntropy([100])).toBe(0);
        expect(shannonEntropy([])).toBe(0);
    });

    test('normalizedEntropy in [0,1]', () => {
        const ne = normalizedEntropy([25, 25, 25, 25]);
        expect(ne).toBeCloseTo(1, 5); // uniform → 1
    });

    test('weightedSum computes correctly', () => {
        expect(weightedSum([1, 0], [0.5, 0.5])).toBe(0.5);
        expect(weightedSum([1, 1], [0.5, 0.5])).toBe(1);
        expect(weightedSum([], [])).toBe(0);
    });

    test('movingAverage over last N', () => {
        expect(movingAverage([10, 20, 30], 2)).toBe(25); // (20+30)/2
        expect(movingAverage([], 5)).toBe(0);
    });

    test('safeDivide handles zero denominator', () => {
        expect(safeDivide(10, 0)).toBe(0);
        expect(safeDivide(10, 0, -1)).toBe(-1);
        expect(safeDivide(10, 2)).toBe(5);
    });

    test('getTimeOfDay returns correct labels', () => {
        expect(getTimeOfDay(8)).toBe('morning');
        expect(getTimeOfDay(14)).toBe('afternoon');
        expect(getTimeOfDay(19)).toBe('evening');
        expect(getTimeOfDay(2)).toBe('night');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 1: Attention Fragmentation Index
// ═══════════════════════════════════════════════════════════════════════════════

describe('Attention Fragmentation Index (AFI)', () => {
    const makeSession = (overrides?: Partial<AppUsageSession>): AppUsageSession => ({
        appName: 'TestApp',
        packageName: 'com.test.app',
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        duration: 60000,
        switchCount: 2,
        unlockCount: 1,
        timeOfDay: 'morning',
        dayOfWeek: 1,
        ...overrides,
    });

    test('empty sessions → deep focus (score 0)', () => {
        const result = computeAFI([], 3600000);
        expect(result.score).toBe(0);
        expect(result.level).toBe('deep');
    });

    test('long sessions with few switches → low AFI', () => {
        const sessions = Array.from({ length: 3 }, () =>
            makeSession({ duration: 1200000, switchCount: 0, unlockCount: 0 }),
        );
        const result = computeAFI(sessions, 3600000);
        expect(result.score).toBeLessThan(0.4);
    });

    test('many short sessions with high switches → high AFI', () => {
        const sessions = Array.from({ length: 20 }, (_, i) =>
            makeSession({
                packageName: `com.app${i % 5}`,
                duration: 10000,
                switchCount: 5,
                unlockCount: 2,
            }),
        );
        const result = computeAFI(sessions, 3600000);
        expect(result.score).toBeGreaterThan(0.4);
    });

    test('output has all required fields', () => {
        const sessions = [makeSession()];
        const result = computeAFI(sessions, 3600000);
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('level');
        expect(result).toHaveProperty('switchesPerHour');
        expect(result).toHaveProperty('unlocksPerHour');
        expect(result).toHaveProperty('avgSessionDuration');
        expect(result).toHaveProperty('entropy');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 2: Distractiveness Score
// ═══════════════════════════════════════════════════════════════════════════════

describe('Distractiveness Score (DS)', () => {
    test('low usage → low DS, not distractive', () => {
        const result = computeSingleDS({
            appName: 'Notes',
            packageName: 'com.notes',
            totalTime: 60000,
            openFrequency: 2,
            avgSessionDuration: 30000,
            conflictDuringFocus: 0,
        });
        expect(result.score).toBeLessThan(0.3);
        expect(result.isDistractive).toBe(false);
    });

    test('high usage during focus → high DS, distractive', () => {
        const result = computeSingleDS({
            appName: 'Instagram',
            packageName: 'com.instagram.android',
            totalTime: 7200000, // 2 hours
            openFrequency: 50,
            avgSessionDuration: 144000,
            conflictDuringFocus: 0.9,
        });
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.isDistractive).toBe(true);
    });

    test('score is in [0, 1]', () => {
        const result = computeSingleDS({
            appName: 'Test',
            packageName: 'com.test',
            totalTime: 999999999,
            openFrequency: 999,
            avgSessionDuration: 1,
            conflictDuringFocus: 1,
        });
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 3: Personality-Based Strictness
// ═══════════════════════════════════════════════════════════════════════════════

describe('Personality-Based Strictness', () => {
    test('high C, low N → reflective only (Level 1)', () => {
        const result = computeImpulsivityIndex({
            conscientiousness: 7,
            neuroticism: 1,
        });
        expect(result.impulsivityIndex).toBeLessThan(0.3);
        expect(result.recommendedLevel).toBe(1);
        expect(result.label).toBe('reflective-only');
    });

    test('moderate C and N → soft block (Level 2)', () => {
        const result = computeImpulsivityIndex({
            conscientiousness: 4,
            neuroticism: 4,
        });
        expect(result.impulsivityIndex).toBeGreaterThanOrEqual(0.3);
        expect(result.impulsivityIndex).toBeLessThan(0.6);
        expect(result.recommendedLevel).toBe(2);
    });

    test('low C, high N → hard block (Level 3)', () => {
        const result = computeImpulsivityIndex({
            conscientiousness: 1,
            neuroticism: 7,
        });
        expect(result.impulsivityIndex).toBeGreaterThanOrEqual(0.6);
        expect(result.recommendedLevel).toBe(3);
        expect(result.label).toBe('hard-block');
    });

    test('index is in [0, 1]', () => {
        for (let c = 1; c <= 7; c++) {
            for (let n = 1; n <= 7; n++) {
                const result = computeImpulsivityIndex({ conscientiousness: c, neuroticism: n });
                expect(result.impulsivityIndex).toBeGreaterThanOrEqual(0);
                expect(result.impulsivityIndex).toBeLessThanOrEqual(1);
            }
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 4: Goal Conflict Score
// ═══════════════════════════════════════════════════════════════════════════════

describe('Goal Conflict Score (GCS)', () => {
    const goal = {
        id: 'test',
        title: 'Study for exam',
        importance: 0.9,
        isActive: true,
        associatedApps: ['com.notion'],
    };

    test('high importance × high mismatch × high DS → high GCS', () => {
        const result = computeGoalConflict(goal, 0.9, 0.8);
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.shouldEscalate).toBe(true);
    });

    test('low importance → low GCS', () => {
        const lowGoal = { ...goal, importance: 0.1 };
        const result = computeGoalConflict(lowGoal, 0.9, 0.8);
        expect(result.score).toBeLessThan(0.3);
    });

    test('zero mismatch → zero GCS', () => {
        const result = computeGoalConflict(goal, 0, 0.9);
        expect(result.score).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 5: Pomodoro Survival
// ═══════════════════════════════════════════════════════════════════════════════

describe('Pomodoro Survival Modeling', () => {
    const makePomodoro = (successful: boolean, duration: number): PomodoroSession => ({
        startTime: Date.now(),
        plannedDuration: 1500000,
        actualDuration: duration,
        wasSuccessful: successful,
        breakDuration: 300000,
    });

    test('no history → default 25 minutes', () => {
        const result = computeNextSessionLength([]);
        expect(result.nextDuration).toBe(25 * 60 * 1000);
    });

    test('high success rate → increases session length', () => {
        const sessions = Array(5).fill(null).map(() =>
            makePomodoro(true, 1500000),
        );
        const result = computeNextSessionLength(sessions);
        expect(result.nextDuration).toBeGreaterThan(1500000);
        expect(result.growthFactor).toBeGreaterThan(1);
    });

    test('low success rate → decreases session length', () => {
        const sessions = Array(5).fill(null).map(() =>
            makePomodoro(false, 600000),
        );
        const result = computeNextSessionLength(sessions);
        expect(result.nextDuration).toBeLessThan(1500000);
        expect(result.growthFactor).toBeLessThan(1);
    });

    test('isSessionSuccessful checks 90% threshold', () => {
        expect(isSessionSuccessful(1350000, 1500000)).toBe(true);  // 90%
        expect(isSessionSuccessful(1200000, 1500000)).toBe(false); // 80%
    });

    test('break duration: long break every 4 sessions', () => {
        expect(computeBreakDuration(4)).toBe(15 * 60 * 1000);
        expect(computeBreakDuration(3)).toBe(5 * 60 * 1000);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 6: Compliance Probability
// ═══════════════════════════════════════════════════════════════════════════════

describe('Compliance Probability (Bayesian)', () => {
    test('zero attempts → uninformative prior (0.50)', () => {
        const result = computeComplianceProbability(0, 0);
        expect(result.probability).toBeCloseTo(0.5, 2);
    });

    test('all successes → high probability', () => {
        const result = computeComplianceProbability(10, 10);
        expect(result.probability).toBeGreaterThan(0.8);
    });

    test('all failures → low probability, should escalate', () => {
        const result = computeComplianceProbability(0, 10);
        expect(result.probability).toBeLessThan(0.15);
        expect(result.shouldEscalate).toBe(true);
    });

    test('Laplace smoothing: 1/1 → 0.67', () => {
        const result = computeComplianceProbability(1, 1);
        expect(result.probability).toBeCloseTo(0.667, 2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 7: Cognitive Readiness Score
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cognitive Readiness Score (CRS)', () => {
    test('perfect health, low AFI → high CRS, focus recommended', () => {
        const result = computeCRS(
            {
                sleepDuration: 8, sleepQuality: 0.9,
                hrv: 80, hrvNormalized: 0.8,
                steps: 8000, activityLevel: 0.6,
                timestamp: Date.now(),
            },
            0.2, // low AFI
        );
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.recommendation).toBe('focus');
    });

    test('poor health, high AFI → low CRS, rest recommended', () => {
        const result = computeCRS(
            {
                sleepDuration: 3, sleepQuality: 0.1,
                hrv: 25, hrvNormalized: 0.1,
                steps: 500, activityLevel: 0.05,
                timestamp: Date.now(),
            },
            0.9, // high AFI
        );
        expect(result.score).toBeLessThan(0.25);
        expect(result.recommendation).toBe('rest');
    });

    test('score is in [0, 1]', () => {
        const result = computeCRS(
            {
                sleepDuration: 12, sleepQuality: 1,
                hrv: 120, hrvNormalized: 1,
                steps: 15000, activityLevel: 1,
                timestamp: Date.now(),
            },
            0,
        );
        expect(result.score).toBeLessThanOrEqual(1);
        expect(result.score).toBeGreaterThanOrEqual(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 8: Attention Forecasting
// ═══════════════════════════════════════════════════════════════════════════════

describe('Attention Forecasting', () => {
    test('generates 168 hour blocks (7 days × 24 hours)', () => {
        const heatmap = generateFocusHeatmap([]);
        expect(heatmap).toHaveLength(168);
    });

    test('empty data → all blocks have fair label', () => {
        const heatmap = generateFocusHeatmap([]);
        const allFair = heatmap.every(b => b.label === 'fair');
        expect(allFair).toBe(true);
    });

    test('low AFI windows are returned by findOptimalWindows', () => {
        const heatmap = generateFocusHeatmap([
            {
                dayOfWeek: 1,
                hourOfDay: 9,
                avgAFI: 0.15,
                sampleCount: 5,
                qualityLabel: 'optimal',
            },
        ]);
        const optimal = findOptimalWindows(heatmap, 1);
        expect(optimal.length).toBeGreaterThan(0);
        expect(optimal[0].label).toBe('optimal');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Model 9: Dopamine Binge Detection
// ═══════════════════════════════════════════════════════════════════════════════

describe('Dopamine Binge Detection', () => {
    const makeSession = (
        pkg: string,
        durationMin: number,
        startTime?: number,
    ): AppUsageSession => ({
        appName: pkg,
        packageName: pkg,
        startTime: startTime || Date.now(),
        endTime: (startTime || Date.now()) + durationMin * 60 * 1000,
        duration: durationMin * 60 * 1000,
        switchCount: 0,
        unlockCount: 0,
        timeOfDay: 'afternoon',
        dayOfWeek: 3,
    });

    test('no distractive apps → no binge', () => {
        const sessions = [makeSession('com.notes', 30)];
        const result = detectDopamineBinge(sessions, new Set());
        expect(result.isBinge).toBe(false);
        expect(result.protocol).toHaveLength(0);
    });

    test('long session on distractive app → binge detected', () => {
        const sessions = [makeSession('com.instagram.android', 25)];
        const distractive = new Set(['com.instagram.android']);
        const result = detectDopamineBinge(sessions, distractive);
        expect(result.isBinge).toBe(true);
        expect(result.triggerApp).toBe('com.instagram.android');
        expect(result.protocol).toContain('breathing-exercise');
        expect(result.protocol).toContain('walk-suggestion');
    });

    test('switch burst → binge detected', () => {
        const now = Date.now();
        const sessions = Array.from({ length: 20 }, (_, i) =>
            makeSession(`com.app${i}`, 0.2, now + i * 10000), // 20 apps in ~3 min
        );
        const result = detectDopamineBinge(sessions, new Set());
        expect(result.isBinge).toBe(true);
        expect(result.protocol).toContain('reflection-nudge');
    });
});
