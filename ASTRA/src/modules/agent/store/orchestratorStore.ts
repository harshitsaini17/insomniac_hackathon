// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator Store — Zustand State Management
// Exposes the Behavioral Orchestrator to React components
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { PersonalizationDirective, NudgePayload, ContextMode } from '../types/orchestratorTypes';
import type { UserProfile } from '../../onboarding/models/onboardingTypes';
import type { PersonalizationState } from '../../personalization/models/personalizationTypes';
import type { HealthDayRecord } from '../../shared/types';
import { runOrchestrator } from '../engine/orchestrator';

// ═══════════════════════════════════════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════════════════════════════════════

interface OrchestratorStoreState {
    // State
    directive: PersonalizationDirective | null;
    currentNudge: NudgePayload | null;
    contextMode: ContextMode | null;
    isLoading: boolean;
    lastRunAt: number | null;
    nudgeHistory: NudgePayload[];
    error: string | null;

    // Actions
    runOrchestration: (params: OrchestratorParams) => Promise<void>;
    dismissNudge: () => void;
    snoozeNudge: (delayMs?: number) => void;
    acceptNudge: () => void;
    clearDirective: () => void;
    getDirective: () => PersonalizationDirective | null;
    getNudge: () => NudgePayload | null;
}

export interface OrchestratorParams {
    profile: UserProfile | null;
    personalization: PersonalizationState | null;
    healthRecord: HealthDayRecord | null;
    mss: number;
    currentAFI: number;
    meditationSessionCount: number;
    meditationTotalMinutes: number;
    meditationAvgRating: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════════════

const COOLDOWN_MS = 10_000; // 10s cooldown for testing (increase to 60s in production)

export const useOrchestratorStore = create<OrchestratorStoreState>((set, get) => ({
    // Initial state
    directive: null,
    currentNudge: null,
    contextMode: null,
    isLoading: false,
    lastRunAt: null,
    nudgeHistory: [],
    error: null,

    // ── Run the full orchestrator pipeline ───────────────────────────────
    runOrchestration: async (params: OrchestratorParams) => {
        const { lastRunAt, isLoading } = get();

        // Prevent rapid-fire runs
        if (isLoading) return;
        if (lastRunAt && Date.now() - lastRunAt < COOLDOWN_MS) {
            console.log('[Orchestrator] Cooldown active, skipping run');
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const directive = await runOrchestrator(
                params.profile,
                params.personalization,
                params.healthRecord,
                params.mss,
                params.currentAFI,
                params.meditationSessionCount,
                params.meditationTotalMinutes,
                params.meditationAvgRating,
            );

            set({
                directive,
                currentNudge: directive.nudge ?? null,
                contextMode: directive.contextState.mode,
                isLoading: false,
                lastRunAt: Date.now(),
                nudgeHistory: directive.nudge
                    ? [...get().nudgeHistory.slice(-19), directive.nudge]
                    : get().nudgeHistory,
            });
        } catch (err) {
            console.error('[Orchestrator] Pipeline failed:', err);
            set({
                isLoading: false,
                error: err instanceof Error ? err.message : 'Orchestration failed',
            });
        }
    },

    // ── Nudge Interactions ───────────────────────────────────────────────
    dismissNudge: () => {
        set({ currentNudge: null });
    },

    snoozeNudge: (delayMs = 300_000) => {
        const nudge = get().currentNudge;
        if (!nudge) return;

        set({ currentNudge: null });

        // Re-show the nudge after delay
        setTimeout(() => {
            const current = get().currentNudge;
            if (!current) {
                set({ currentNudge: nudge });
            }
        }, delayMs);
    },

    acceptNudge: () => {
        set({ currentNudge: null });
    },

    // ── Getters ──────────────────────────────────────────────────────────
    clearDirective: () => set({ directive: null, currentNudge: null, contextMode: null }),
    getDirective: () => get().directive,
    getNudge: () => get().currentNudge,
}));
