// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — Strategy Selector
// Maps (Context + Gap + Personality) → Intervention Strategy
// ─────────────────────────────────────────────────────────────────────────────

import type {
    UserState,
    ContextState,
    BehavioralGapScore,
    InterventionStrategy,
    StrategyType,
} from '../types/orchestratorTypes';
import type { NudgeTone } from '../../onboarding/models/onboardingTypes';
import type { InterventionType, StrictnessLevel } from '../../personalization/models/personalizationTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy Selection
// ═══════════════════════════════════════════════════════════════════════════════

export function selectStrategy(
    state: UserState,
    context: ContextState,
    gap: BehavioralGapScore,
): InterventionStrategy {
    const strategyType = selectStrategyType(context, gap, state);
    const tone = selectTone(strategyType, state);
    const strictness = selectStrictness(strategyType, gap, state);
    const timing = selectTiming(context, gap, state);
    const modality = selectModality(strategyType, strictness);
    const rationale = generateRationale(strategyType, context, gap);

    return {
        type: strategyType,
        tone,
        strictness,
        timing,
        modality,
        rationale,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy Type Selection
// ═══════════════════════════════════════════════════════════════════════════════

function selectStrategyType(
    context: ContextState,
    gap: BehavioralGapScore,
    state: UserState,
): StrategyType {
    // ── Safety-first: Recovery contexts ──
    if (context.mode === 'overloaded' || context.mode === 'cognitively-fatigued') {
        return 'recovery-first';
    }

    if (context.mode === 'emotionally-reactive') {
        // High authority resistance → reflective, not enforcing
        return state.static.authorityResistance > 0.6 ? 'reflective' : 'supportive';
    }

    if (context.mode === 'recovering') {
        return 'recovery-first';
    }

    // ── Gap-driven strategies ──
    if (gap.level === 'critical') {
        // Critical gap + sufficient cognitive readiness → enforce
        if (state.dynamic.cognitiveReadiness > 0.5) {
            return 'enforcing';
        }
        // Critical but fatigued → supportive with urgency
        return 'supportive';
    }

    if (gap.level === 'high') {
        // High authority resistance → reflective (forced compliance backfires)
        if (state.static.authorityResistance > 0.6) {
            return 'reflective';
        }
        return 'enforcing';
    }

    if (gap.level === 'moderate') {
        return 'reflective';
    }

    // ── Opportunity contexts ──
    if (context.mode === 'performance-ready' || context.mode === 'opportunity-window') {
        return 'opportunity-driven';
    }

    // ── Default: gentle supportive ──
    return 'supportive';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tone Selection — Aligns with personality profile
// ═══════════════════════════════════════════════════════════════════════════════

function selectTone(strategy: StrategyType, state: UserState): NudgeTone {
    const { emotionalReactivity, selfEfficacy, authorityResistance } = state.static;

    switch (strategy) {
        case 'recovery-first':
        case 'supportive':
            // Emotionally reactive → always supportive
            if (emotionalReactivity > 0.6) return 'supportive';
            // Low self-efficacy → build confidence
            if (selfEfficacy < 0.4) return 'confidence_building';
            return 'supportive';

        case 'reflective':
            // Challenge tone for high self-efficacy
            if (selfEfficacy > 0.7) return 'challenge';
            return 'supportive';

        case 'enforcing':
            // High authority resistance → use challenge (not sharp)
            if (authorityResistance > 0.6) return 'challenge';
            // High self-efficacy → accountability via sharp
            if (selfEfficacy > 0.6) return 'sharp';
            return 'challenge';

        case 'opportunity-driven':
            if (selfEfficacy > 0.6) return 'challenge';
            return 'confidence_building';

        default:
            return state.static.nudgeTone;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strictness Selection
// ═══════════════════════════════════════════════════════════════════════════════

function selectStrictness(
    strategy: StrategyType,
    gap: BehavioralGapScore,
    state: UserState,
): StrictnessLevel {
    const { authorityResistance, impulsivityIndex } = state.static;
    const { interventionFatigue } = state.behavioral;

    // Base from strategy
    let base: number;
    switch (strategy) {
        case 'recovery-first': base = 1; break;
        case 'supportive': base = 2; break;
        case 'reflective': base = 2; break;
        case 'opportunity-driven': base = 2; break;
        case 'enforcing': base = 4; break;
    }

    // Modifiers
    // Gap pushes strictness up
    if (gap.level === 'critical') base = Math.min(base + 1, 5);
    else if (gap.level === 'high') base = Math.min(base + 1, 4);

    // High authority resistance pulls down
    if (authorityResistance > 0.6) base = Math.max(base - 1, 1);

    // High impulsivity pushes up (they need more structure)
    if (impulsivityIndex > 0.7) base = Math.min(base + 1, 5);

    // Intervention fatigue pulls down
    if (interventionFatigue > 0.6) base = Math.max(base - 1, 1);

    return Math.round(clamp(base, 1, 5)) as StrictnessLevel;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Timing Selection
// ═══════════════════════════════════════════════════════════════════════════════

function selectTiming(
    context: ContextState,
    gap: BehavioralGapScore,
    state: UserState,
): 'immediate' | 'delayed' | 'scheduled' {
    // Recovery → delayed (don't interrupt)
    if (context.mode === 'recovering' || context.mode === 'cognitively-fatigued') {
        return 'delayed';
    }

    // Critical gap → immediate
    if (gap.level === 'critical') return 'immediate';

    // High fatigue → delayed
    if (state.behavioral.interventionFatigue > 0.7) return 'delayed';

    // Normal → scheduled with planning
    if (gap.level === 'low') return 'scheduled';

    return 'immediate';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Modality Selection
// ═══════════════════════════════════════════════════════════════════════════════

function selectModality(
    strategy: StrategyType,
    strictness: StrictnessLevel,
): InterventionType {
    if (strategy === 'enforcing' && strictness >= 4) return 'hard_block';
    if (strategy === 'enforcing') return 'soft_delay';
    if (strategy === 'reflective') return 'reflective';
    return 'reflective';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Rationale Generation
// ═══════════════════════════════════════════════════════════════════════════════

function generateRationale(
    strategy: StrategyType,
    context: ContextState,
    gap: BehavioralGapScore,
): string {
    const parts: string[] = [];

    parts.push(`Context: ${context.mode} (${(context.confidence * 100).toFixed(0)}% confidence)`);

    if (gap.level !== 'low') {
        parts.push(`Gap: ${gap.level} — ${gap.primaryTension}`);
    }

    const strategyLabels: Record<StrategyType, string> = {
        'reflective': 'Gentle awareness to encourage self-correction',
        'supportive': 'Warm encouragement to maintain momentum',
        'enforcing': 'Firm accountability to close the behavioral gap',
        'recovery-first': 'Prioritizing rest and recovery before pushing further',
        'opportunity-driven': 'Capitalizing on a strong cognitive state for growth',
    };

    parts.push(`Strategy: ${strategyLabels[strategy]}`);

    return parts.join('. ');
}

// ── Helper ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, v));
}
