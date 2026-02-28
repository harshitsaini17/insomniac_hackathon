// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — Context Inference
// Determines "what kind of day is this?" from the unified UserState
// ─────────────────────────────────────────────────────────────────────────────

import type { UserState, ContextState, ContextMode } from '../types/orchestratorTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// Context Inference Rules
// Each rule returns a ContextMode + confidence + reasons if matched.
// Rules are evaluated in priority order; first high-confidence match wins.
// ═══════════════════════════════════════════════════════════════════════════════

interface ContextCandidate {
    mode: ContextMode;
    confidence: number;
    signals: string[];
}

type ContextRule = (state: UserState) => ContextCandidate | null;

// ── Rule: Overloaded ─────────────────────────────────────────────────────────
const checkOverloaded: ContextRule = (s) => {
    const { stressLevel, fatigueLevel, cognitiveReadiness } = s.dynamic;
    if (stressLevel >= 4 && fatigueLevel >= 4) {
        const confidence = 0.6 + (stressLevel + fatigueLevel - 8) * 0.1;
        return {
            mode: 'overloaded',
            confidence: Math.min(confidence, 0.95),
            signals: [
                `Stress at ${stressLevel}/5`,
                `Fatigue at ${fatigueLevel}/5`,
                cognitiveReadiness < 0.4 ? `CRS critically low (${(cognitiveReadiness * 100).toFixed(0)}%)` : '',
            ].filter(Boolean),
        };
    }
    return null;
};

// ── Rule: Cognitively Fatigued ───────────────────────────────────────────────
const checkFatigued: ContextRule = (s) => {
    const { cognitiveReadiness, fatigueLevel, sleepHours } = s.dynamic;
    if (cognitiveReadiness < 0.4 || fatigueLevel >= 4) {
        const signals: string[] = [];
        let conf = 0.5;

        if (cognitiveReadiness < 0.3) { signals.push('CRS very low'); conf += 0.2; }
        else if (cognitiveReadiness < 0.4) { signals.push('CRS below threshold'); conf += 0.1; }

        if (fatigueLevel >= 4) { signals.push(`Fatigue ${fatigueLevel}/5`); conf += 0.15; }
        if (sleepHours < 6) { signals.push(`Only ${sleepHours}h sleep`); conf += 0.1; }

        return { mode: 'cognitively-fatigued', confidence: Math.min(conf, 0.9), signals };
    }
    return null;
};

// ── Rule: Emotionally Reactive ───────────────────────────────────────────────
const checkEmotionallyReactive: ContextRule = (s) => {
    const { stressLevel } = s.dynamic;
    const { neuroticism, emotionalReactivity } = s.static;

    if (stressLevel >= 4 && (neuroticism >= 5 || emotionalReactivity > 0.6)) {
        return {
            mode: 'emotionally-reactive',
            confidence: 0.5 + emotionalReactivity * 0.3,
            signals: [
                `Stress ${stressLevel}/5`,
                neuroticism >= 5 ? `High neuroticism (${neuroticism}/7)` : '',
                `Emotional reactivity ${(emotionalReactivity * 100).toFixed(0)}%`,
            ].filter(Boolean),
        };
    }
    return null;
};

// ── Rule: Drifting ───────────────────────────────────────────────────────────
const checkDrifting: ContextRule = (s) => {
    const { complianceRate, distractionRate, daysSinceLastFocus } = s.behavioral;
    const { complianceTrend } = s.semiDynamic;

    if (
        (complianceRate < 0.4 && distractionRate > 0.6) ||
        (complianceTrend === 'declining' && daysSinceLastFocus >= 2)
    ) {
        return {
            mode: 'drifting',
            confidence: 0.6 + distractionRate * 0.2,
            signals: [
                `Compliance at ${(complianceRate * 100).toFixed(0)}%`,
                `Distraction rate ${(distractionRate * 100).toFixed(0)}%`,
                daysSinceLastFocus >= 2 ? `${daysSinceLastFocus} days without focus` : '',
                complianceTrend === 'declining' ? 'Compliance declining' : '',
            ].filter(Boolean),
        };
    }
    return null;
};

// ── Rule: Performance Ready ──────────────────────────────────────────────────
const checkPerformanceReady: ContextRule = (s) => {
    const { cognitiveReadiness, sleepHours, fatigueLevel, stressLevel, currentAFI } = s.dynamic;

    if (cognitiveReadiness > 0.7 && sleepHours >= 7 && fatigueLevel <= 2 && currentAFI < 0.3) {
        return {
            mode: 'performance-ready',
            confidence: 0.6 + cognitiveReadiness * 0.2,
            signals: [
                `CRS ${(cognitiveReadiness * 100).toFixed(0)}%`,
                `${sleepHours}h sleep`,
                `Low fatigue (${fatigueLevel}/5)`,
                `AFI ${(currentAFI * 100).toFixed(0)}% (focused)`,
            ],
        };
    }
    return null;
};

// ── Rule: Opportunity Window ─────────────────────────────────────────────────
const checkOpportunityWindow: ContextRule = (s) => {
    const { cognitiveReadiness, currentAFI } = s.dynamic;
    const { habitStreak, weeklyFocusMinutes } = s.semiDynamic;

    if (cognitiveReadiness > 0.6 && currentAFI < 0.4 && weeklyFocusMinutes < 120) {
        return {
            mode: 'opportunity-window',
            confidence: 0.5 + cognitiveReadiness * 0.2,
            signals: [
                `CRS good (${(cognitiveReadiness * 100).toFixed(0)}%)`,
                `Only ${weeklyFocusMinutes} min focused this week`,
                habitStreak === 0 ? 'No streak — great time to start' : `${habitStreak}-day streak to extend`,
            ],
        };
    }
    return null;
};

// ── Rule: Recovering ─────────────────────────────────────────────────────────
const checkRecovering: ContextRule = (s) => {
    const { lastSessionWasSuccessful } = s.behavioral;
    const { cognitiveReadiness, fatigueLevel } = s.dynamic;

    if (lastSessionWasSuccessful && cognitiveReadiness < 0.6 && fatigueLevel >= 3) {
        return {
            mode: 'recovering',
            confidence: 0.6,
            signals: [
                'Recent session completed',
                `CRS dipped to ${(cognitiveReadiness * 100).toFixed(0)}%`,
                `Fatigue at ${fatigueLevel}/5`,
            ],
        };
    }
    return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main: Infer Context
// ═══════════════════════════════════════════════════════════════════════════════

const RULES: ContextRule[] = [
    checkOverloaded,        // highest priority — safety
    checkEmotionallyReactive,
    checkFatigued,
    checkDrifting,
    checkRecovering,
    checkPerformanceReady,
    checkOpportunityWindow,
];

export function inferContext(state: UserState): ContextState {
    const candidates: ContextCandidate[] = [];

    for (const rule of RULES) {
        const result = rule(state);
        if (result && result.confidence > 0.3) {
            candidates.push(result);
        }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    if (candidates.length === 0) {
        return {
            mode: 'maintenance',
            confidence: 0.5,
            signals: ['No strong signals detected — normal day'],
        };
    }

    const primary = candidates[0];
    const secondary = candidates.length > 1 ? candidates[1] : undefined;

    return {
        mode: primary.mode,
        confidence: primary.confidence,
        signals: primary.signals,
        secondaryMode: secondary?.mode,
    };
}
