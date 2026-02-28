// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding — Lightweight Rule-Based Text Analyzer
// No LLMs. Keyword detection, emotion dictionary, goal classification,
// urgency detection, self-efficacy tone analysis.
// ─────────────────────────────────────────────────────────────────────────────

import {
    GoalCategory,
    DistractionCategory,
    TextAnalysisResult,
    OnboardingAnswers,
    MotivationType,
} from '../models/onboardingTypes';

import {
    GOAL_KEYWORDS,
    DISTRACTION_KEYWORDS,
    EMOTION_WORDS,
    URGENCY_MARKERS,
    SELF_EFFICACY_POSITIVE,
    SELF_EFFICACY_NEGATIVE,
} from '../models/onboardingConstants';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toLower(text: string): string {
    return text.toLowerCase().trim();
}

/**
 * Count keyword matches in text. Returns matched keywords.
 */
function findKeywords(text: string, keywords: string[]): string[] {
    const lower = toLower(text);
    return keywords.filter(kw => lower.includes(kw.toLowerCase()));
}

// ── Goal Classification ──────────────────────────────────────────────────────

/**
 * Classify goal text into a GoalCategory via keyword frequency matching.
 * Returns the category with the most keyword hits.
 */
export function classifyGoal(text: string): {
    category: GoalCategory;
    detectedKeywords: string[];
} {
    const lower = toLower(text);
    let bestCategory: GoalCategory = 'other';
    let bestCount = 0;
    let bestKeywords: string[] = [];

    const categories = Object.keys(GOAL_KEYWORDS) as GoalCategory[];
    for (const category of categories) {
        if (category === 'other') continue;
        const matched = findKeywords(lower, GOAL_KEYWORDS[category]);
        if (matched.length > bestCount) {
            bestCount = matched.length;
            bestCategory = category;
            bestKeywords = matched;
        }
    }

    return { category: bestCategory, detectedKeywords: bestKeywords };
}

// ── Urgency Detection ────────────────────────────────────────────────────────

/**
 * Scan text for time-pressure markers and return urgency score (0–1).
 * Takes the highest urgency marker found.
 */
export function detectUrgency(text: string): {
    score: number;
    markers: string[];
} {
    const lower = toLower(text);
    let maxScore = -1;
    const foundMarkers: string[] = [];

    for (const [marker, score] of Object.entries(URGENCY_MARKERS)) {
        if (lower.includes(marker.toLowerCase())) {
            foundMarkers.push(marker);
            if (score > maxScore) {
                maxScore = score;
            }
        }
    }

    // Use default baseline only when no markers found
    if (foundMarkers.length === 0) {
        maxScore = 0.35;
    }

    return { score: maxScore, markers: foundMarkers };
}

// ── Emotion Word Analysis ────────────────────────────────────────────────────

/**
 * Match emotion words in text and compute emotional reactivity.
 * Higher absolute valence of negative words → higher reactivity.
 */
export function analyzeEmotionWords(text: string): {
    emotions: string[];
    valences: Record<string, number>;
    reactivityScore: number;
} {
    const lower = toLower(text);
    const detected: string[] = [];
    const valences: Record<string, number> = {};

    for (const [word, valence] of Object.entries(EMOTION_WORDS)) {
        if (lower.includes(word)) {
            detected.push(word);
            valences[word] = valence;
        }
    }

    // Reactivity = intensity of negative emotions
    if (detected.length === 0) {
        return { emotions: [], valences: {}, reactivityScore: 0.3 }; // mild default
    }

    const negativeSum = detected
        .filter(w => valences[w] < 0)
        .reduce((sum, w) => sum + Math.abs(valences[w]), 0);
    const positiveSum = detected
        .filter(w => valences[w] > 0)
        .reduce((sum, w) => sum + valences[w], 0);

    // Reactivity increases with negative emotion intensity,
    // decreases with positive/indifferent
    const raw = negativeSum / (negativeSum + positiveSum + 1);
    const reactivityScore = Math.min(1, Math.max(0, raw * 1.5));

    return { emotions: detected, valences, reactivityScore };
}

// ── Self-Efficacy Analysis ───────────────────────────────────────────────────

/**
 * Detect self-efficacy tone by matching positive vs negative phrases.
 * Returns 0–1 where 1 = very high self-efficacy.
 */
export function analyzeSelfEfficacy(text: string): {
    score: number;
    indicators: string[];
} {
    const lower = toLower(text);
    const positiveMatches = SELF_EFFICACY_POSITIVE.filter(p =>
        lower.includes(p.toLowerCase()),
    );
    const negativeMatches = SELF_EFFICACY_NEGATIVE.filter(p =>
        lower.includes(p.toLowerCase()),
    );

    const indicators = [...positiveMatches, ...negativeMatches];

    if (positiveMatches.length === 0 && negativeMatches.length === 0) {
        return { score: 0.5, indicators: [] }; // neutral
    }

    const total = positiveMatches.length + negativeMatches.length;
    const score = positiveMatches.length / total;

    return {
        score: Math.min(1, Math.max(0, score)),
        indicators,
    };
}

// ── Distraction Classification ───────────────────────────────────────────────

/**
 * Classify distraction text into one or more categories.
 * Returns all matching categories ordered by keyword hit count.
 */
export function classifyDistraction(text: string): {
    categories: DistractionCategory[];
    detectedKeywords: string[];
} {
    const lower = toLower(text);
    const results: { category: DistractionCategory; count: number; keywords: string[] }[] = [];

    const categories = Object.keys(DISTRACTION_KEYWORDS) as DistractionCategory[];
    for (const category of categories) {
        if (category === 'other') continue;
        const matched = findKeywords(lower, DISTRACTION_KEYWORDS[category]);
        if (matched.length > 0) {
            results.push({ category, count: matched.length, keywords: matched });
        }
    }

    // Sort by hit count descending
    results.sort((a, b) => b.count - a.count);

    if (results.length === 0) {
        return { categories: ['other'], detectedKeywords: [] };
    }

    return {
        categories: results.map(r => r.category),
        detectedKeywords: results.flatMap(r => r.keywords),
    };
}

// ── Motivation Type Detection ────────────────────────────────────────────────

/**
 * Infer motivation type from goal and future-self text.
 * Intrinsic: growth, learning, passion-driven language
 * Extrinsic: rewards, competition, status-driven language
 */
export function detectMotivationType(
    goalText: string,
    futureSelfText: string,
): MotivationType {
    const combined = toLower(goalText + ' ' + futureSelfText);

    const intrinsicWords = [
        'passion', 'love', 'enjoy', 'curious', 'learn', 'grow', 'better',
        'self', 'personal', 'mindset', 'disciplined', 'peaceful', 'happy',
        'fulfilled', 'meaningful', 'purpose', 'growth',
    ];
    const extrinsicWords = [
        'salary', 'money', 'job', 'promotion', 'rank', 'marks', 'grade',
        'score', 'win', 'compete', 'impress', 'fame', 'status', 'reward',
        'recognition', 'topper', 'placement', 'package',
    ];

    const intrinsicCount = findKeywords(combined, intrinsicWords).length;
    const extrinsicCount = findKeywords(combined, extrinsicWords).length;

    if (intrinsicCount > 0 && extrinsicCount > 0) return 'mixed';
    if (extrinsicCount > intrinsicCount) return 'extrinsic';
    if (intrinsicCount > extrinsicCount) return 'intrinsic';
    return 'mixed';
}

// ── Master Analysis Function ─────────────────────────────────────────────────

/**
 * Run all text analyses on onboarding open-ended answers.
 * Produces a complete TextAnalysisResult.
 */
export function analyzeAllOpenInputs(
    answers: Pick<
        OnboardingAnswers,
        | 'coreGoal'
        | 'primaryDistraction'
        | 'emotionalStateAfterDistraction'
        | 'idealFutureSelf'
        | 'selfIdentifiedWeakness'
    >,
): TextAnalysisResult {
    // Goal classification from goal text + weakness text
    const goalResult = classifyGoal(
        answers.coreGoal + ' ' + answers.selfIdentifiedWeakness,
    );

    // Urgency from goal text
    const urgencyResult = detectUrgency(answers.coreGoal);

    // Emotion analysis from post-distraction feeling + weakness
    const emotionResult = analyzeEmotionWords(
        answers.emotionalStateAfterDistraction + ' ' + answers.selfIdentifiedWeakness,
    );

    // Self-efficacy from goal + future self + weakness
    const efficacyResult = analyzeSelfEfficacy(
        answers.coreGoal +
        ' ' +
        answers.idealFutureSelf +
        ' ' +
        answers.selfIdentifiedWeakness,
    );

    // Distraction classification
    const distractionResult = classifyDistraction(answers.primaryDistraction);

    // Motivation type
    const motivationType = detectMotivationType(
        answers.coreGoal,
        answers.idealFutureSelf,
    );

    return {
        goalCategory: goalResult.category,
        detectedGoalKeywords: goalResult.detectedKeywords,
        distractionCategories: distractionResult.categories,
        detectedDistractionKeywords: distractionResult.detectedKeywords,
        emotionWords: emotionResult.emotions,
        emotionValences: emotionResult.valences,
        urgencyScore: urgencyResult.score,
        urgencyMarkers: urgencyResult.markers,
        selfEfficacyScore: efficacyResult.score,
        efficacyIndicators: efficacyResult.indicators,
        motivationType,
    };
}
