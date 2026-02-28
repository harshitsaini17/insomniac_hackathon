// ─────────────────────────────────────────────────────────────────────────────
// Cognitive Training: Dual N-Back
// Adaptive staircase difficulty with position + audio stimuli
// ─────────────────────────────────────────────────────────────────────────────

import {
    NBackGameState,
    NBackResponse,
    CognitiveTrainingResult,
} from '../models/types';
import { NBACK_DEFAULTS } from '../models/constants';

/**
 * Initialize a new Dual N-Back game session.
 *
 * The game presents:
 *   1. Position stimuli on a 3×3 grid
 *   2. Audio/letter stimuli
 *
 * Player must identify if EITHER the position or audio matches
 * what was shown N trials ago.
 */
export function initializeNBackGame(level?: number): NBackGameState {
    const n = level || NBACK_DEFAULTS.startingLevel;
    const totalTrials = NBACK_DEFAULTS.trialsPerSession;
    const gridSize = NBACK_DEFAULTS.gridSize;
    const totalPositions = gridSize * gridSize; // 9 positions

    // Generate random sequences
    const positionSequence = generateSequence(totalTrials, totalPositions);
    const audioSequence = generateSequence(totalTrials, 8); // 8 distinct sounds/letters

    // Inject some guaranteed matches for fair difficulty
    injectMatches(positionSequence, n, Math.floor(totalTrials * 0.3));
    injectMatches(audioSequence, n, Math.floor(totalTrials * 0.3));

    return {
        level: n,
        currentTrial: 0,
        totalTrials,
        positionSequence,
        audioSequence,
        responses: [],
        isRunning: true,
    };
}

/**
 * Process a player's response for the current trial.
 *
 * @param state         Current game state
 * @param positionMatch Did the user indicate a position match?
 * @param audioMatch    Did the user indicate an audio match?
 * @param reactionTimeMs Time taken to respond
 * @returns Updated game state
 */
export function processNBackResponse(
    state: NBackGameState,
    positionMatch: boolean,
    audioMatch: boolean,
    reactionTimeMs: number,
): NBackGameState {
    if (!state.isRunning || state.currentTrial >= state.totalTrials) {
        return state;
    }

    const trial = state.currentTrial;
    const n = state.level;

    // Determine correct answers
    const actualPositionMatch =
        trial >= n &&
        state.positionSequence[trial] === state.positionSequence[trial - n];

    const actualAudioMatch =
        trial >= n &&
        state.audioSequence[trial] === state.audioSequence[trial - n];

    const response: NBackResponse = {
        trial,
        positionMatch: actualPositionMatch,
        audioMatch: actualAudioMatch,
        userPositionResponse: positionMatch,
        userAudioResponse: audioMatch,
        reactionTimeMs,
    };

    const newResponses = [...state.responses, response];
    const nextTrial = trial + 1;

    return {
        ...state,
        currentTrial: nextTrial,
        responses: newResponses,
        isRunning: nextTrial < state.totalTrials,
    };
}

/**
 * Compute accuracy from game responses.
 */
export function computeNBackAccuracy(responses: NBackResponse[]): number {
    if (responses.length === 0) return 0;

    let correct = 0;
    let total = 0;

    for (const r of responses) {
        // Position accuracy
        if (r.positionMatch || r.userPositionResponse) {
            total++;
            if (r.userPositionResponse === r.positionMatch) correct++;
        }
        // Audio accuracy
        if (r.audioMatch || r.userAudioResponse) {
            total++;
            if (r.userAudioResponse === r.audioMatch) correct++;
        }
    }

    // Also count correct rejections (neither matched, neither pressed)
    for (const r of responses) {
        if (!r.positionMatch && !r.userPositionResponse) {
            correct++;
            total++;
        }
        if (!r.audioMatch && !r.userAudioResponse) {
            correct++;
            total++;
        }
    }

    return total > 0 ? correct / total : 0;
}

/**
 * Determine the next level using adaptive staircase.
 *
 * Rules:
 *   Accuracy > 80% → increase level by 1
 *   Accuracy < 60% → decrease level by 1 (min 1)
 *   Otherwise       → keep current level
 */
export function computeNextLevel(
    currentLevel: number,
    accuracy: number,
): number {
    const { increaseThreshold, decreaseThreshold } = NBACK_DEFAULTS;

    if (accuracy > increaseThreshold) {
        return currentLevel + 1;
    } else if (accuracy < decreaseThreshold) {
        return Math.max(1, currentLevel - 1);
    }
    return currentLevel;
}

/**
 * Convert a completed game into a training result record.
 */
export function gameToTrainingResult(
    state: NBackGameState,
): CognitiveTrainingResult {
    const accuracy = computeNBackAccuracy(state.responses);
    const avgReaction =
        state.responses.length > 0
            ? state.responses.reduce((s, r) => s + r.reactionTimeMs, 0) /
            state.responses.length
            : 0;

    const correctCount = state.responses.filter(
        r =>
            r.userPositionResponse === r.positionMatch &&
            r.userAudioResponse === r.audioMatch,
    ).length;

    return {
        type: 'dual-n-back',
        timestamp: Date.now(),
        level: state.level,
        accuracy,
        reactionTimeMs: Math.round(avgReaction),
        duration:
            state.totalTrials *
            (NBACK_DEFAULTS.trialDurationMs + NBACK_DEFAULTS.interTrialMs),
        correctResponses: correctCount,
        totalTrials: state.totalTrials,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSequence(length: number, maxValue: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * maxValue));
}

function injectMatches(
    sequence: number[],
    n: number,
    matchCount: number,
): void {
    const indices = [];
    for (let i = n; i < sequence.length; i++) {
        indices.push(i);
    }

    // Shuffle and pick matchCount indices to make matches
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let k = 0; k < Math.min(matchCount, indices.length); k++) {
        const idx = indices[k];
        sequence[idx] = sequence[idx - n];
    }
}
