/**
 * ASTRA Meditation Module — MSS Computation & Session Recommendation
 *
 * MSS = Meditation Suitability Score (0–100).
 * Routes user to the optimal session type and duration.
 *
 * Math (from spec):
 *   RelaxationReadiness = 0.5*norm_stress + 0.3*norm_fatigue + 0.2*norm_mood
 *   ActivationReadiness = 0.4*norm_mood + 0.35*norm_time + 0.25*norm_experience
 *   if intent in [calm, sleep, recovery]:
 *     MSS = 0.6*RelaxationReadiness + 0.3*norm_hrv + 0.1*norm_time
 *   else (focus, energy):
 *     MSS = 0.5*ActivationReadiness + 0.3*norm_hrv + 0.2*norm_time
 *
 * Ref: PMC6088366, PMC9682449, PMC8734923
 */

import type {
    DailyMeditationInput,
    ComputedMeditationScores,
    MeditationType,
    MeditationFlag,
    UserProfile,
} from '@/types';

import {
    normalizeStress,
    normalizeFatigue,
    normalizeMood,
    normalizeTime,
    normalizeExperience,
    normalizeHRV,
    clampMed,
} from './meditation-normalizers';

import {
    RELAX_STRESS_WEIGHT,
    RELAX_FATIGUE_WEIGHT,
    RELAX_MOOD_WEIGHT,
    ACTIVE_MOOD_WEIGHT,
    ACTIVE_TIME_WEIGHT,
    ACTIVE_EXP_WEIGHT,
    MSS_CALM_RELAX_WEIGHT,
    MSS_CALM_HRV_WEIGHT,
    MSS_CALM_TIME_WEIGHT,
    MSS_FOCUS_ACTIVE_WEIGHT,
    MSS_FOCUS_HRV_WEIGHT,
    MSS_FOCUS_TIME_WEIGHT,
    BASE_BOOST_BY_TYPE,
    DEFAULT_NOVICE_DURATION,
    DEFAULT_INTERMEDIATE_DURATION,
    DEFAULT_ADVANCED_DURATION,
    PREP_SECONDS_DEFAULT,
    PREP_SECONDS_NOVICE,
    MSS_HIGH_THRESHOLD,
    MSS_LOW_THRESHOLD,
} from '@/constants/meditation-constants';

const CALM_INTENTS = new Set(['calm', 'sleep', 'recovery']);

/**
 * Compute MSS and all readiness subscores.
 */
export function computeMSS(input: DailyMeditationInput, _profile?: UserProfile): number {
    const nStress = normalizeStress(input.stress_level);
    const nFatigue = normalizeFatigue(input.fatigue_level);
    const nMood = normalizeMood(input.mood);
    const nTime = normalizeTime(input.available_minutes);
    const nExp = normalizeExperience(input.experience_level);
    const nHrv = normalizeHRV(input.hrv_rmssd_ms);

    const relaxation =
        RELAX_STRESS_WEIGHT * nStress +
        RELAX_FATIGUE_WEIGHT * nFatigue +
        RELAX_MOOD_WEIGHT * nMood;

    const activation =
        ACTIVE_MOOD_WEIGHT * nMood +
        ACTIVE_TIME_WEIGHT * nTime +
        ACTIVE_EXP_WEIGHT * nExp;

    let mss: number;
    if (CALM_INTENTS.has(input.intent)) {
        mss = MSS_CALM_RELAX_WEIGHT * relaxation + MSS_CALM_HRV_WEIGHT * nHrv + MSS_CALM_TIME_WEIGHT * nTime;
    } else {
        mss = MSS_FOCUS_ACTIVE_WEIGHT * activation + MSS_FOCUS_HRV_WEIGHT * nHrv + MSS_FOCUS_TIME_WEIGHT * nTime;
    }

    return Math.round(clampMed(mss, 0, 100));
}

/**
 * Full score computation returning all sub-scores + recommendations.
 */
export function computeFullScores(input: DailyMeditationInput, profile?: UserProfile): ComputedMeditationScores {
    const nStress = normalizeStress(input.stress_level);
    const nFatigue = normalizeFatigue(input.fatigue_level);
    const nMood = normalizeMood(input.mood);
    const nTime = normalizeTime(input.available_minutes);
    const nExp = normalizeExperience(input.experience_level);
    const nHrv = normalizeHRV(input.hrv_rmssd_ms);

    const RelaxationReadiness = Math.round(
        RELAX_STRESS_WEIGHT * nStress + RELAX_FATIGUE_WEIGHT * nFatigue + RELAX_MOOD_WEIGHT * nMood
    );
    const ActivationReadiness = Math.round(
        ACTIVE_MOOD_WEIGHT * nMood + ACTIVE_TIME_WEIGHT * nTime + ACTIVE_EXP_WEIGHT * nExp
    );

    let MSS: number;
    if (CALM_INTENTS.has(input.intent)) {
        MSS = MSS_CALM_RELAX_WEIGHT * RelaxationReadiness + MSS_CALM_HRV_WEIGHT * nHrv + MSS_CALM_TIME_WEIGHT * nTime;
    } else {
        MSS = MSS_FOCUS_ACTIVE_WEIGHT * ActivationReadiness + MSS_FOCUS_HRV_WEIGHT * nHrv + MSS_FOCUS_TIME_WEIGHT * nTime;
    }
    MSS = Math.round(clampMed(MSS, 0, 100));

    const rec = recommendSession(MSS, input, profile);

    return {
        RelaxationReadiness,
        ActivationReadiness,
        MSS,
        ...rec,
    };
}

/**
 * Recommend session type, duration, and attention boost based on MSS + input.
 */
export function recommendSession(
    mss: number,
    input: DailyMeditationInput,
    _profile?: UserProfile
): {
    recommended_type: MeditationType;
    recommended_duration: number;
    prep_seconds: number;
    core_seconds: number;
    attention_boost_est: number;
    flags: MeditationFlag[];
} {
    const flags: MeditationFlag[] = [];

    // 1. Determine type based on intent + MSS
    let type: MeditationType;
    if (input.intent === 'sleep' || input.intent === 'recovery') {
        type = mss < MSS_LOW_THRESHOLD ? 'yoga-nidra' : 'body-scan';
    } else if (input.intent === 'calm') {
        type = mss >= MSS_HIGH_THRESHOLD ? 'breathing' : 'body-scan';
    } else if (input.intent === 'focus') {
        type = mss >= MSS_HIGH_THRESHOLD ? 'mindfulness' : 'breathing';
    } else {
        // energy
        type = 'breathing';
    }

    // 2. Duration based on experience + available time
    let baseDuration: number;
    switch (input.experience_level) {
        case 'novice':
            baseDuration = DEFAULT_NOVICE_DURATION;
            break;
        case 'intermediate':
            baseDuration = DEFAULT_INTERMEDIATE_DURATION;
            break;
        case 'advanced':
            baseDuration = DEFAULT_ADVANCED_DURATION;
            break;
        default:
            baseDuration = DEFAULT_INTERMEDIATE_DURATION;
    }
    const duration = Math.min(baseDuration, input.available_minutes);

    // 3. Prep & core seconds
    const prep = input.experience_level === 'novice' ? PREP_SECONDS_NOVICE : PREP_SECONDS_DEFAULT;
    const core = Math.max(0, duration * 60 - prep);

    // 4. Attention boost estimate
    const boost = Math.round(BASE_BOOST_BY_TYPE[type] * (mss / 100) * 10) / 10;

    // 5. Flags
    if (mss >= MSS_HIGH_THRESHOLD) {
        flags.push({ id: 'high-mss', label: 'Great state for meditation', type: 'boost' });
    }
    if (mss < MSS_LOW_THRESHOLD) {
        flags.push({ id: 'low-mss', label: 'Start gentle — recovery mode', type: 'warning' });
    }

    return {
        recommended_type: type,
        recommended_duration: duration,
        prep_seconds: prep,
        core_seconds: core,
        attention_boost_est: boost,
        flags,
    };
}
