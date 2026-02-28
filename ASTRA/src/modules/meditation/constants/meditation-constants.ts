/**
 * ASTRA Meditation Module — Tunable Constants
 *
 * References:
 *   PMC6088366 — Meditation & stress reduction meta-analysis
 *   PMC9899909 — HRV biofeedback in meditation
 *   PMC9682449 — Mindfulness-based cognitive therapy
 *   PMC8734923 — Yoga Nidra efficacy on sleep & anxiety
 *   Creswell review — Mindfulness interventions review
 */

import type { MeditationType } from '@/types';

// ─── MSS Formula Weights ───
// RelaxationReadiness = 0.5*norm_stress + 0.3*norm_fatigue + 0.2*norm_mood
export const RELAX_STRESS_WEIGHT = 0.5;
export const RELAX_FATIGUE_WEIGHT = 0.3;
export const RELAX_MOOD_WEIGHT = 0.2;

// ActivationReadiness = 0.4*norm_mood + 0.35*norm_time + 0.25*norm_experience
export const ACTIVE_MOOD_WEIGHT = 0.4;
export const ACTIVE_TIME_WEIGHT = 0.35;
export const ACTIVE_EXP_WEIGHT = 0.25;

// MSS for calm/sleep/recovery intents
export const MSS_CALM_RELAX_WEIGHT = 0.6;
export const MSS_CALM_HRV_WEIGHT = 0.3;
export const MSS_CALM_TIME_WEIGHT = 0.1;

// MSS for focus/energy intents
export const MSS_FOCUS_ACTIVE_WEIGHT = 0.5;
export const MSS_FOCUS_HRV_WEIGHT = 0.3;
export const MSS_FOCUS_TIME_WEIGHT = 0.2;

// ─── Attention Boost ───
// PMC6088366: breathing consistently reduces cortisol
// PMC9682449: mindfulness strongest cognitive gains
export const BASE_BOOST_BY_TYPE: Record<MeditationType, number> = {
    breathing: 6,
    mindfulness: 8,
    'body-scan': 5,
    'yoga-nidra': -2, // recovery-oriented, intentionally reduces arousal
};

// ─── Normalization ───
export const STRESS_MAX = 5;
export const FATIGUE_MAX = 5;
export const MOOD_MAX = 5;
export const TIME_MAX_MINUTES = 30;     // ≥30 min → score 100
export const HRV_BASELINE_MEDITATION = 50; // RMSSD baseline ms
export const HRV_DEFAULT_MEDITATION = 50;  // When HRV is absent

// Experience level scores
export const EXPERIENCE_SCORES: Record<string, number> = {
    novice: 30,
    intermediate: 65,
    advanced: 95,
};

// ─── Session Duration Defaults ───
export const MICRO_SESSION_MAX_MINUTES = 5;
export const DEFAULT_NOVICE_DURATION = 8;
export const DEFAULT_INTERMEDIATE_DURATION = 12;
export const DEFAULT_ADVANCED_DURATION = 20;
export const PREP_SECONDS_DEFAULT = 30;
export const PREP_SECONDS_NOVICE = 60;

// ─── Rule Thresholds ───
export const RULE_MICRO_TIME_THRESHOLD = 6;       // available_minutes
export const RULE_FATIGUE_OVERRIDE_LEVEL = 4;      // fatigue >= 4
export const RULE_LOW_HRV_THRESHOLD = 40;          // ms
export const RULE_HIGH_STRESS_THRESHOLD = 4;       // stress_level
export const RULE_NOVICE_GUIDED_TIME = 10;         // minutes for novice guided
export const RULE_MAX_LARGE_SESSIONS_PER_DAY = 2;  // density limit
export const RULE_LARGE_SESSION_THRESHOLD = 15;    // minutes → "large"
export const EFFICACY_HRV_RATIO = 1.03;            // post > pre * 1.03
export const EFFICACY_RATING_MIN = 4;              // rating >= 4

// ─── MSS Thresholds for Type Selection ───
export const MSS_HIGH_THRESHOLD = 70;
export const MSS_LOW_THRESHOLD = 40;
