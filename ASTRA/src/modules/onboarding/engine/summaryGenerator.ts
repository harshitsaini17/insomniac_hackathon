// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Personalized Summary Generator
// Produces human-readable, non-judgmental, non-clinical text summaries
// ─────────────────────────────────────────────────────────────────────────────

import {
    BigFiveScores,
    GoalCategory,
    DistractionTypeVector,
    DistractionCategory,
    NudgeTone,
    MotivationType,
} from '../models/onboardingTypes';

// ── Summary Input ────────────────────────────────────────────────────────────

interface SummaryInput {
    bigFive: BigFiveScores;
    impulsivityIndex: number;
    goalCategory: GoalCategory;
    distractionTypeVector: DistractionTypeVector;
    nudgeTone: NudgeTone;
    ses: number;
    ers: number;
    motivationType: MotivationType;
}

// ── Goal Category Labels ─────────────────────────────────────────────────────

const GOAL_LABELS: Record<GoalCategory, string> = {
    career: 'career-focused',
    academic: 'academically driven',
    health: 'health-conscious',
    creative: 'creatively inspired',
    financial: 'financially ambitious',
    personal: 'growth-oriented',
    other: 'goal-driven',
};

// ── Distraction Labels ───────────────────────────────────────────────────────

const DISTRACTION_LABELS: Record<DistractionCategory, string> = {
    social_media: 'social media during unstructured hours',
    gaming: 'gaming sessions that stretch longer than intended',
    mental_rumination: 'overthinking and mental spiraling',
    social_interaction: 'social interactions and conversations',
    fatigue: 'low energy and procrastination',
    other: 'various distractions',
};

// ── Nudge Strategy Labels ────────────────────────────────────────────────────

const NUDGE_STRATEGY_LABELS: Record<NudgeTone, string> = {
    supportive: 'gentle, supportive reminders that acknowledge your effort',
    sharp: 'direct, no-nonsense reality checks to keep you on track',
    challenge: 'challenge-based prompts that push you to beat your own records',
    confidence_building: 'encouraging messages that build your confidence step by step',
};

// ── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a 2–3 sentence personalized summary.
 * Must feel human, not clinical, not judgmental.
 */
export function generatePersonalizedSummary(input: SummaryInput): string {
    const {
        impulsivityIndex,
        goalCategory,
        distractionTypeVector,
        nudgeTone,
        ses,
        motivationType,
    } = input;

    // ── Sentence 1: Identity + Goal Orientation ──────────────────────────
    const goalLabel = GOAL_LABELS[goalCategory];
    let impulsivityDesc: string;
    if (impulsivityIndex < 0.3) {
        impulsivityDesc = 'strong self-discipline';
    } else if (impulsivityIndex < 0.5) {
        impulsivityDesc = 'moderate self-control with room to grow';
    } else if (impulsivityIndex < 0.7) {
        impulsivityDesc = 'a tendency to act on impulse';
    } else {
        impulsivityDesc = 'powerful urges that can be channeled with the right support';
    }

    const sentence1 = `You are a ${goalLabel} individual with ${impulsivityDesc}.`;

    // ── Sentence 2: Primary Distraction ──────────────────────────────────
    const primaryDistraction = getPrimaryDistraction(distractionTypeVector);
    const distractionLabel = DISTRACTION_LABELS[primaryDistraction];
    const sentence2 = `Your main distraction pattern is ${distractionLabel}.`;

    // ── Sentence 3: Recommended Approach ─────────────────────────────────
    const nudgeLabel = NUDGE_STRATEGY_LABELS[nudgeTone];
    let approachPrefix: string;

    if (ses > 0.65) {
        approachPrefix = 'Given your determination';
    } else if (ses > 0.4) {
        approachPrefix = 'Based on your profile';
    } else {
        approachPrefix = 'To help you build momentum';
    }

    // Add motivation flavor
    let motivationSuffix = '';
    if (motivationType === 'intrinsic') {
        motivationSuffix = ' Your inner drive will be your greatest asset.';
    } else if (motivationType === 'extrinsic') {
        motivationSuffix = ' We\'ll help you stay focused on those concrete milestones.';
    }

    const sentence3 = `${approachPrefix}, you respond best to ${nudgeLabel}.${motivationSuffix}`;

    return `${sentence1} ${sentence2} ${sentence3}`;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function getPrimaryDistraction(dtv: DistractionTypeVector): DistractionCategory {
    let best: DistractionCategory = 'other';
    let bestWeight = -1;

    const categories = Object.keys(dtv) as DistractionCategory[];
    for (const cat of categories) {
        if (dtv[cat] > bestWeight) {
            bestWeight = dtv[cat];
            best = cat;
        }
    }

    return best;
}
