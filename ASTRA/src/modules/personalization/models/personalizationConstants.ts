// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Adaptive Personalization Engine — Constants & Configuration
// ─────────────────────────────────────────────────────────────────────────────

// ── Strictness Evolution ─────────────────────────────────────────────────────

export const STRICTNESS_CONFIG = {
    /** Min compliance rate to escalate strictness */
    escalateThreshold: 0.75,
    /** Max override rate before de-escalating */
    deescalateOverrideThreshold: 0.40,
    /** Session success rate threshold to escalate */
    escalateSessionThreshold: 0.80,
    /** Session success rate below which we de-escalate */
    deescalateSessionThreshold: 0.45,
    /** Minimum days between strictness adjustments */
    adjustmentCooldownDays: 3,
    /** Max strictness level */
    maxLevel: 5 as const,
    /** Min strictness level */
    minLevel: 1 as const,
} as const;

// ── Bayesian Adaptation ──────────────────────────────────────────────────────

export const BAYESIAN_CONFIG = {
    /** Laplace smoothing alpha (prior successes) */
    priorAlpha: 1,
    /** Laplace smoothing beta (prior failures) */
    priorBeta: 1,
    /** Recent window (days) for trend comparison */
    recentWindowDays: 7,
    /** Min attempts before trusting compliance estimate */
    minAttemptsForTrust: 5,
} as const;

// ── Intervention Fatigue ─────────────────────────────────────────────────────

export const FATIGUE_CONFIG = {
    /** Fatigue score gained per nudge */
    fatiguePerNudge: 0.10,
    /** Extra fatigue per dismissal */
    fatiguePerDismissal: 0.20,
    /** Fatigue per consecutive dismissal (compounds) */
    consecutiveDismissalMultiplier: 1.5,
    /** Daily fatigue decay rate (exponential) */
    dailyDecayRate: 0.40,
    /** Threshold above which we reduce intervention frequency */
    highFatigueThreshold: 0.70,
    /** Threshold above which we stop non-critical interventions */
    criticalFatigueThreshold: 0.90,
    /** Max nudges per day before fatigue escalates rapidly */
    maxDailyNudges: 8,
} as const;

// ── ISS (Intervention Suitability Score) ─────────────────────────────────────

export const ISS_WEIGHTS = {
    goalConflict: 0.40,
    distractionSeverity: 0.35,
    cognitiveReadiness: 0.25,
} as const;

export const ISS_THRESHOLDS = {
    /** Below this → reflective nudge only */
    reflectiveMax: 0.35,
    /** Below this → soft delay */
    softDelayMax: 0.65,
    /** Above this → hard block */
    hardBlockMin: 0.65,
} as const;

// ── Time-of-Day Modifiers ────────────────────────────────────────────────────

export const TIME_MODIFIERS: Record<string, number> = {
    morning: 0.85,     // slightly more lenient (warm-up)
    afternoon: 1.0,    // neutral
    evening: 1.15,     // slightly stricter (prime distraction time)
    night: 0.70,       // lenient (wind-down time)
} as const;

// ── Attention Evolution ──────────────────────────────────────────────────────

export const ATTENTION_CONFIG = {
    /** Default initial focus session length (ms) */
    defaultSessionLength: 25 * 60 * 1000, // 25 minutes
    /** Min session length (ms) */
    minSessionLength: 10 * 60 * 1000,     // 10 minutes
    /** Max session length (ms) */
    maxSessionLength: 90 * 60 * 1000,     // 90 minutes
    /** Growth factor when success rate > 80% */
    growthFactor: 1.08,
    /** Shrink factor when success rate < 50% */
    shrinkFactor: 0.90,
    /** Success threshold */
    successThreshold: 0.80,
    /** Failure threshold */
    failureThreshold: 0.50,
    /** Window of recent sessions to consider */
    windowSize: 10,
    /** Max session history to keep */
    maxHistory: 50,
} as const;

// ── Habit Suggestions ────────────────────────────────────────────────────────

export const HABIT_SUGGESTIONS = {
    pre_focus: [
        { id: 'hb_water', title: 'Hydrate First', description: 'Drink a glass of water before starting', priority: 0.7 },
        { id: 'hb_clear', title: 'Clear Your Desk', description: 'Remove distractions from your workspace', priority: 0.6 },
        { id: 'hb_phone', title: 'Phone Away', description: 'Put your phone in another room or drawer', priority: 0.9 },
        { id: 'hb_intent', title: 'Set Intention', description: 'Write down your single most important task', priority: 0.8 },
    ],
    during_focus: [
        { id: 'hb_breathe', title: 'Box Breathing', description: '4-4-4-4 breathing when you feel the urge to switch', priority: 0.6 },
        { id: 'hb_note', title: 'Distraction Notepad', description: 'Write down urges instead of acting on them', priority: 0.7 },
    ],
    post_focus: [
        { id: 'hb_reflect', title: 'Mini Reflection', description: 'What went well? What pulled your attention?', priority: 0.8 },
        { id: 'hb_reward', title: 'Earned Reward', description: 'Take a guilt-free break — you earned it', priority: 0.6 },
    ],
    recovery: [
        { id: 'hb_walk', title: 'Short Walk', description: '5 minutes of movement resets your brain', priority: 0.8 },
        { id: 'hb_meditate', title: 'Guided Breathing', description: '2-minute breathing to recenter', priority: 0.7 },
        { id: 'hb_stretch', title: 'Desk Stretch', description: 'Stretch your body to release tension', priority: 0.5 },
    ],
} as const;

// ── Recovery Protocols ───────────────────────────────────────────────────────

export const RECOVERY_PROTOCOLS = {
    breathing: {
        style: 'breathing' as const,
        message: 'Take a moment. Inhale 4s, hold 4s, exhale 4s.',
        durationMinutes: 2,
        priority: 0.9,
    },
    reflection: {
        style: 'reflection' as const,
        message: 'What triggered this? What would your future self prefer?',
        durationMinutes: 1,
        priority: 0.7,
    },
    walk: {
        style: 'walk' as const,
        message: 'A quick walk can reset your dopamine baseline.',
        durationMinutes: 5,
        priority: 0.6,
    },
    meditation: {
        style: 'meditation' as const,
        message: 'Close your eyes. Focus on your breath for 60 seconds.',
        durationMinutes: 3,
        priority: 0.8,
    },
    cold_exposure: {
        style: 'cold_exposure' as const,
        message: 'Splash cold water on your face for an instant reset.',
        durationMinutes: 1,
        priority: 0.5,
    },
} as const;

// ── Baseline Mapping Thresholds ──────────────────────────────────────────────

export const BASELINE_MAPPING = {
    strictness: {
        /** SCS thresholds for strictness levels 1-5 */
        thresholds: [0.20, 0.40, 0.55, 0.70, 0.85],
    },
    focusLength: {
        /** Baseline focus estimate → session length multiplier */
        lowFocus: 15 * 60 * 1000,     // 15 min
        moderateFocus: 25 * 60 * 1000, // 25 min
        highFocus: 45 * 60 * 1000,     // 45 min
        thresholdLow: 0.35,
        thresholdHigh: 0.65,
    },
} as const;
