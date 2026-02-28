// ─────────────────────────────────────────────────────────────────────────────
// Model 3: Personality-Based Strictness
// Impulsivity Index (II) = normalize((7 − C) + N)
// ─────────────────────────────────────────────────────────────────────────────

import { PersonalityProfile, StrictnessResult, BlockingLevel } from '../models/types';
import { STRICTNESS_THRESHOLDS } from '../models/constants';
import { clamp } from './normalize';

/**
 * Compute Impulsivity Index and recommended blocking strictness.
 *
 * Given Likert-scale (1–7) personality traits:
 *   C = conscientiousness
 *   N = neuroticism
 *
 * Raw impulsivity = (7 − C) + N
 *   Range: (7−7)+1 = 1  to  (7−1)+7 = 13
 *
 * Normalized to [0, 1]:
 *   II = (raw − 1) / (13 − 1) = (raw − 1) / 12
 *
 * Strictness mapping:
 *   0.0–0.3 → reflective only (Level 1)
 *   0.3–0.6 → soft block (Level 2)
 *   0.6–1.0 → hard block allowed (Level 3)
 *
 * User override is ALWAYS allowed (enforced at engine layer).
 *
 * @param profile  User's personality profile
 * @returns StrictnessResult with index, level, and label
 */
export function computeImpulsivityIndex(
    profile: PersonalityProfile,
): StrictnessResult {
    const { conscientiousness, neuroticism } = profile;

    // Clamp to valid Likert range
    const C = clamp(conscientiousness, 1, 7);
    const N = clamp(neuroticism, 1, 7);

    // Raw impulsivity: low C + high N → high impulsivity
    const raw = (7 - C) + N;

    // Normalize to [0, 1]
    // Min raw = (7-7) + 1 = 1, Max raw = (7-1) + 7 = 13
    const impulsivityIndex = clamp((raw - 1) / 12, 0, 1);

    // Map to strictness level
    let recommendedLevel: BlockingLevel;
    let label: StrictnessResult['label'];

    if (impulsivityIndex < STRICTNESS_THRESHOLDS.reflective) {
        recommendedLevel = 1;
        label = 'reflective-only';
    } else if (impulsivityIndex < STRICTNESS_THRESHOLDS.softBlock) {
        recommendedLevel = 2;
        label = 'soft-block';
    } else {
        recommendedLevel = 3;
        label = 'hard-block';
    }

    return {
        impulsivityIndex,
        recommendedLevel,
        label,
    };
}

/**
 * Check if a given blocking level is allowed for this personality.
 * Users can always manually override downward (less strict).
 */
export function isLevelAllowed(
    profile: PersonalityProfile,
    level: BlockingLevel,
): boolean {
    const { recommendedLevel } = computeImpulsivityIndex(profile);
    return level <= recommendedLevel;
}
