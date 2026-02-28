// ─── User Profile ───
export interface UserProfile {
    id: string;
    fitnessLevel: 'low' | 'moderate' | 'high';
    goal: 'focus' | 'calm' | 'recovery' | 'balanced';
    personality: 'analytical' | 'creative' | 'active' | 'reflective';
    createdAt: number;
}

// ─── Focus Module ───
export type FocusTaskType = 'attention' | 'n-back' | 'switching';

export interface FocusSession {
    id: string;
    type: FocusTaskType;
    startedAt: number;
    duration: number;
    accuracy: number;
    reactionTimeMs: number;
    completed: boolean;
    difficulty: number;
}

export interface FocusScore {
    date: string;
    score: number;
}

// ─── Meditation Module ───
export type MeditationType = 'mindfulness' | 'body-scan' | 'breathing' | 'yoga-nidra';
export type SessionPhase = 'preparation' | 'core' | 'reflection';
export type MeditationIntent = 'focus' | 'calm' | 'sleep' | 'recovery' | 'energy';
export type ExperienceLevel = 'novice' | 'intermediate' | 'advanced';

export interface MeditationSession {
    id: string;
    type: MeditationType;
    duration: number;
    completedAt: number;
    rating: 1 | 2 | 3 | 4 | 5;
    intent?: MeditationIntent;
    pre_hrv?: number;
    post_hrv?: number;
}

/** Manual input for meditation suitability computation. */
export interface DailyMeditationInput {
    date: string;
    stress_level: number;        // 1..5
    fatigue_level: number;       // 1..5
    mood: number;                // 1..5
    available_minutes: number;   // how many minutes user has
    experience_level: ExperienceLevel;
    intent: MeditationIntent;
    hrv_rmssd_ms?: number;       // optional HRV
    pre_session_hrv?: number;    // optional pre-session HRV
}

/** All computed scores from a meditation input. */
export interface ComputedMeditationScores {
    RelaxationReadiness: number;
    ActivationReadiness: number;
    MSS: number;                  // Meditation Suitability Score 0–100
    recommended_type: MeditationType;
    recommended_duration: number; // minutes
    prep_seconds: number;
    core_seconds: number;
    attention_boost_est: number;
    flags: MeditationFlag[];
}

/** A flag surfaced in the Meditate tab UI. */
export interface MeditationFlag {
    id: string;
    label: string;
    type: 'info' | 'warning' | 'boost';
}

/** Full session recording with efficacy data. */
export interface MeditationSessionRecord {
    id: string;
    date: string;
    type: MeditationType;
    intent: MeditationIntent;
    duration_seconds: number;
    completed: boolean;
    rating: 1 | 2 | 3 | 4 | 5;
    pre_hrv?: number;
    post_hrv?: number;
    efficacy_marked?: boolean;
    mss_at_time?: number;
}

/** Day record combining input + computed + sessions. */
export interface MeditationDayRecord {
    input: DailyMeditationInput;
    computed: ComputedMeditationScores;
    sessions: MeditationSessionRecord[];
}

/** Priority-ordered meditation rule. */
export interface MeditationRule {
    id: string;
    name: string;
    priority: number;
    evaluate: (input: DailyMeditationInput, computed: ComputedMeditationScores, todaySessions: MeditationSessionRecord[]) => {
        typeOverride?: MeditationType;
        durationOverride?: number;
        flag?: MeditationFlag;
        mssAdjust?: number;
    } | null;
}

export const MEDITATION_LABELS: Record<MeditationType, string> = {
    'mindfulness': 'Mindfulness',
    'body-scan': 'Body Scan',
    'breathing': 'Breathing',
    'yoga-nidra': 'Yoga Nidra',
};

export const MEDITATION_DESCRIPTIONS: Record<MeditationType, string> = {
    'mindfulness': 'Present-moment awareness and observation',
    'body-scan': 'Progressive body relaxation technique',
    'breathing': 'Rhythmic breath regulation exercises',
    'yoga-nidra': 'Deep conscious relaxation for recovery',
};

// ─── Health Module ───

/** Raw daily inputs from the user (manual entry). */
export interface DailyHealthInput {
    date: string;                  // ISO date string YYYY-MM-DD
    sleep_hours: number;           // e.g. 7.5
    sleep_quality: number;         // 1..5 (subjective)
    sleep_disturbances: number;    // count
    exercise_minutes: number;      // aerobic minutes
    sedentary_hours: number;
    water_ml: number;
    stress_level: number;          // 1..5
    fatigue_level: number;         // 1..5
    hrv_rmssd_ms?: number;         // optional
    weight_kg?: number;            // optional (for hydration targets)
    notes?: string;
}

/** Attention capacity recommendation derived from CognitiveReadiness. */
export interface AttentionCapacity {
    level: 'high' | 'moderate' | 'light' | 'recovery';
    minutes: number;
}

/** All computed scores from a daily health input. */
export interface ComputedHealthScores {
    SleepScore: number;
    SleepQualityScore: number;
    HRVScore: number;
    StressScore: number;
    FatigueScore: number;
    RecoveryScore: number;
    ExerciseScore: number;
    HydrationScore: number;
    SedentaryScore: number;
    LifestyleScore: number;
    CognitiveReadiness: number;
    AttentionCapacity: AttentionCapacity;
}

/** A flag surfaced in the Health tab UI. */
export interface HealthFlag {
    id: string;
    label: string;
    type: 'urgent' | 'warning' | 'info';
}

/** Full day record: raw input + computed scores + flags. */
export interface HealthDayRecord {
    input: DailyHealthInput;
    computed: ComputedHealthScores;
    flags: HealthFlag[];
    recommendations: Recommendation[];
}

/** Legacy compatibility alias */
export interface HealthSnapshot {
    date: string;
    steps: number;
    sleepHours: number;
    hrv?: number;
    sedentaryMinutes: number;
    hydrationGlasses: number;
}

export type RecommendationType = 'exercise' | 'sleep' | 'hydration' | 'recovery' | 'meditation' | 'stress';

export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    triggeredBy: string;
}

/** ML-hook: labelled outcome for future model training. */
export interface LabelledOutcome {
    date: string;
    user_rating?: number;       // 1–5 subjective
    session_success?: boolean;
    actual_focus_minutes?: number;
}

// ─── Rule Engine ───
export interface RuleContext {
    user: UserProfile;
    health: DailyHealthInput;
    healthRecords: HealthDayRecord[];
    focusSessions: FocusSession[];
    meditationSessions: MeditationSession[];
}

export interface Rule {
    id: string;
    name: string;
    evaluate: (ctx: RuleContext) => Recommendation | null;
}

export interface HealthRule {
    id: string;
    name: string;
    priority: number; // lower = higher priority
    evaluate: (ctx: RuleContext, computed: ComputedHealthScores) => {
        recommendation?: Recommendation;
        flag?: HealthFlag;
        attentionOverride?: AttentionCapacity['level'];
        readinessBoost?: number;
    } | null;
}
