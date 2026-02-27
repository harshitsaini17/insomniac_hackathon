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

export interface MeditationSession {
    id: string;
    type: MeditationType;
    duration: number;
    completedAt: number;
    rating: 1 | 2 | 3 | 4 | 5;
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
export interface HealthSnapshot {
    date: string;
    steps: number;
    sleepHours: number;
    hrv?: number;
    sedentaryMinutes: number;
    hydrationGlasses: number;
}

export type RecommendationType = 'exercise' | 'sleep' | 'hydration' | 'recovery' | 'meditation';

export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    triggeredBy: string;
}

// ─── Rule Engine ───
export interface RuleContext {
    user: UserProfile;
    health: HealthSnapshot;
    focusSessions: FocusSession[];
    meditationSessions: MeditationSession[];
}

export interface Rule {
    id: string;
    name: string;
    evaluate: (ctx: RuleContext) => Recommendation | null;
}
