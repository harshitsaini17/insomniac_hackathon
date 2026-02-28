// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Behavioral Orchestrator — Core Types
// The agentic layer that unifies all modules into personalized directives
// ─────────────────────────────────────────────────────────────────────────────

import type { MeditationType, MeditationIntent, ComputedHealthScores, AttentionCapacity } from '../../shared/types';
import type { NudgeTone, GoalCategory, MotivationType } from '../../onboarding/models/onboardingTypes';
import type { InterventionType, StrictnessLevel, RecoveryStyle } from '../../personalization/models/personalizationTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 1 — UserState (Unified Snapshot)
// ═══════════════════════════════════════════════════════════════════════════════

/** Static personality traits — rarely change after onboarding */
export interface StaticTraits {
    conscientiousness: number;    // 1–7
    neuroticism: number;          // 1–7
    openness: number;             // 1–7
    agreeableness: number;        // 1–7
    extraversion: number;         // 1–7
    impulsivityIndex: number;     // 0–1
    authorityResistance: number;  // 0–1
    selfEfficacy: number;         // 0–1
    emotionalReactivity: number;  // 0–1
    motivationType: MotivationType;
    goalCategory: GoalCategory;
    nudgeTone: NudgeTone;
}

/** Semi-dynamic signals — change over days/weeks */
export interface SemiDynamicSignals {
    goalUrgency: number;          // 0–1
    habitStreak: number;          // consecutive focus days
    habitStrength: number;        // 0–1 (streak / target)
    attentionTrend: 'improving' | 'declining' | 'stable';
    complianceTrend: 'improving' | 'declining' | 'stable';
    weeklyFocusMinutes: number;   // total this week
    totalSessionCount: number;
    averageMeditationRating: number; // 1–5
}

/** Dynamic signals — change throughout the day */
export interface DynamicSignals {
    cognitiveReadiness: number;   // 0–1 from CRS
    meditationSuitability: number; // 0–100 MSS
    hrvState: number;             // raw RMSSD ms, -1 if unavailable
    hrvNormalized: number;        // 0–1
    stressLevel: number;          // 1–5
    fatigueLevel: number;         // 1–5
    sleepHours: number;
    sleepQuality: number;         // 1–5
    attentionCapacity: AttentionCapacity;
    currentAFI: number;           // 0–1 attention fragmentation
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    hourOfDay: number;
}

/** Behavioral signals — derived from user actions */
export interface BehavioralSignals {
    distractionRate: number;      // 0–1 (from AFI)
    complianceRate: number;       // 0–1 (recent)
    overrideFrequency: number;    // 0–1 (how often user overrides blocks)
    sessionSurvivalRate: number;  // 0–1 (% of sessions completed)
    nudgeDismissRate: number;     // 0–1
    consecutiveDismissals: number;
    interventionFatigue: number;  // 0–1
    lastSessionWasSuccessful: boolean;
    daysSinceLastFocus: number;
}

/** Unified state snapshot — the complete picture */
export interface UserState {
    timestamp: number;
    static: StaticTraits;
    semiDynamic: SemiDynamicSignals;
    dynamic: DynamicSignals;
    behavioral: BehavioralSignals;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 2 — ContextState (Day-Type Inference)
// ═══════════════════════════════════════════════════════════════════════════════

export type ContextMode =
    | 'performance-ready'     // CRS high, sleep good, low fatigue
    | 'maintenance'           // average state, normal day
    | 'cognitively-fatigued'  // CRS low, high fatigue
    | 'emotionally-reactive'  // high stress + high neuroticism
    | 'overloaded'            // fatigue + stress both high
    | 'drifting'              // low compliance + rising distraction
    | 'recovering'            // post-session or CRS recovering
    | 'opportunity-window';   // CRS high + no sessions yet

export interface ContextState {
    mode: ContextMode;
    confidence: number;           // 0–1, how certain the inference is
    signals: string[];            // human-readable reasons
    secondaryMode?: ContextMode;  // possible alternative
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 3 — BehavioralGapScore (Tension Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

export interface BehavioralGapScore {
    overall: number;              // 0–1 (0 = aligned, 1 = maximum tension)
    level: 'low' | 'moderate' | 'high' | 'critical';
    breakdown: {
        goalVsFocus: number;      // urgency vs actual focus time
        distractionDeviation: number; // expected vs actual distraction
        complianceGap: number;    // expected vs actual compliance
        sessionSkipRate: number;  // missed sessions
        recoveryNeglect: number;  // ignoring recovery signals
    };
    primaryTension: string;       // human-readable main issue
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 4 — Intervention Strategy
// ═══════════════════════════════════════════════════════════════════════════════

export type StrategyType =
    | 'reflective'         // gentle awareness nudge
    | 'supportive'         // encouraging, warm
    | 'enforcing'          // firm, accountability-focused
    | 'recovery-first'     // prioritize rest & recovery
    | 'opportunity-driven'; // capitalize on good state

export interface InterventionStrategy {
    type: StrategyType;
    tone: NudgeTone;
    strictness: StrictnessLevel;
    timing: 'immediate' | 'delayed' | 'scheduled';
    modality: InterventionType;
    rationale: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 5 — PersonalizationDirective (Final Output)
// ═══════════════════════════════════════════════════════════════════════════════

export interface PersonalizationDirective {
    // Context
    contextState: ContextState;
    behavioralGap: BehavioralGapScore;

    // Strategy
    strategy: InterventionStrategy;
    strictness: StrictnessLevel;
    tone: NudgeTone;

    // Module-specific recommendations
    recommendedFocus: {
        sessionLength: number;     // minutes
        type: 'deep-work' | 'light-task' | 'training' | 'skip';
        reason: string;
    };
    recoveryFlag: boolean;
    recoveryAction?: RecoveryStyle;
    meditationType: MeditationType;
    meditationDuration: number;    // minutes
    plannerAdjustment: 'proceed' | 'delay' | 'reduce-load' | 'reschedule';
    habitFocus: string;            // what habit to reinforce today

    // Module-specific personalized messages (taunting, context-aware)
    moduleMessages: {
        dashboard: string;
        focus: string;
        meditation: string;
        health: string;
    };

    // Nudge
    nudge?: NudgePayload;

    // Meta
    rationale: string;             // human-readable explanation
    generatedAt: number;
    source: 'rules' | 'llm' | 'hybrid';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Nudge Payload
// ═══════════════════════════════════════════════════════════════════════════════

export interface NudgePayload {
    id: string;
    title: string;
    message: string;
    tone: NudgeTone;
    icon: string;                  // emoji
    actions: NudgeAction[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: number;
    contextMode: ContextMode;
}

export interface NudgeAction {
    label: string;
    action: 'accept' | 'snooze' | 'dismiss' | 'navigate';
    target?: string;               // screen name for navigate action
    isPrimary: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LLM Integration Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface LLMRequest {
    userState: UserState;
    contextState: ContextState;
    behavioralGap: BehavioralGapScore;
    systemPrompt: string;
}

export interface LLMResponse {
    directive: Partial<PersonalizationDirective>;
    nudgeMessage?: string;
    rationale: string;
    confidence: number;
}
