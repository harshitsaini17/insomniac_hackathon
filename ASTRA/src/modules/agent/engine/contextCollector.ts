// ─────────────────────────────────────────────────────────────────────────────
// AGENTIC CONTEXT COLLECTOR
// Self-collects real user data from ALL Zustand stores.
// No more null placeholders. The agent reads its own context.
// ─────────────────────────────────────────────────────────────────────────────

import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { usePersonalizationStore } from '../../personalization/store/personalizationStore';
import { useHealthStore } from '../../health/store/health-store';
import { useMeditationStore } from '../../meditation/store/meditation-store';
import { useFocusStore } from '../../focusTrainer/store/focusStore';

import type { UserProfile } from '../../onboarding/models/onboardingTypes';
import type { PersonalizationState } from '../../personalization/models/personalizationTypes';
import type { HealthDayRecord } from '../../shared/types';

// ═══════════════════════════════════════════════════════════════════════════════
// Agent Context — everything the orchestrator needs, self-collected
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentContext {
    // From Onboarding
    profile: UserProfile | null;

    // From Personalization
    personalization: PersonalizationState | null;

    // From Health
    healthRecord: HealthDayRecord | null;
    healthFlags: string[];
    cognitiveReadiness: number;
    stressLevel: number;
    fatigueLevel: number;
    sleepHours: number;

    // From Meditation
    meditationSessionCount: number;
    meditationTotalMinutes: number;
    meditationAvgRating: number;
    mss: number;
    lastMeditationType: string | null;

    // From Focus
    currentAFI: number;
    currentCRS: number;
    activeGoalName: string | null;
    completedSessionsToday: number;
    distractiveAppNames: string[];
    isInFocusSession: boolean;
    habitStreak: number;
    complianceRate: number;
    distractionRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECT — Reads from all stores at call-time (no React hooks needed)
// Uses Zustand's getState() for non-React access
// ═══════════════════════════════════════════════════════════════════════════════

export function collectAgentContext(): AgentContext {
    // ── Onboarding ───────────────────────────────────────────────────────
    const onboardingState = useOnboardingStore.getState();
    const profile = onboardingState.profile;

    // ── Personalization ──────────────────────────────────────────────────
    const personalState = usePersonalizationStore.getState();
    const personalization = personalState.state;

    // Extract compliance and habit data
    const complianceRate = personalization?.strictness?.complianceRate ?? 0.5;
    const habitStreak = personalization?.habits?.currentStreak ?? 0;
    const distractionRate = 1 - (personalization?.attention?.successRate ?? 0.5);

    // ── Health ────────────────────────────────────────────────────────────
    const healthStore = useHealthStore.getState();
    const healthRecord = healthStore.getLatestRecord();
    const healthFlags = healthRecord?.flags?.map(f => f.id ?? f.type ?? String(f)) ?? [];
    const cognitiveReadiness = healthRecord?.computed?.CognitiveReadiness ?? 50;
    const stressLevel = healthRecord?.input?.stress_level ?? 2;
    const fatigueLevel = healthRecord?.input?.fatigue_level ?? 2;
    const sleepHours = healthRecord?.input?.sleep_hours ?? 7;

    // ── Meditation ───────────────────────────────────────────────────────
    const meditationStore = useMeditationStore.getState();
    const meditationSessionCount = meditationStore.getSessionCount();
    const meditationTotalMinutes = meditationStore.getTotalMinutes();
    const meditationAvgRating = meditationStore.getAverageRating() || 3;
    const latestMedOutput = meditationStore.getLatestMeditationOutput?.();
    const mss = latestMedOutput?.MSS ?? 50;
    const lastMeditationType = latestMedOutput?.recommended_type ?? null;

    // ── Focus ─────────────────────────────────────────────────────────────
    const focusState = useFocusStore.getState();
    const currentAFI = focusState.currentAFI?.score ?? 0.5;
    const currentCRS = focusState.currentCRS?.score ?? 0.5;
    const activeGoalName = focusState.activeGoal?.title ?? null;
    const completedSessionsToday = focusState.completedSessionsToday;
    const distractiveAppNames = focusState.distractiveApps
        ?.slice(0, 5)
        .map(a => a.appName) ?? [];
    const isInFocusSession = focusState.isInFocusSession;

    console.log('[ContextCollector] ✅ Self-collected context from all stores:', {
        hasProfile: !!profile,
        hasPersonalization: !!personalization,
        hasHealth: !!healthRecord,
        meditationSessions: meditationSessionCount,
        afi: currentAFI.toFixed(2),
        stress: stressLevel,
        fatigue: fatigueLevel,
        compliance: (complianceRate * 100).toFixed(0) + '%',
        habitStreak,
        distractiveApps: distractiveAppNames.length,
    });

    return {
        profile,
        personalization,
        healthRecord,
        healthFlags,
        cognitiveReadiness,
        stressLevel,
        fatigueLevel,
        sleepHours,
        meditationSessionCount,
        meditationTotalMinutes,
        meditationAvgRating,
        mss,
        lastMeditationType,
        currentAFI,
        currentCRS,
        activeGoalName,
        completedSessionsToday,
        distractiveAppNames,
        isInFocusSession,
        habitStreak,
        complianceRate,
        distractionRate,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Module-Specific Message Generation (Rule-Based)
// These are the rule-based "first pass" messages for each module.
// The LLM then overwrites them with personality-calibrated versions.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ModuleMessages {
    dashboard: string;
    focus: string;
    meditation: string;
    health: string;
}

export function generateModuleMessages(ctx: AgentContext): ModuleMessages {
    return {
        dashboard: generateDashboardMessage(ctx),
        focus: generateFocusMessage(ctx),
        meditation: generateMeditationMessage(ctx),
        health: generateHealthMessage(ctx),
    };
}

function generateDashboardMessage(ctx: AgentContext): string {
    const parts: string[] = [];

    if (ctx.habitStreak === 0) {
        parts.push('No streak. You haven\'t even started.');
    } else if (ctx.habitStreak < 3) {
        parts.push(`${ctx.habitStreak}-day streak — barely a start.`);
    } else {
        parts.push(`${ctx.habitStreak}-day streak — don't ruin it.`);
    }

    if (ctx.complianceRate < 0.3) {
        parts.push(`Compliance at ${(ctx.complianceRate * 100).toFixed(0)}%. You're ignoring your own commitments.`);
    }

    if (ctx.distractiveAppNames.length > 0) {
        parts.push(`Wasting time on: ${ctx.distractiveAppNames.join(', ')}.`);
    }

    return parts.join(' ') || 'Keep pushing forward.';
}

function generateFocusMessage(ctx: AgentContext): string {
    if (ctx.completedSessionsToday === 0) {
        const days = ctx.habitStreak === 0 ? 'You have no streak. ' : '';
        return `${days}Zero focus sessions today. Your distraction rate is ${(ctx.distractionRate * 100).toFixed(0)}%. What's your excuse?`;
    }
    if (ctx.distractionRate > 0.5) {
        return `${ctx.completedSessionsToday} sessions but ${(ctx.distractionRate * 100).toFixed(0)}% distraction rate. Are you even trying?`;
    }
    if (ctx.currentAFI > 0.6) {
        return `Your attention is heavily fragmented (${(ctx.currentAFI * 100).toFixed(0)}%). Stop switching between apps and actually focus.`;
    }
    return `${ctx.completedSessionsToday} sessions done. ${ctx.activeGoalName ? `Goal: "${ctx.activeGoalName}" needs more effort.` : 'Set a real goal.'}`;
}

function generateMeditationMessage(ctx: AgentContext): string {
    if (ctx.meditationSessionCount === 0) {
        return `Zero meditation sessions ever. Your stress is ${ctx.stressLevel}/5 and you're doing nothing about it.`;
    }
    if (ctx.meditationTotalMinutes < 10) {
        return `Only ${ctx.meditationTotalMinutes} minutes of meditation total. That's barely anything. Stress: ${ctx.stressLevel}/5.`;
    }
    if (ctx.stressLevel >= 4 && ctx.meditationSessionCount < 3) {
        return `Stress at ${ctx.stressLevel}/5 but only ${ctx.meditationSessionCount} meditation sessions. You know what you need to do.`;
    }
    return `${ctx.meditationSessionCount} sessions, ${ctx.meditationTotalMinutes} min total. Avg rating: ${ctx.meditationAvgRating.toFixed(1)}/5. ${ctx.stressLevel >= 3 ? 'Your stress says you need more.' : 'Keep it up.'}`;
}

function generateHealthMessage(ctx: AgentContext): string {
    const warnings: string[] = [];

    if (ctx.sleepHours < 6) {
        warnings.push(`${ctx.sleepHours}h sleep — you're sabotaging yourself.`);
    }
    if (ctx.stressLevel >= 4) {
        warnings.push(`Stress at ${ctx.stressLevel}/5 — this is unsustainable.`);
    }
    if (ctx.fatigueLevel >= 4) {
        warnings.push(`Fatigue at ${ctx.fatigueLevel}/5 — your body is screaming for rest.`);
    }
    if (ctx.cognitiveReadiness < 40) {
        warnings.push(`Cognitive readiness at ${ctx.cognitiveReadiness.toFixed(0)}%. Your brain is barely functional.`);
    }
    if (ctx.healthFlags.length > 0) {
        warnings.push(`Health flags: ${ctx.healthFlags.slice(0, 3).join(', ')}.`);
    }

    return warnings.length > 0
        ? warnings.join(' ')
        : `Readiness at ${ctx.cognitiveReadiness.toFixed(0)}%, sleep ${ctx.sleepHours}h. Acceptable — but don't get complacent.`;
}
