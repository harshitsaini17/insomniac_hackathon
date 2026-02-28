// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Constants, Dictionaries & Scoring Weights
// Rule-based NLP keyword maps and behavioral model configuration
// ─────────────────────────────────────────────────────────────────────────────

import { GoalCategory, DistractionCategory, QuestionItem } from './onboardingTypes';

// ── Goal Keyword Dictionary ──────────────────────────────────────────────────

export const GOAL_KEYWORDS: Record<GoalCategory, string[]> = {
    career: [
        'internship', 'placement', 'job', 'career', 'company', 'interview',
        'resume', 'portfolio', 'promotion', 'salary', 'hire', 'work',
        'corporate', 'startup', 'business', 'freelance', 'linkedin', 'offer',
    ],
    academic: [
        'gate', 'upsc', 'exam', 'study', 'college', 'university', 'grade',
        'gpa', 'cgpa', 'marks', 'semester', 'thesis', 'research', 'jee',
        'neet', 'cat', 'gre', 'ielts', 'toefl', 'scholarship', 'phd',
        'mba', 'degree', 'certification', 'course', 'learn', 'class',
    ],
    health: [
        'gym', 'weight', 'fitness', 'exercise', 'run', 'workout', 'diet',
        'health', 'muscle', 'yoga', 'meditation', 'sleep', 'mental health',
        'anxiety', 'stress', 'therapy', 'wellness', 'body', 'strength',
    ],
    creative: [
        'art', 'music', 'write', 'writing', 'novel', 'film', 'design',
        'paint', 'draw', 'photography', 'video', 'content', 'blog',
        'youtube channel', 'podcast', 'animation', 'creative',
    ],
    financial: [
        'save', 'invest', 'money', 'finance', 'debt', 'budget', 'income',
        'stock', 'crypto', 'trading', 'savings', 'financial', 'wealth',
    ],
    personal: [
        'habit', 'discipline', 'confidence', 'social', 'relationship',
        'self-improvement', 'mindset', 'routine', 'productivity', 'focus',
        'time management', 'organized', 'growth', 'better person',
    ],
    other: [],
};

// ── Distraction Keyword Dictionary ───────────────────────────────────────────

export const DISTRACTION_KEYWORDS: Record<DistractionCategory, string[]> = {
    social_media: [
        'instagram', 'reels', 'tiktok', 'twitter', 'x.com', 'facebook',
        'snapchat', 'reddit', 'youtube', 'shorts', 'social media',
        'scrolling', 'feed', 'stories', 'memes', 'whatsapp', 'telegram',
        'discord', 'threads', 'pinterest',
    ],
    gaming: [
        'gaming', 'game', 'games', 'valorant', 'pubg', 'genshin',
        'minecraft', 'fortnite', 'cod', 'call of duty', 'league',
        'console', 'pc gaming', 'mobile games', 'steam', 'xbox',
        'playstation', 'nintendo', 'roblox', 'apex',
    ],
    mental_rumination: [
        'overthinking', 'worry', 'rumination', 'anxiety', 'stress',
        'negative thoughts', 'spiraling', 'daydreaming', 'zoning out',
        'cant focus', 'racing thoughts', 'dwelling', 'overanalyzing',
    ],
    social_interaction: [
        'friends', 'chatting', 'texting', 'calls', 'hanging out',
        'socializing', 'parties', 'people', 'conversations',
        'notifications', 'group chat', 'meetups',
    ],
    fatigue: [
        'tired', 'fatigue', 'sleepy', 'exhausted', 'burnout', 'lazy',
        'no energy', 'drained', 'unmotivated', 'bored', 'lethargic',
        'procrastination', 'procrastinate', 'nap', 'rest',
    ],
    other: [],
};

// ── Emotion Word Dictionary ──────────────────────────────────────────────────
// Valence: -1.0 (most negative) to +1.0 (most positive)

export const EMOTION_WORDS: Record<string, number> = {
    // High negative arousal (increase ERS)
    guilty: -0.8,
    anxious: -0.7,
    frustrated: -0.7,
    angry: -0.8,
    ashamed: -0.9,
    disappointed: -0.6,
    regretful: -0.7,
    worthless: -0.9,
    hopeless: -0.8,
    depressed: -0.9,
    panicked: -0.8,
    overwhelmed: -0.7,
    disgusted: -0.6,
    embarrassed: -0.6,
    sad: -0.5,
    upset: -0.5,
    stressed: -0.6,
    terrible: -0.7,
    horrible: -0.8,
    miserable: -0.8,
    hate: -0.7,

    // Low arousal / indifference (decrease ERS)
    indifferent: 0.0,
    neutral: 0.1,
    fine: 0.1,
    okay: 0.1,
    whatever: -0.1,
    numb: -0.2,
    unbothered: 0.1,
    'dont care': 0.0,

    // Positive arousal
    motivated: 0.7,
    determined: 0.8,
    energized: 0.7,
    inspired: 0.8,
    relieved: 0.4,
    hopeful: 0.5,
    optimistic: 0.6,
    excited: 0.7,
    proud: 0.6,
    happy: 0.6,
    grateful: 0.7,
    confident: 0.7,
    focused: 0.6,
    calm: 0.4,
    peaceful: 0.5,
};

// ── Urgency Markers ──────────────────────────────────────────────────────────

export const URGENCY_MARKERS: Record<string, number> = {
    // Very high urgency
    'this week': 0.95,
    'tomorrow': 0.95,
    'today': 0.95,
    'asap': 0.90,
    'urgent': 0.90,
    'immediately': 0.90,
    'deadline': 0.85,
    'due date': 0.85,

    // High urgency
    '1 month': 0.80,
    'one month': 0.80,
    'next month': 0.75,
    '2 months': 0.70,
    'two months': 0.70,
    '3 months': 0.65,
    'three months': 0.65,
    'soon': 0.65,
    'quickly': 0.60,

    // Moderate urgency
    '6 months': 0.50,
    'six months': 0.50,
    'this year': 0.45,
    'semester': 0.50,

    // Low urgency
    'next year': 0.30,
    'someday': 0.15,
    'eventually': 0.15,
    'no rush': 0.10,
    'whenever': 0.10,
    'long term': 0.25,
    'years': 0.20,
};

// ── Self-Efficacy Phrase Detection ───────────────────────────────────────────

export const SELF_EFFICACY_POSITIVE: string[] = [
    'i will',
    'i am going to',
    'i am working on',
    'i\'m working on',
    'i\'m determined',
    'i am determined',
    'i\'m committed',
    'i can',
    'i know i can',
    'i\'m confident',
    'i am confident',
    'i\'m focused',
    'i am focused',
    'i\'m ready',
    'i have a plan',
    'i\'m sure',
    'i am sure',
    'definitely',
    'absolutely',
    'without a doubt',
    'i\'m going to',
    'i must',
    'i need to',
    'i have to',
];

export const SELF_EFFICACY_NEGATIVE: string[] = [
    'i hope',
    'maybe',
    'i wish',
    'i think',
    'hopefully',
    'i guess',
    'not sure',
    'i don\'t know',
    'i cant',
    'i can\'t',
    'impossible',
    'too hard',
    'too difficult',
    'i\'m afraid',
    'probably not',
    'might',
    'i doubt',
    'if only',
    'i struggle',
    'i always fail',
    'never works',
    'i suck at',
    'i\'m bad at',
];

// ── Scoring Weights ──────────────────────────────────────────────────────────

export const SCORING_WEIGHTS = {
    /** Impulsivity Index: II = normalize((7 − C) + N + ERS) */
    impulsivity: {
        conscientiousnessInverse: 1.0,
        neuroticism: 1.0,
        emotionalReactivity: 0.8,
        maxRaw: 14.8, // (7−1) + 7 + (1*0.8) = 6 + 7 + 0.8
    },

    /** Strictness Compatibility Score weights */
    strictness: {
        conscientiousness: 0.30,
        strictnessPreference: 0.30,
        selfEfficacy: 0.20,
        authorityResistanceInverse: 0.20,
    },

    /** Uninstall Risk Probability z-score weights */
    uninstallRisk: {
        authorityResistance: 1.5,
        selfEfficacyInverse: 1.2,
        emotionalReactivity: 0.8,
        autonomyPreference: 1.0,
        bias: -2.0, // center the sigmoid
    },

    /** Baseline Focus Estimate weights */
    baselineFocus: {
        conscientiousness: 0.40,
        selfEfficacy: 0.30,
        impulsivityInverse: 0.30,
    },
} as const;

// ── Structured Question Bank ─────────────────────────────────────────────────

export const STRUCTURED_QUESTIONS: QuestionItem[] = [
    // ── Conscientiousness ────────────────────────────────────────────────
    {
        id: 'conscientiousness1',
        type: 'likert',
        prompt: 'I keep my workspace organized and follow through on my plans.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_1',
    },
    {
        id: 'conscientiousness2',
        type: 'likert',
        prompt: 'I often finish tasks ahead of schedule rather than at the last minute.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_1',
    },

    // ── Neuroticism ──────────────────────────────────────────────────────
    {
        id: 'neuroticism1',
        type: 'likert',
        prompt: 'I get stressed easily when things don\'t go as planned.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_1',
    },
    {
        id: 'neuroticism2',
        type: 'likert',
        prompt: 'My mood changes frequently throughout the day.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_1',
    },

    // ── Openness ─────────────────────────────────────────────────────────
    {
        id: 'openness',
        type: 'likert',
        prompt: 'I enjoy trying new approaches and experimenting with different strategies.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_2',
    },

    // ── Agreeableness ────────────────────────────────────────────────────
    {
        id: 'agreeableness',
        type: 'likert',
        prompt: 'I generally trust other people\'s advice and recommendations.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_2',
    },

    // ── Extraversion ─────────────────────────────────────────────────────
    {
        id: 'extraversion',
        type: 'likert',
        prompt: 'I feel energized when I\'m around other people.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_2',
    },

    // ── Authority Resistance ─────────────────────────────────────────────
    {
        id: 'authorityResistance1',
        type: 'likert',
        prompt: 'I dislike being told what to do, even when I know it\'s for my benefit.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_3',
    },
    {
        id: 'authorityResistance2',
        type: 'likert',
        prompt: 'I tend to push back when apps try to restrict my behavior.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Strongly Disagree', 'Strongly Agree'],
        group: 'structured_3',
    },

    // ── Strictness Preference ────────────────────────────────────────────
    {
        id: 'strictnessPreference',
        type: 'likert',
        prompt: 'I want this app to be strict with me, even if it\'s uncomfortable.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Gentle Reminders Only', 'Be Very Strict'],
        group: 'structured_3',
    },

    // ── Autonomy Preference ──────────────────────────────────────────────
    {
        id: 'autonomyPreference',
        type: 'likert',
        prompt: 'I prefer making my own decisions about when and how to focus.',
        required: true,
        scale: [1, 7],
        scaleLabels: ['Guide Me Fully', 'I Decide Everything'],
        group: 'structured_3',
    },
];

// ── Open-ended Question Bank ─────────────────────────────────────────────────

export const OPEN_ENDED_QUESTIONS: QuestionItem[] = [
    {
        id: 'coreGoal',
        type: 'open_ended',
        prompt: 'What is the single most important goal you want to achieve in the next 3–6 months?',
        required: true,
        examples: [
            'Get a summer internship at a tech company',
            'Score above 90% in my semester exams',
            'Build a consistent gym routine',
        ],
        group: 'open_goal',
    },
    {
        id: 'primaryDistraction',
        type: 'open_ended',
        prompt: 'What usually distracts you the most?',
        required: true,
        examples: [
            'Instagram reels',
            'Overthinking',
            'Gaming',
            'YouTube',
            'Friends',
            'Stress',
        ],
        group: 'open_distraction',
    },
    {
        id: 'emotionalStateAfterDistraction',
        type: 'open_ended',
        prompt: 'How do you usually feel after wasting time?',
        required: true,
        examples: [
            'Guilty',
            'Indifferent',
            'Anxious',
            'Motivated to do better',
            'Frustrated with myself',
        ],
        group: 'open_emotion',
    },
    {
        id: 'idealFutureSelf',
        type: 'open_ended',
        prompt: 'In one sentence, describe the version of yourself you want to become.',
        required: true,
        examples: [
            'A disciplined person who wakes up early and works on their goals daily',
            'Someone who is in control of their time and emotions',
        ],
        group: 'open_future_self',
    },
    {
        id: 'selfIdentifiedWeakness',
        type: 'open_ended',
        prompt: 'What do you think is your biggest weakness when it comes to focus?',
        required: true,
        examples: [
            'I get bored too quickly',
            'I start strong but lose motivation after a few days',
            'I can\'t resist checking my phone',
        ],
        group: 'open_weakness',
    },
];

// ── All Questions (ordered) ──────────────────────────────────────────────────

export const ALL_QUESTIONS: QuestionItem[] = [
    ...STRUCTURED_QUESTIONS,
    ...OPEN_ENDED_QUESTIONS,
];
