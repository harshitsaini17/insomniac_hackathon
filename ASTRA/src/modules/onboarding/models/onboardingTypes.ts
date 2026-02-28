// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Core Data Models
// All types for the Onboarding + Personality Modeling Module
// ─────────────────────────────────────────────────────────────────────────────

// ── Goal & Distraction Taxonomies ────────────────────────────────────────────

export type GoalCategory =
    | 'career'
    | 'academic'
    | 'health'
    | 'creative'
    | 'financial'
    | 'personal'
    | 'other';

export type DistractionCategory =
    | 'social_media'
    | 'gaming'
    | 'mental_rumination'
    | 'social_interaction'
    | 'fatigue'
    | 'other';

export type NudgeTone =
    | 'supportive'       // high ERS + high guilt
    | 'sharp'            // low ERS + indifferent
    | 'challenge'        // high SES
    | 'confidence_building'; // low SES

export type MotivationType = 'intrinsic' | 'extrinsic' | 'mixed';

// ── Questionnaire Types ──────────────────────────────────────────────────────

export interface QuestionItem {
    id: string;
    type: 'likert' | 'open_ended';
    prompt: string;
    required: boolean;
    /** For Likert: [min, max] scale bounds */
    scale?: [number, number];
    /** For Likert: label descriptions for scale ends */
    scaleLabels?: [string, string];
    /** Example answers shown as hints for open-ended */
    examples?: string[];
    /** Grouping key for multi-step UI */
    group: string;
}

export interface OnboardingAnswers {
    // ── Structured (Likert 1–7) ──────────────────────────────────────────
    conscientiousness1: number;
    conscientiousness2: number;
    neuroticism1: number;
    neuroticism2: number;
    openness: number;
    agreeableness: number;
    extraversion: number;
    authorityResistance1: number;
    authorityResistance2: number;
    strictnessPreference: number;
    autonomyPreference: number;

    // ── Open-ended (required) ────────────────────────────────────────────
    coreGoal: string;
    primaryDistraction: string;
    emotionalStateAfterDistraction: string;
    idealFutureSelf: string;
    selfIdentifiedWeakness: string;
}

// ── NLP Analysis Result ──────────────────────────────────────────────────────

export interface TextAnalysisResult {
    goalCategory: GoalCategory;
    detectedGoalKeywords: string[];

    distractionCategories: DistractionCategory[];
    detectedDistractionKeywords: string[];

    emotionWords: string[];
    emotionValences: Record<string, number>; // word → valence (-1 to 1)

    urgencyScore: number;      // 0–1
    urgencyMarkers: string[];

    selfEfficacyScore: number; // 0–1
    efficacyIndicators: string[];

    motivationType: MotivationType;
}

// ── Distraction Type Vector ──────────────────────────────────────────────────

export type DistractionTypeVector = Record<DistractionCategory, number>;

// ── Response Prediction Matrix ───────────────────────────────────────────────

export interface ResponsePredictionMatrix {
    reflective: number;    // P(comply | reflective nudge)
    softDelay: number;     // P(comply | soft delay)
    hardBlock: number;     // P(comply | hard block)
}

// ── Big Five Score Object ────────────────────────────────────────────────────

export interface BigFiveScores {
    conscientiousness: number;  // 1–7
    neuroticism: number;        // 1–7
    openness: number;           // 1–7
    agreeableness: number;      // 1–7
    extraversion: number;       // 1–7
}

// ── Full User Profile ────────────────────────────────────────────────────────

export interface UserProfile {
    // Personality
    bigFive: BigFiveScores;

    // Computed behavioral scores
    impulsivityIndex: number;              // 0–1
    authorityResistanceScore: number;      // 0–1
    strictnessCompatibility: number;       // 0–1
    uninstallRiskProbability: number;      // 0–1

    // Motivation & Goal
    motivationType: MotivationType;
    goalCategory: GoalCategory;
    goalUrgencyScore: number;              // 0–1
    goalText: string;

    // Emotional & Self-efficacy
    emotionalReactivityScore: number;      // 0–1
    selfEfficacyScore: number;             // 0–1

    // Distraction
    distractionTypeVector: DistractionTypeVector;

    // Response prediction
    predictedResponseMatrix: ResponsePredictionMatrix;

    // Focus estimate
    baselineFocusEstimate: number;         // 0–1

    // Nudge style
    nudgeTone: NudgeTone;

    // Human-readable summary
    personalizedSummary: string;

    // Ideal future self text (for nudge personalization)
    idealFutureSelf: string;

    // Raw answers preserved for editing
    rawAnswers: OnboardingAnswers;

    // Timestamps
    createdAt: number;
    updatedAt: number;
}

// ── Onboarding Step State ────────────────────────────────────────────────────

export type OnboardingStep =
    | 'welcome'
    | 'structured_1'   // conscientiousness, neuroticism
    | 'structured_2'   // openness, agreeableness, extraversion
    | 'structured_3'   // authority resistance, strictness, autonomy
    | 'open_goal'
    | 'open_distraction'
    | 'open_emotion'
    | 'open_future_self'
    | 'open_weakness'
    | 'summary';

export const ONBOARDING_STEPS: OnboardingStep[] = [
    'welcome',
    'structured_1',
    'structured_2',
    'structured_3',
    'open_goal',
    'open_distraction',
    'open_emotion',
    'open_future_self',
    'open_weakness',
    'summary',
];
