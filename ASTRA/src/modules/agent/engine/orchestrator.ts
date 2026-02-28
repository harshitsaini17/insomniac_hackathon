// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5 — Orchestrator Pipeline (HYBRID: Rules + Groq LLM)
// The main decision brain: runs all 5 stages and emits PersonalizationDirective
// ALWAYS uses both rule-based engine AND LLM for personalization.
// ─────────────────────────────────────────────────────────────────────────────

import type {
    UserState,
    PersonalizationDirective,
    NudgePayload,
    NudgeAction,
    ContextState,
    BehavioralGapScore,
    InterventionStrategy,
} from '../types/orchestratorTypes';
import type { MeditationType } from '../../shared/types';
import type { RecoveryStyle, StrictnessLevel } from '../../personalization/models/personalizationTypes';
import type { UserProfile } from '../../onboarding/models/onboardingTypes';
import type { PersonalizationState } from '../../personalization/models/personalizationTypes';
import type { HealthDayRecord } from '../../shared/types';

import { buildUserState } from './stateIngestion';
import { inferContext } from './contextInference';
import { computeBehavioralGap } from './behavioralGap';
import { selectStrategy } from './strategySelector';
import { queryGroq, type GroqResponse } from '../llm/groqClient';
import { collectAgentContext, generateModuleMessages, type AgentContext } from './contextCollector';

// ═══════════════════════════════════════════════════════════════════════════════
// Main Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export async function runOrchestrator(
    profile: UserProfile | null,
    personalization: PersonalizationState | null,
    healthRecord: HealthDayRecord | null,
    mss: number,
    currentAFI: number,
    meditationSessionCount: number,
    meditationTotalMinutes: number,
    meditationAvgRating: number,
): Promise<PersonalizationDirective> {
    // ── AGENTIC: Self-collect context from all stores ─────────────────
    const agentCtx = collectAgentContext();

    // ── Stage 1: State Ingestion (use real data from agent context) ─────
    const userState = buildUserState(
        agentCtx.profile ?? profile,
        agentCtx.personalization ?? personalization,
        agentCtx.healthRecord ?? healthRecord,
        agentCtx.mss || mss,
        agentCtx.currentAFI || currentAFI,
        agentCtx.meditationSessionCount || meditationSessionCount,
        agentCtx.meditationTotalMinutes || meditationTotalMinutes,
        agentCtx.meditationAvgRating || meditationAvgRating,
    );

    // ── Stage 2: Context Inference ───────────────────────────────────────
    const context = inferContext(userState);

    // ── Stage 3: Behavioral Gap ──────────────────────────────────────────
    const gap = computeBehavioralGap(userState);

    // ── Stage 4: Strategy Selection ──────────────────────────────────────
    const strategy = selectStrategy(userState, context, gap);

    // ── AGENTIC: Generate module-specific messages (rule-based) ─────────
    const moduleMessages = generateModuleMessages(agentCtx);

    // ── Stage 5: Build Rule-Based Directive ──────────────────────────────
    let directive = buildDirective(userState, context, gap, strategy, moduleMessages);

    // ── MANDATORY: Groq LLM Enhancement ─────────────────────────────────
    // Rules provide the structural backbone; LLM personalizes the voice.
    console.log('[Orchestrator] Running hybrid pipeline (Rules + Groq LLM)...');
    try {
        const llmResult = await queryGroq(userState, context, gap, agentCtx);
        if (llmResult) {
            directive = mergeWithLLM(directive, llmResult);
            console.log('[Orchestrator] ✅ Hybrid directive generated (rules + LLM)');
        } else {
            console.log('[Orchestrator] ⚠️ LLM returned null — using rules only');
        }
    } catch (err) {
        console.warn('[Orchestrator] ⚠️ LLM call failed — falling back to rules:', err);
    }

    return directive;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Directive Builder (Rule-Based)
// ═══════════════════════════════════════════════════════════════════════════════

function buildDirective(
    state: UserState,
    context: ContextState,
    gap: BehavioralGapScore,
    strategy: InterventionStrategy,
    moduleMessages: { dashboard: string; focus: string; meditation: string; health: string },
): PersonalizationDirective {
    return {
        contextState: context,
        behavioralGap: gap,
        strategy,
        strictness: strategy.strictness,
        tone: strategy.tone,
        recommendedFocus: selectFocusRecommendation(state, context, strategy),
        recoveryFlag: shouldFlagRecovery(context, state),
        recoveryAction: selectRecoveryAction(context, state),
        meditationType: selectMeditationType(context, state, gap),
        meditationDuration: selectMeditationDuration(context, state),
        plannerAdjustment: selectPlannerAdjustment(context, gap),
        habitFocus: selectHabitFocus(state, gap),
        moduleMessages,
        nudge: generateNudge(context, gap, strategy, state),
        rationale: strategy.rationale,
        generatedAt: Date.now(),
        source: 'rules',
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Module-Specific Recommendations
// ═══════════════════════════════════════════════════════════════════════════════

function selectFocusRecommendation(
    state: UserState,
    context: ContextState,
    strategy: InterventionStrategy,
): PersonalizationDirective['recommendedFocus'] {
    switch (context.mode) {
        case 'overloaded':
        case 'cognitively-fatigued':
            return { sessionLength: 0, type: 'skip', reason: 'Cognitive readiness too low — recover first' };

        case 'emotionally-reactive':
            return { sessionLength: 10, type: 'light-task', reason: 'Keep it light until stress subsides' };

        case 'recovering':
            return { sessionLength: 15, type: 'light-task', reason: 'Easy session to maintain momentum' };

        case 'performance-ready':
            const baseLength = 25 + state.semiDynamic.habitStreak * 2;
            return {
                sessionLength: Math.min(baseLength, 60),
                type: 'deep-work',
                reason: `Peak state — push for ${Math.min(baseLength, 60)} min deep work`,
            };

        case 'opportunity-window':
            return { sessionLength: 25, type: 'training', reason: 'Good window for cognitive training' };

        case 'drifting':
            return { sessionLength: 15, type: 'training', reason: 'Short session to rebuild focus habit' };

        default: // maintenance
            return { sessionLength: 25, type: 'deep-work', reason: 'Standard focus session' };
    }
}

function shouldFlagRecovery(context: ContextState, state: UserState): boolean {
    return (
        context.mode === 'overloaded' ||
        context.mode === 'cognitively-fatigued' ||
        context.mode === 'recovering' ||
        state.dynamic.fatigueLevel >= 4 ||
        state.dynamic.stressLevel >= 4
    );
}

function selectRecoveryAction(
    context: ContextState,
    state: UserState,
): RecoveryStyle | undefined {
    if (!shouldFlagRecovery(context, state)) return undefined;

    if (state.dynamic.stressLevel >= 4) return 'breathing';
    if (state.dynamic.fatigueLevel >= 4) return 'meditation';
    if (state.static.emotionalReactivity > 0.6) return 'reflection';
    if (state.static.extraversion > 5) return 'walk';
    return 'breathing';
}

function selectMeditationType(
    context: ContextState,
    state: UserState,
    gap: BehavioralGapScore,
): MeditationType {
    // High stress → breathing
    if (state.dynamic.stressLevel >= 4) return 'breathing';

    // Fatigued → yoga-nidra for recovery
    if (context.mode === 'cognitively-fatigued' || context.mode === 'overloaded') return 'yoga-nidra';

    // Emotionally reactive → body-scan for grounding
    if (context.mode === 'emotionally-reactive') return 'body-scan';

    // Performance ready → mindfulness for sharpening
    if (context.mode === 'performance-ready') return 'mindfulness';

    // Gap is high → breathing to reset
    if (gap.level === 'high' || gap.level === 'critical') return 'breathing';

    // Default
    return 'mindfulness';
}

function selectMeditationDuration(context: ContextState, state: UserState): number {
    if (context.mode === 'overloaded') return 5;
    if (context.mode === 'cognitively-fatigued') return 10;
    if (context.mode === 'performance-ready') return 15;

    // Scale with experience
    const sessions = state.semiDynamic.totalSessionCount;
    if (sessions > 20) return 15;
    if (sessions > 5) return 10;
    return 5;
}

function selectPlannerAdjustment(
    context: ContextState,
    gap: BehavioralGapScore,
): PersonalizationDirective['plannerAdjustment'] {
    if (context.mode === 'overloaded') return 'reduce-load';
    if (context.mode === 'cognitively-fatigued') return 'delay';
    if (gap.level === 'critical' && gap.breakdown.sessionSkipRate > 0.5) return 'reschedule';
    return 'proceed';
}

function selectHabitFocus(state: UserState, gap: BehavioralGapScore): string {
    if (state.behavioral.daysSinceLastFocus >= 3) return 'Re-establish daily focus habit';
    if (gap.breakdown.recoveryNeglect > 0.5) return 'Build a recovery routine after intense work';
    if (gap.breakdown.distractionDeviation > 0.5) return 'Reduce distraction triggers with pre-focus rituals';
    if (state.semiDynamic.habitStreak >= 7) return 'Extend focus session length for progressive growth';
    if (state.semiDynamic.habitStreak === 0) return 'Start a 1-day streak with any focus session';
    return `Maintain your ${state.semiDynamic.habitStreak}-day streak`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nudge Generation
// ═══════════════════════════════════════════════════════════════════════════════

export function generateNudge(
    context: ContextState,
    gap: BehavioralGapScore,
    strategy: InterventionStrategy,
    state: UserState,
): NudgePayload | undefined {
    // Always generate nudge (even for low gap) so we can test popups
    // In production, uncomment the fatigue gate below:
    // if (state.behavioral.interventionFatigue > 0.8) return undefined;

    const { title, message, icon } = getNudgeContent(context, gap, strategy, state);

    const actions: NudgeAction[] = [];

    switch (strategy.type) {
        case 'recovery-first':
            actions.push(
                { label: 'Start Recovery', action: 'navigate', target: 'Meditate', isPrimary: true },
                { label: 'Later', action: 'snooze', isPrimary: false },
            );
            break;

        case 'enforcing':
            actions.push(
                { label: 'Start Focus', action: 'navigate', target: 'FocusSession', isPrimary: true },
                { label: 'Not Now', action: 'dismiss', isPrimary: false },
            );
            break;

        case 'opportunity-driven':
            actions.push(
                { label: "Let's Go!", action: 'navigate', target: 'Training', isPrimary: true },
                { label: 'Remind Later', action: 'snooze', isPrimary: false },
            );
            break;

        case 'reflective':
            actions.push(
                { label: 'Reflect', action: 'accept', isPrimary: true },
                { label: 'Skip', action: 'dismiss', isPrimary: false },
            );
            break;

        default: // supportive
            actions.push(
                { label: 'OK', action: 'accept', isPrimary: true },
                { label: 'Later', action: 'snooze', isPrimary: false },
            );
    }

    const priority = gap.level === 'critical' ? 'urgent'
        : gap.level === 'high' ? 'high'
            : gap.level === 'moderate' ? 'medium'
                : 'low';

    return {
        id: `nudge_${Date.now()}`,
        title,
        message,
        tone: strategy.tone,
        icon,
        actions,
        priority,
        contextMode: context.mode,
    };
}

function getNudgeContent(
    context: ContextState,
    gap: BehavioralGapScore,
    strategy: InterventionStrategy,
    state: UserState,
): { title: string; message: string; icon: string } {
    switch (context.mode) {
        case 'overloaded':
            return {
                icon: '🛑',
                title: 'Time to Recharge',
                message: 'Your stress and fatigue are both high. A short breathing session will help you reset.',
            };

        case 'cognitively-fatigued':
            return {
                icon: '😴',
                title: 'Low on Energy',
                message: 'Your cognitive readiness is low right now. Try a short meditation or take a break.',
            };

        case 'emotionally-reactive':
            return {
                icon: '🌊',
                title: 'Take a Breath',
                message: 'You seem stressed. A body scan or breathing exercise can help ground you.',
            };

        case 'drifting':
            return {
                icon: '🧭',
                title: state.static.selfEfficacy > 0.5
                    ? 'You Can Do This'
                    : 'Small Step Forward',
                message: gap.primaryTension,
            };

        case 'performance-ready':
            return {
                icon: '🚀',
                title: 'Peak Mode',
                message: "You're in great shape today. Perfect time for a challenging focus session!",
            };

        case 'opportunity-window':
            return {
                icon: '🌟',
                title: 'Opportunity',
                message: `Your readiness is up and you've only done ${state.semiDynamic.weeklyFocusMinutes} min this week. Let's build some momentum!`,
            };

        case 'recovering':
            return {
                icon: '🌿',
                title: 'Recovery Time',
                message: 'Nice work on your last session. Take it easy before the next one.',
            };

        default:
            return {
                icon: '✨',
                title: 'Stay on Track',
                message: selectHabitFocus(state, gap),
            };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LLM Merge — Enhances rule-based directive with LLM insights
// ═══════════════════════════════════════════════════════════════════════════════

function mergeWithLLM(
    ruleDirective: PersonalizationDirective,
    llmResult: GroqResponse,
): PersonalizationDirective {
    const merged = { ...ruleDirective, source: 'hybrid' as const };

    // LLM enriches nudge message and title with personality-calibrated language
    if (merged.nudge) {
        if (llmResult.nudgeMessage) {
            merged.nudge = {
                ...merged.nudge,
                message: llmResult.nudgeMessage,
            };
        }
        if (llmResult.nudgeTitle) {
            merged.nudge = {
                ...merged.nudge,
                title: llmResult.nudgeTitle,
            };
        }
    }

    // ── LLM MODULE MESSAGES — overwrite rule-based messages with taunts ──
    merged.moduleMessages = {
        dashboard: llmResult.dashboardMessage || merged.moduleMessages.dashboard,
        focus: llmResult.focusMessage || merged.moduleMessages.focus,
        meditation: llmResult.meditationMessage || merged.moduleMessages.meditation,
        health: llmResult.healthMessage || merged.moduleMessages.health,
    };

    // LLM can suggest meditation type (validated against known types)
    if (llmResult.meditationSuggestion) {
        const validTypes = ['mindfulness', 'body-scan', 'breathing', 'yoga-nidra'];
        if (validTypes.includes(llmResult.meditationSuggestion)) {
            merged.meditationType = llmResult.meditationSuggestion as any;
        }
    }

    // LLM provides richer rationale
    if (llmResult.rationale) {
        merged.rationale = `[AI] ${llmResult.rationale} | [Rules] ${ruleDirective.rationale}`;
    }

    // LLM focus recommendation enriches the reason field
    if (llmResult.focusRecommendation) {
        merged.recommendedFocus = {
            ...merged.recommendedFocus,
            reason: llmResult.focusRecommendation,
        };
    }

    return merged;
}
