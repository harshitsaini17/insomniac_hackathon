/**
 * ASTRA Health Module — Tunable Constants
 * All thresholds and weights are configurable here.
 */

// ─── Sleep Normalization ───
export const SLEEP_MU = 7.0;            // Optimal sleep hours (Gaussian center)
export const SLEEP_SIGMA = 1.0;         // Gaussian spread

// ─── HRV Normalization ───
export const HRV_BASELINE_MS = 50;      // RMSSD baseline: 50ms → score 100

// ─── Hydration ───
export const HYDRATION_ML_PER_KG = 35;  // ml per kg body weight target
export const DEFAULT_HYDRATION_TARGET_ML = 2000;

// ─── Sedentary ───
export const SEDENTARY_MAX_HOURS = 8;   // 8h → score 0

// ─── Exercise ───
export const EXERCISE_IDEAL_MINUTES = 30; // mins for score 100
export const EXERCISE_ZERO_FLOOR = 20;    // score when 0 exercise

// ─── Composite Score Weights ───
export const RECOVERY_SLEEP_WEIGHT = 0.55;
export const RECOVERY_HRV_WEIGHT = 0.25;
export const RECOVERY_STRESS_WEIGHT = 0.20;

export const SLEEP_SCORE_HOURS_WEIGHT = 0.8;
export const SLEEP_SCORE_QUALITY_WEIGHT = 0.2;

export const LIFESTYLE_EXERCISE_WEIGHT = 0.45;
export const LIFESTYLE_HYDRATION_WEIGHT = 0.35;
export const LIFESTYLE_SEDENTARY_WEIGHT = 0.20;

export const COGNITIVE_RECOVERY_WEIGHT = 0.6;
export const COGNITIVE_LIFESTYLE_WEIGHT = 0.4;

export const HRV_DEFAULT_SCORE = 50;    // When HRV is not provided

// ─── Attention Capacity Thresholds ───
export const ATTENTION_HIGH_THRESHOLD = 80;
export const ATTENTION_MODERATE_THRESHOLD = 60;
export const ATTENTION_LIGHT_THRESHOLD = 40;

export const ATTENTION_HIGH_MINUTES = 25;
export const ATTENTION_MODERATE_MINUTES = 15;
export const ATTENTION_LIGHT_MINUTES = 8;
export const ATTENTION_RECOVERY_MINUTES = 0;

// ─── Rule Engine Thresholds ───
export const RULE_LOW_SLEEP_HOURS = 6;
export const RULE_HIGH_STRESS_LEVEL = 4;
export const RULE_LOW_HRV_SCORE = 45;
export const RULE_LOW_HYDRATION_RATIO = 0.6;
export const RULE_HIGH_SEDENTARY_HOURS = 6;
export const RULE_EXERCISE_BOOST_MINUTES = 20;
export const RULE_EXERCISE_BOOST_AMOUNT = 5;

// ─── Trend Detection ───
export const TREND_DROP_THRESHOLD = 0.10;  // 10% decrease = downward trend
export const CHRONIC_LOW_THRESHOLD = 50;   // CognitiveReadiness below this
export const CHRONIC_LOW_DAYS = 3;         // consecutive days to trigger alert

// ─── Rolling Average Windows ───
export const ROLLING_WINDOW_SHORT = 7;
export const ROLLING_WINDOW_MEDIUM = 14;
export const ROLLING_WINDOW_LONG = 30;
