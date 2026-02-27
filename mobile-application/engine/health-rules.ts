/**
 * ASTRA Health Module — Rule Engine (Priority-Ordered)
 * Returns recommendations, flags, and attention overrides.
 */

import type {
    HealthRule,
    DailyHealthInput,
    ComputedHealthScores,
    Recommendation,
    HealthFlag,
    AttentionCapacity,
    RuleContext,
    HealthDayRecord,
} from '@/types';
import { normalizeHRV, getHydrationTarget } from './health-normalizers';
import {
    RULE_LOW_SLEEP_HOURS,
    RULE_HIGH_STRESS_LEVEL,
    RULE_LOW_HRV_SCORE,
    RULE_LOW_HYDRATION_RATIO,
    RULE_HIGH_SEDENTARY_HOURS,
    RULE_EXERCISE_BOOST_MINUTES,
    RULE_EXERCISE_BOOST_AMOUNT,
} from '@/constants/health-constants';
import { checkChronicLow, detectTrend } from './health-trends';

// ─── Health Rules (priority-ordered, lower number = higher priority) ───

export const healthRules: HealthRule[] = [
    // Rule 1: Low sleep + high stress → recovery override
    {
        id: 'rule-low-sleep-high-stress',
        name: 'Low Sleep + High Stress',
        priority: 1,
        evaluate: (ctx, computed) => {
            if (
                ctx.health.sleep_hours < RULE_LOW_SLEEP_HOURS &&
                ctx.health.stress_level >= RULE_HIGH_STRESS_LEVEL
            ) {
                return {
                    recommendation: {
                        id: 'rec-sleep-stress',
                        type: 'recovery',
                        title: 'Take a Recovery Break',
                        description: `Only ${ctx.health.sleep_hours}h sleep with high stress. Try a short meditation or Yoga Nidra session.`,
                        priority: 'high',
                        triggeredBy: 'rule-low-sleep-high-stress',
                    },
                    flag: { id: 'flag-low-sleep', label: 'Low sleep', type: 'urgent' },
                    attentionOverride: 'recovery',
                };
            }
            return null;
        },
    },

    // Rule 2: Low HRV → light override
    {
        id: 'rule-low-hrv',
        name: 'Low HRV',
        priority: 2,
        evaluate: (ctx, computed) => {
            if (
                ctx.health.hrv_rmssd_ms != null &&
                normalizeHRV(ctx.health.hrv_rmssd_ms) < RULE_LOW_HRV_SCORE
            ) {
                return {
                    recommendation: {
                        id: 'rec-hrv-rest',
                        type: 'recovery',
                        title: 'Rest & Breathe',
                        description:
                            'Your HRV is low. Prioritize rest and try a breathing exercise.',
                        priority: 'high',
                        triggeredBy: 'rule-low-hrv',
                    },
                    flag: { id: 'flag-hrv-low', label: 'HRV low', type: 'warning' },
                    attentionOverride: 'light',
                };
            }
            return null;
        },
    },

    // Rule 3: Low hydration → urgent flag
    {
        id: 'rule-low-hydration',
        name: 'Low Hydration',
        priority: 3,
        evaluate: (ctx, computed) => {
            const target = getHydrationTarget(ctx.health.weight_kg);
            if (ctx.health.water_ml < RULE_LOW_HYDRATION_RATIO * target) {
                return {
                    recommendation: {
                        id: 'rec-hydrate',
                        type: 'hydration',
                        title: 'Hydrate Now',
                        description: `Only ${ctx.health.water_ml}ml today — target is ${Math.round(target)}ml. Dehydration impairs focus.`,
                        priority: 'high',
                        triggeredBy: 'rule-low-hydration',
                    },
                    flag: { id: 'flag-hydrate', label: 'Hydrate', type: 'urgent' },
                };
            }
            return null;
        },
    },

    // Rule 4: High sedentary → brisk walk nudge
    {
        id: 'rule-high-sedentary',
        name: 'High Sedentary Time',
        priority: 4,
        evaluate: (ctx, computed) => {
            if (ctx.health.sedentary_hours >= RULE_HIGH_SEDENTARY_HOURS) {
                return {
                    recommendation: {
                        id: 'rec-move',
                        type: 'exercise',
                        title: 'Take a Walk',
                        description: `${ctx.health.sedentary_hours}h sitting today. A 10-min brisk walk can boost circulation and focus.`,
                        priority: 'medium',
                        triggeredBy: 'rule-high-sedentary',
                    },
                    flag: { id: 'flag-sedentary', label: 'Sedentary', type: 'warning' },
                };
            }
            return null;
        },
    },

    // Rule 5: Exercise boost → CognitiveReadiness +5
    {
        id: 'rule-exercise-boost',
        name: 'Exercise Boost',
        priority: 5,
        evaluate: (ctx, computed) => {
            if (ctx.health.exercise_minutes >= RULE_EXERCISE_BOOST_MINUTES) {
                return {
                    readinessBoost: RULE_EXERCISE_BOOST_AMOUNT,
                    recommendation: {
                        id: 'rec-exercise-done',
                        type: 'exercise',
                        title: 'Great Workout!',
                        description: `${ctx.health.exercise_minutes} minutes of exercise today — cognitive readiness boosted.`,
                        priority: 'low',
                        triggeredBy: 'rule-exercise-boost',
                    },
                };
            }
            return null;
        },
    },

    // Rule: High stress flag (standalone)
    {
        id: 'rule-high-stress',
        name: 'High Stress',
        priority: 6,
        evaluate: (ctx, computed) => {
            if (ctx.health.stress_level >= RULE_HIGH_STRESS_LEVEL) {
                return {
                    flag: { id: 'flag-stress', label: 'High stress', type: 'warning' },
                    recommendation: {
                        id: 'rec-stress',
                        type: 'stress',
                        title: 'Manage Stress',
                        description:
                            'Your stress level is elevated. Try a breathing exercise or short meditation.',
                        priority: 'medium',
                        triggeredBy: 'rule-high-stress',
                    },
                };
            }
            return null;
        },
    },
];

export interface RuleEngineResult {
    recommendations: Recommendation[];
    flags: HealthFlag[];
    attentionOverride?: AttentionCapacity['level'];
    readinessBoost: number;
}

/**
 * Run all health rules against the context and computed scores.
 * Rules are evaluated in priority order.
 */
export function runHealthRules(
    ctx: RuleContext,
    computed: ComputedHealthScores
): RuleEngineResult {
    const recommendations: Recommendation[] = [];
    const flags: HealthFlag[] = [];
    let attentionOverride: AttentionCapacity['level'] | undefined;
    let readinessBoost = 0;

    // Sort by priority (ascending = highest priority first)
    const sorted = [...healthRules].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
        const result = rule.evaluate(ctx, computed);
        if (!result) continue;

        if (result.recommendation) recommendations.push(result.recommendation);
        if (result.flag) flags.push(result.flag);
        // Only first override wins (highest priority)
        if (result.attentionOverride && !attentionOverride) {
            attentionOverride = result.attentionOverride;
        }
        if (result.readinessBoost) readinessBoost += result.readinessBoost;
    }

    // Add chronic-low & trend flags from records
    if (ctx.healthRecords && ctx.healthRecords.length >= 3) {
        const chronic = checkChronicLow(ctx.healthRecords);
        if (chronic.isChronicLow) {
            flags.push({
                id: 'flag-chronic-low',
                label: 'Reduce load',
                type: 'urgent',
            });
            recommendations.push({
                id: 'rec-chronic-low',
                type: 'recovery',
                title: 'Reduce Cognitive Load',
                description: chronic.message || 'Take 48–72h of lighter activity.',
                priority: 'high',
                triggeredBy: 'chronic-low-detection',
            });
        }

        const trend = detectTrend(ctx.healthRecords, 'CognitiveReadiness');
        if (trend.direction === 'down') {
            flags.push({
                id: 'flag-downward-trend',
                label: 'Downward trend',
                type: 'warning',
            });
        }
    }

    return { recommendations, flags, attentionOverride, readinessBoost };
}
