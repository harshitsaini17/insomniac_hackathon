// ─────────────────────────────────────────────────────────────────────────────
// Cognitive Training: Attention Switching Task
// Timed alternating tasks with reaction time logging
// ─────────────────────────────────────────────────────────────────────────────

import {
    AttentionSwitchState,
    SwitchResponse,
    CognitiveTrainingResult,
} from '../models/types';
import { ATTENTION_SWITCH_DEFAULTS } from '../models/constants';

/**
 * Initialize an Attention Switching session.
 *
 * The player alternates between two task types:
 *   1. Color identification — "What color is the stimulus?"
 *   2. Shape identification — "What shape is the stimulus?"
 *
 * Task type alternates every N trials (switch cost paradigm).
 * Reaction times and accuracy are logged per trial.
 */
export function initializeSwitchTask(): AttentionSwitchState {
    const { colors, shapes } = ATTENTION_SWITCH_DEFAULTS;

    return {
        currentTask: 'color',
        stimulus: generateStimulus(colors, shapes),
        trialIndex: 0,
        totalTrials: ATTENTION_SWITCH_DEFAULTS.trialsPerSession,
        responses: [],
        isRunning: true,
    };
}

/**
 * Generate a random stimulus (combination of color + shape).
 */
function generateStimulus(
    colors: string[],
    shapes: string[],
): { color: string; shape: string } {
    return {
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
}

/**
 * Get the next trial. Alternates task type and generates new stimulus.
 *
 * Pattern: blocks of 3–5 same-task trials, then switch.
 * This creates measurable switch costs.
 */
export function advanceTrial(
    state: AttentionSwitchState,
): AttentionSwitchState {
    if (!state.isRunning || state.trialIndex >= state.totalTrials) {
        return { ...state, isRunning: false };
    }

    const { colors, shapes } = ATTENTION_SWITCH_DEFAULTS;
    const nextIndex = state.trialIndex + 1;

    // Switch task every 3–5 trials
    const switchInterval = 3 + Math.floor(Math.random() * 3);
    const shouldSwitch = nextIndex % switchInterval === 0;
    const nextTask: 'color' | 'shape' = shouldSwitch
        ? state.currentTask === 'color'
            ? 'shape'
            : 'color'
        : state.currentTask;

    return {
        currentTask: nextTask,
        stimulus: generateStimulus(colors, shapes),
        trialIndex: nextIndex,
        totalTrials: state.totalTrials,
        responses: state.responses,
        isRunning: nextIndex < state.totalTrials,
    };
}

/**
 * Record a response for the current trial.
 *
 * @param state          Current task state
 * @param userAnswer     The user's answer (color name or shape name)
 * @param reactionTimeMs Time taken to respond
 * @returns Updated state with response recorded
 */
export function recordSwitchResponse(
    state: AttentionSwitchState,
    userAnswer: string,
    reactionTimeMs: number,
): AttentionSwitchState {
    // Determine correctness
    const correctAnswer =
        state.currentTask === 'color'
            ? state.stimulus.color
            : state.stimulus.shape;

    const isCorrect =
        userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    const response: SwitchResponse = {
        trial: state.trialIndex,
        taskType: state.currentTask,
        correct: isCorrect,
        reactionTimeMs,
    };

    return {
        ...state,
        responses: [...state.responses, response],
    };
}

/**
 * Compute accuracy of the session.
 */
export function computeSwitchAccuracy(
    responses: SwitchResponse[],
): number {
    if (responses.length === 0) return 0;
    const correct = responses.filter(r => r.correct).length;
    return correct / responses.length;
}

/**
 * Compute average reaction time.
 */
export function computeAvgReactionTime(
    responses: SwitchResponse[],
): number {
    if (responses.length === 0) return 0;
    return (
        responses.reduce((s, r) => s + r.reactionTimeMs, 0) / responses.length
    );
}

/**
 * Compute switch cost: difference in reaction time between
 * switch trials (task changed) and non-switch trials (task same).
 *
 * Higher switch cost = more difficulty transitioning between tasks.
 */
export function computeSwitchCost(
    responses: SwitchResponse[],
): number {
    if (responses.length < 2) return 0;

    const switchTrials: number[] = [];
    const nonSwitchTrials: number[] = [];

    for (let i = 1; i < responses.length; i++) {
        if (responses[i].taskType !== responses[i - 1].taskType) {
            switchTrials.push(responses[i].reactionTimeMs);
        } else {
            nonSwitchTrials.push(responses[i].reactionTimeMs);
        }
    }

    if (switchTrials.length === 0 || nonSwitchTrials.length === 0) return 0;

    const avgSwitch =
        switchTrials.reduce((s, v) => s + v, 0) / switchTrials.length;
    const avgNonSwitch =
        nonSwitchTrials.reduce((s, v) => s + v, 0) / nonSwitchTrials.length;

    return avgSwitch - avgNonSwitch;
}

/**
 * Convert completed session to a training result.
 */
export function switchToTrainingResult(
    state: AttentionSwitchState,
): CognitiveTrainingResult {
    const accuracy = computeSwitchAccuracy(state.responses);
    const avgRT = computeAvgReactionTime(state.responses);
    const correctCount = state.responses.filter(r => r.correct).length;

    return {
        type: 'attention-switching',
        timestamp: Date.now(),
        level: 1, // switching task doesn't have levels per se
        accuracy,
        reactionTimeMs: Math.round(avgRT),
        duration:
            state.totalTrials * ATTENTION_SWITCH_DEFAULTS.trialDurationMs,
        correctResponses: correctCount,
        totalTrials: state.totalTrials,
    };
}

/**
 * Determine difficulty adjustment for progressive overload.
 * Reduces trial duration as the user improves.
 */
export function getProgressiveOverload(
    history: CognitiveTrainingResult[],
): { trialDurationMs: number; totalTrials: number } {
    const switchResults = history.filter(h => h.type === 'attention-switching');
    const defaults = ATTENTION_SWITCH_DEFAULTS;

    if (switchResults.length < 3) {
        return {
            trialDurationMs: defaults.trialDurationMs,
            totalTrials: defaults.trialsPerSession,
        };
    }

    // Last 3 sessions
    const recent = switchResults.slice(-3);
    const avgAccuracy =
        recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;

    // If accuracy > 85% → reduce time per trial (harder)
    let trialDuration = defaults.trialDurationMs;
    if (avgAccuracy > 0.85) {
        trialDuration = Math.max(800, trialDuration - 200);
    } else if (avgAccuracy < 0.60) {
        trialDuration = Math.min(3000, trialDuration + 200);
    }

    // If improving → add more trials
    let totalTrials = defaults.trialsPerSession;
    if (avgAccuracy > 0.80) {
        totalTrials = Math.min(50, totalTrials + 5);
    }

    return { trialDurationMs: trialDuration, totalTrials };
}
