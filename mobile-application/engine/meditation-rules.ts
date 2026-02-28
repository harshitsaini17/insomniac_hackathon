/**
 * ASTRA Meditation Module — Priority-Ordered Rule Engine
 *
 * 6 rules evaluated in priority order. Each can override type/duration,
 * add flags, or adjust MSS.
 *
 * Ref: PMC6088366 (stress-meditation interaction)
 *      PMC8734923 (Yoga Nidra for recovery/fatigue)
 *      PMC9899909 (HRV-guided session selection)
 */

import type {
    DailyMeditationInput,
    ComputedMeditationScores,
    MeditationSessionRecord,
    MeditationRule,
    MeditationFlag,
    MeditationType,
} from '@/types';

import {
    RULE_MICRO_TIME_THRESHOLD,
    RULE_FATIGUE_OVERRIDE_LEVEL,
    RULE_LOW_HRV_THRESHOLD,
    RULE_HIGH_STRESS_THRESHOLD,
    RULE_NOVICE_GUIDED_TIME,
    RULE_MAX_LARGE_SESSIONS_PER_DAY,
    RULE_LARGE_SESSION_THRESHOLD,
    EFFICACY_HRV_RATIO,
    EFFICACY_RATING_MIN,
    MICRO_SESSION_MAX_MINUTES,
} from '@/constants/meditation-constants';

// ─── Rule Definitions (lower priority number = evaluated first) ───

const rules: MeditationRule[] = [
    {
        id: 'med-micro-session',
        name: 'Micro-session for limited time',
        priority: 1,
        evaluate: (input, _computed, _today) => {
            if (input.available_minutes < RULE_MICRO_TIME_THRESHOLD) {
                return {
                    typeOverride: 'breathing',
                    durationOverride: Math.min(input.available_minutes, MICRO_SESSION_MAX_MINUTES),
                    flag: { id: 'micro', label: `${Math.min(input.available_minutes, MICRO_SESSION_MAX_MINUTES)}-min micro session`, type: 'info' },
                };
            }
            return null;
        },
    },
    {
        id: 'med-fatigue-recovery',
        name: 'Recovery-first override for high fatigue + focus intent',
        priority: 2,
        evaluate: (input, _computed, _today) => {
            // PMC8734923: Yoga Nidra demonstrated significant recovery benefits
            if (input.fatigue_level >= RULE_FATIGUE_OVERRIDE_LEVEL && input.intent === 'focus') {
                return {
                    typeOverride: 'yoga-nidra',
                    flag: {
                        id: 'fatigue-override',
                        label: 'Recovery first — rest before focus',
                        type: 'warning',
                    },
                    mssAdjust: -10,
                };
            }
            return null;
        },
    },
    {
        id: 'med-low-hrv-stress',
        name: 'Breathing/body-scan for low HRV + high stress',
        priority: 3,
        evaluate: (input, _computed, _today) => {
            // PMC9899909: HRV biofeedback via breathing most effective under stress
            const hasLowHRV = input.hrv_rmssd_ms != null && input.hrv_rmssd_ms < RULE_LOW_HRV_THRESHOLD;
            const highStress = input.stress_level >= RULE_HIGH_STRESS_THRESHOLD;
            if (hasLowHRV && highStress) {
                return {
                    typeOverride: 'breathing',
                    flag: {
                        id: 'hrv-stress',
                        label: 'Low HRV + high stress → breathing',
                        type: 'warning',
                    },
                };
            }
            return null;
        },
    },
    {
        id: 'med-novice-guided',
        name: 'Guided breathing for novices with time',
        priority: 4,
        evaluate: (input, _computed, _today) => {
            if (input.experience_level === 'novice' && input.available_minutes >= RULE_NOVICE_GUIDED_TIME) {
                return {
                    typeOverride: 'breathing',
                    flag: {
                        id: 'novice-guided',
                        label: 'Guided breathing recommended',
                        type: 'info',
                    },
                };
            }
            return null;
        },
    },
    {
        id: 'med-density-limit',
        name: 'Limit session density',
        priority: 5,
        evaluate: (_input, _computed, todaySessions) => {
            const largeSessions = todaySessions.filter(
                (s) => s.duration_seconds >= RULE_LARGE_SESSION_THRESHOLD * 60
            );
            if (largeSessions.length >= RULE_MAX_LARGE_SESSIONS_PER_DAY) {
                return {
                    durationOverride: 5,
                    typeOverride: 'breathing',
                    flag: {
                        id: 'density-limit',
                        label: 'Max large sessions reached — micro only',
                        type: 'warning',
                    },
                };
            }
            return null;
        },
    },
    {
        id: 'med-efficacy-check',
        name: 'Post-session efficacy check',
        priority: 6,
        evaluate: (_input, _computed, todaySessions) => {
            // Check the last completed session for efficacy markers
            const completed = todaySessions.filter((s) => s.completed && s.rating >= EFFICACY_RATING_MIN);
            const lastEffective = completed.find(
                (s) =>
                    s.pre_hrv != null &&
                    s.post_hrv != null &&
                    s.post_hrv > s.pre_hrv * EFFICACY_HRV_RATIO
            );
            if (lastEffective) {
                return {
                    flag: {
                        id: 'efficacy-boost',
                        label: `${lastEffective.type} is effective for you`,
                        type: 'boost',
                    },
                    mssAdjust: 5,
                };
            }
            return null;
        },
    },
];

// ─── Runner ───

export interface MeditationRuleResult {
    typeOverride?: MeditationType;
    durationOverride?: number;
    flags: MeditationFlag[];
    mssAdjust: number;
}

/**
 * Run all meditation rules in priority order.
 * Returns aggregated overrides and flags.
 */
export function runMeditationRules(
    input: DailyMeditationInput,
    computed: ComputedMeditationScores,
    todaySessions: MeditationSessionRecord[]
): MeditationRuleResult {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    let typeOverride: MeditationType | undefined;
    let durationOverride: number | undefined;
    const flags: MeditationFlag[] = [];
    let mssAdjust = 0;

    for (const rule of sorted) {
        const result = rule.evaluate(input, computed, todaySessions);
        if (result) {
            if (result.typeOverride && !typeOverride) {
                typeOverride = result.typeOverride;
            }
            if (result.durationOverride && !durationOverride) {
                durationOverride = result.durationOverride;
            }
            if (result.flag) {
                flags.push(result.flag);
            }
            if (result.mssAdjust) {
                mssAdjust += result.mssAdjust;
            }
        }
    }

    return { typeOverride, durationOverride, flags, mssAdjust };
}
