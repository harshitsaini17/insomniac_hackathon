// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Focus Trainer — Normalization Utilities
// Shared math helpers for all models
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Min-max normalization → [0, 1]
 * Clamps output to [0, 1] for safety
 */
export function minMaxNormalize(
    value: number,
    min: number,
    max: number,
): number {
    if (max === min) return 0.5;
    return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Clamp value to [lo, hi]
 */
export function clamp(value: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, value));
}

/**
 * Z-score normalization (standard score)
 */
export function zScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

/**
 * Shannon entropy of a probability distribution
 * H = -Σ p_i * log2(p_i)
 *
 * Input: array of raw values (e.g., time per app).
 * They are automatically converted to probabilities.
 * Returns 0 for empty or single-element arrays.
 */
export function shannonEntropy(values: number[]): number {
    const total = values.reduce((s, v) => s + v, 0);
    if (total === 0 || values.length <= 1) return 0;

    const probabilities = values.map(v => v / total);

    let entropy = 0;
    for (const p of probabilities) {
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    }

    return entropy;
}

/**
 * Normalize Shannon entropy to [0, 1] by dividing by log2(N)
 * where N is the number of categories
 */
export function normalizedEntropy(values: number[]): number {
    if (values.length <= 1) return 0;
    const maxEntropy = Math.log2(values.length);
    if (maxEntropy === 0) return 0;
    return clamp(shannonEntropy(values) / maxEntropy, 0, 1);
}

/**
 * Weighted sum with automatic normalization of weights to sum to 1
 */
export function weightedSum(
    values: number[],
    weights: number[],
): number {
    if (values.length !== weights.length || values.length === 0) return 0;

    const totalWeight = weights.reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return 0;

    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i] * (weights[i] / totalWeight);
    }
    return sum;
}

/**
 * Simple moving average over the last N values
 */
export function movingAverage(values: number[], window: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-window);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
}

/**
 * Exponential moving average (more weight to recent values)
 * α = 2 / (window + 1)
 */
export function exponentialMovingAverage(
    values: number[],
    window: number,
): number {
    if (values.length === 0) return 0;
    const alpha = 2 / (window + 1);
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
        ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
}

/**
 * Safe division — returns fallback instead of Infinity/NaN
 */
export function safeDivide(
    numerator: number,
    denominator: number,
    fallback: number = 0,
): number {
    if (denominator === 0 || !isFinite(denominator)) return fallback;
    const result = numerator / denominator;
    return isFinite(result) ? result : fallback;
}

/**
 * Get time-of-day label from hour
 */
export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}
