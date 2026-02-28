// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Focus Trainer — Constants & Configuration
// All tunable weights, thresholds, and defaults
// ─────────────────────────────────────────────────────────────────────────────

// ── AFI Weights ──────────────────────────────────────────────────────────────
/** Attention Fragmentation Index coefficients: αS + βU + γ(1/D) + δH */
export const AFI_WEIGHTS = {
    alpha: 0.30,  // app switches per hour
    beta: 0.20,  // unlocks per hour
    gamma: 0.25,  // inverse avg session duration
    delta: 0.25,  // Shannon entropy
} as const;

export const AFI_THRESHOLDS = {
    deep: 0.30,       // AFI < 0.30 → Deep Focus
    moderate: 0.60,   // 0.30 ≤ AFI < 0.60 → Moderate
    // ≥ 0.60 → Fragmented
} as const;

// ── Distractiveness Score Weights ────────────────────────────────────────────
export const DS_WEIGHTS = {
    w1: 0.40,  // avg daily time
    w2: 0.35,  // open frequency
    w3: 0.25,  // conflict during focus
} as const;

export const DS_THRESHOLD = 0.55; // above → classified distractive

// ── Cognitive Readiness Score Weights ────────────────────────────────────────
export const CRS_WEIGHTS = {
    a: 0.30,  // sleep quality
    b: 0.25,  // HRV normalized
    c: 0.20,  // activity level
    d: 0.25,  // recent AFI (subtracted)
} as const;

export const CRS_THRESHOLDS = {
    focus: 0.65,       // CRS ≥ 0.65 → suggest focus session
    meditation: 0.40,  // 0.40 ≤ CRS < 0.65 → suggest meditation
    exercise: 0.25,    // 0.25 ≤ CRS < 0.40 → suggest exercise
    // < 0.25 → suggest rest
} as const;

// ── Personality / Strictness ─────────────────────────────────────────────────
export const STRICTNESS_THRESHOLDS = {
    reflective: 0.30,  // II < 0.30 → reflective only
    softBlock: 0.60,   // 0.30 ≤ II < 0.60 → soft block
    // ≥ 0.60 → hard block allowed
} as const;

// ── Pomodoro Defaults ────────────────────────────────────────────────────────
export const POMODORO_DEFAULTS = {
    initialDuration: 25 * 60 * 1000,   // 25 minutes in ms
    minDuration: 10 * 60 * 1000,       // 10 minutes
    maxDuration: 60 * 60 * 1000,       // 60 minutes
    breakDuration: 5 * 60 * 1000,      // 5 minutes
    longBreakDuration: 15 * 60 * 1000, // 15 minutes
    longBreakInterval: 4,              // every 4 sessions
    growthFactor: 1.08,                // 8% increase on success
    shrinkFactor: 0.90,                // 10% decrease on failure
    successThreshold: 0.80,            // 80% → increase
    failureThreshold: 0.50,            // < 50% → decrease
    windowSize: 5,                     // last N sessions
} as const;

// ── Compliance Probability ───────────────────────────────────────────────────
export const COMPLIANCE_THRESHOLD = 0.40; // below → escalate

// ── Nudge Rate Limits ────────────────────────────────────────────────────────
export const NUDGE_LIMITS = {
    maxPerDay: 5,
    minIntervalMs: 30 * 60 * 1000,  // 30 min between nudges
    cooldownAfterDismiss: 60 * 60 * 1000, // 1 hour after dismiss
} as const;

// ── Dopamine Detection ───────────────────────────────────────────────────────
export const DOPAMINE_THRESHOLDS = {
    bingeSessionMinutes: 20,          // single app > 20 min
    switchBurstCount: 15,             // switches in 5 min
    switchBurstWindowMs: 5 * 60 * 1000,
} as const;

// ── Goal Conflict ────────────────────────────────────────────────────────────
export const GOAL_CONFLICT_ESCALATION_THRESHOLD = 0.70;

// ── Cognitive Training ───────────────────────────────────────────────────────
export const NBACK_DEFAULTS = {
    startingLevel: 2,
    trialsPerSession: 20,
    trialDurationMs: 3000,
    interTrialMs: 500,
    increaseThreshold: 0.80,  // accuracy > 80% → level up
    decreaseThreshold: 0.60,  // accuracy < 60% → level down
    gridSize: 3,              // 3×3 grid
} as const;

export const ATTENTION_SWITCH_DEFAULTS = {
    trialsPerSession: 30,
    trialDurationMs: 2000,
    colors: ['#FF4444', '#44AAFF', '#44FF44', '#FFD700'] as string[],
    shapes: ['circle', 'square', 'triangle', 'diamond'] as string[],
} as const;

// ── Normalization Ranges (for min-max scaling) ───────────────────────────────
export const NORM_RANGES = {
    switchesPerHour: { min: 0, max: 60 },
    unlocksPerHour: { min: 0, max: 15 },
    avgSessionDuration: { min: 5000, max: 3600000 }, // 5s to 1hr in ms
    dailyAppTime: { min: 0, max: 14400000 },         // 0 to 4hr in ms
    openFrequency: { min: 0, max: 100 },
    sleepHours: { min: 0, max: 12 },
    hrv: { min: 20, max: 120 },                      // ms
    steps: { min: 0, max: 15000 },
} as const;

// ── Forecasting ──────────────────────────────────────────────────────────────
export const FORECAST_WINDOW_DAYS = 7;

// ── Heatmap Quality Labels ───────────────────────────────────────────────────
export const HEATMAP_THRESHOLDS = {
    optimal: 0.25,  // AFI < 0.25
    good: 0.40,
    fair: 0.60,
    // ≥ 0.60 → poor
} as const;
