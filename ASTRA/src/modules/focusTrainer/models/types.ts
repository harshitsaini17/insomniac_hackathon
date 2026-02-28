// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Focus Trainer — Core Data Models
// All types used across the Focus Trainer module
// ─────────────────────────────────────────────────────────────────────────────

/** Raw app usage session collected from UsageStatsManager */
export interface AppUsageSession {
    id?: number;
    appName: string;
    packageName: string;
    startTime: number;       // epoch ms
    endTime: number;         // epoch ms
    duration: number;        // milliseconds
    switchCount: number;     // switches during this session
    unlockCount: number;     // unlocks during this session
    timeOfDay: TimeOfDay;
    dayOfWeek: number;       // 0=Sun, 6=Sat
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/** Aggregated per-app statistics for a day */
export interface AppDailyStats {
    appName: string;
    packageName: string;
    totalTime: number;        // ms
    openFrequency: number;    // times opened
    avgSessionDuration: number;
    conflictDuringFocus: number; // 0–1 ratio
}

/** Health signals from Health Connect / sensors */
export interface HealthSignals {
    sleepDuration: number;    // hours
    sleepQuality: number;     // 0–1 normalized
    hrv: number;              // raw ms
    hrvNormalized: number;    // 0–1
    steps: number;
    activityLevel: number;    // 0–1 normalized
    timestamp: number;
}

/** User personality profile for strictness calibration */
export interface PersonalityProfile {
    conscientiousness: number; // 1–7 Likert
    neuroticism: number;       // 1–7 Likert
}

/** User-defined focus goal */
export interface FocusGoal {
    id: string;
    title: string;
    importance: number;       // 0–1
    scheduledStart?: number;  // epoch ms
    scheduledEnd?: number;
    associatedApps: string[]; // allowed app package names
    isActive: boolean;
}

/** A single Pomodoro focus session */
export interface PomodoroSession {
    id?: number;
    goalId?: string;
    startTime: number;
    endTime?: number;
    plannedDuration: number;  // ms
    actualDuration: number;   // ms
    distractionTime?: number; // epoch ms when first distracted
    wasSuccessful: boolean;
    breakDuration: number;    // ms
}

/** Cognitive training session result */
export interface CognitiveTrainingResult {
    id?: number;
    type: 'dual-n-back' | 'attention-switching';
    timestamp: number;
    level: number;
    accuracy: number;         // 0–1
    reactionTimeMs: number;   // average
    duration: number;         // ms
    correctResponses: number;
    totalTrials: number;
}

/** Nudge / intervention record */
export interface NudgeRecord {
    id?: number;
    timestamp: number;
    type: NudgeType;
    level: BlockingLevel;
    targetApp: string;
    goalId?: string;
    wasAccepted: boolean;     // did user comply?
    message: string;
}

export type NudgeType = 'reflective' | 'soft-delay' | 'hard-block' | 'dopamine-reset';
export type BlockingLevel = 1 | 2 | 3;

/** A focus window for the heatmap */
export interface FocusWindow {
    dayOfWeek: number;        // 0–6
    hourOfDay: number;        // 0–23
    avgAFI: number;           // average AFI during this slot
    sampleCount: number;
    qualityLabel: 'optimal' | 'good' | 'fair' | 'poor';
}

/** AFI computation result */
export interface AFIResult {
    score: number;            // 0–1
    level: 'deep' | 'moderate' | 'fragmented';
    switchesPerHour: number;
    unlocksPerHour: number;
    avgSessionDuration: number;
    entropy: number;
}

/** Distractiveness classification for an app */
export interface DistractivenessResult {
    appName: string;
    packageName: string;
    score: number;            // 0–1
    isDistractive: boolean;
}

/** Cognitive Readiness Score result */
export interface CRSResult {
    score: number;            // 0–1
    recommendation: 'focus' | 'meditation' | 'exercise' | 'rest';
}

/** Dopamine binge detection result */
export interface BingeDetectionResult {
    isBinge: boolean;
    triggerApp?: string;
    protocol: ResetAction[];
}

export type ResetAction = 'breathing-exercise' | 'walk-suggestion' | 'reflection-nudge';

/** Impulsivity / strictness result */
export interface StrictnessResult {
    impulsivityIndex: number; // 0–1
    recommendedLevel: BlockingLevel;
    label: 'reflective-only' | 'soft-block' | 'hard-block';
}

/** Goal conflict score result */
export interface GoalConflictResult {
    score: number;
    shouldEscalate: boolean;
}

/** Pomodoro survival modeling result */
export interface PomodoroOptimizationResult {
    nextDuration: number;     // ms
    expectedFocusTime: number;
    successRate: number;
    growthFactor: number;
}

/** Compliance probability result */
export interface ComplianceResult {
    probability: number;
    shouldEscalate: boolean;
}

/** Heatmap hour-block for attention forecasting */
export interface HourBlock {
    dayOfWeek: number;
    hour: number;
    predictedAFI: number;
    confidence: number;       // 0–1
    label: 'optimal' | 'good' | 'fair' | 'poor';
}

/** Dual N-Back game state */
export interface NBackGameState {
    level: number;            // current n
    currentTrial: number;
    totalTrials: number;
    positionSequence: number[];
    audioSequence: number[];
    responses: NBackResponse[];
    isRunning: boolean;
}

export interface NBackResponse {
    trial: number;
    positionMatch: boolean;
    audioMatch: boolean;
    userPositionResponse: boolean;
    userAudioResponse: boolean;
    reactionTimeMs: number;
}

/** Attention switching task state */
export interface AttentionSwitchState {
    currentTask: 'color' | 'shape';
    stimulus: { color: string; shape: string };
    trialIndex: number;
    totalTrials: number;
    responses: SwitchResponse[];
    isRunning: boolean;
}

export interface SwitchResponse {
    trial: number;
    taskType: 'color' | 'shape';
    correct: boolean;
    reactionTimeMs: number;
}
