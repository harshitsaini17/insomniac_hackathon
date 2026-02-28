/**
 * ASTRA Health Module — Zustand Store
 * Persists daily entries + computed scores via AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, generateId } from './storage';
import type {
    DailyHealthInput,
    ComputedHealthScores,
    HealthDayRecord,
    Recommendation,
    HealthFlag,
    AttentionCapacity,
    RuleContext,
} from '@/types';
import { computeDayScores, mapReadinessToAttention } from '@/engine/health-scores';
import { runHealthRules } from '@/engine/health-rules';
import { clamp } from '@/engine/health-normalizers';
import {
    computeRollingAverage,
    detectTrend,
    checkChronicLow,
    getRecentRecords,
} from '@/engine/health-trends';
import { useUserStore } from './user-store';

interface HealthState {
    records: HealthDayRecord[];

    /** Add or update a daily input → recompute scores & rules. */
    addDailyInput: (input: DailyHealthInput) => void;

    /** Get the latest day record. */
    getLatestRecord: () => HealthDayRecord | null;

    /** Get records for the last N days. */
    getRecordsForDays: (days: number) => HealthDayRecord[];

    /** Get latest health output for Focus Trainer consumption. */
    getLatestHealthOutput: () => {
        CognitiveReadiness: number;
        AttentionCapacity: AttentionCapacity;
        flags: HealthFlag[];
    } | null;

    /** Get rolling averages for a field. */
    getRollingAvg: (field: string, days: number) => number | null;
}

export const useHealthStore = create<HealthState>()(
    persist(
        (set, get) => ({
            records: [],

            addDailyInput: (input: DailyHealthInput) => {
                // 1. Compute scores
                let computed = computeDayScores(input);

                // 2. Build rule context
                const profile = useUserStore.getState().profile;
                const existingRecords = get().records;
                const ctx: RuleContext = {
                    user: profile,
                    health: input,
                    healthRecords: existingRecords,
                    focusSessions: [],
                    meditationSessions: [],
                };

                // 3. Run rules
                const ruleResult = runHealthRules(ctx, computed);

                // 4. Apply readiness boost
                if (ruleResult.readinessBoost) {
                    const boosted = clamp(
                        computed.CognitiveReadiness + ruleResult.readinessBoost,
                        0,
                        100
                    );
                    computed = {
                        ...computed,
                        CognitiveReadiness: boosted,
                        AttentionCapacity: mapReadinessToAttention(boosted),
                    };
                }

                // 5. Apply attention override
                if (ruleResult.attentionOverride) {
                    const overrideAttention = mapReadinessToAttention(
                        ruleResult.attentionOverride === 'recovery'
                            ? 0
                            : ruleResult.attentionOverride === 'light'
                                ? 40
                                : ruleResult.attentionOverride === 'moderate'
                                    ? 60
                                    : 80
                    );
                    computed = {
                        ...computed,
                        AttentionCapacity: overrideAttention,
                    };
                }

                const record: HealthDayRecord = {
                    input,
                    computed,
                    flags: ruleResult.flags,
                    recommendations: ruleResult.recommendations,
                };

                // 6. Upsert by date
                set((s) => {
                    const idx = s.records.findIndex(
                        (r) => r.input.date === input.date
                    );
                    if (idx >= 0) {
                        const updated = [...s.records];
                        updated[idx] = record;
                        return { records: updated };
                    }
                    return { records: [...s.records, record] };
                });
            },

            getLatestRecord: () => {
                const recs = get().records;
                if (recs.length === 0) return null;
                return recs.reduce((latest, r) =>
                    r.input.date > latest.input.date ? r : latest
                );
            },

            getRecordsForDays: (days: number) => {
                return getRecentRecords(get().records, days);
            },

            getLatestHealthOutput: () => {
                const latest = get().getLatestRecord();
                if (!latest) return null;
                return {
                    CognitiveReadiness: latest.computed.CognitiveReadiness,
                    AttentionCapacity: latest.computed.AttentionCapacity,
                    flags: latest.flags,
                };
            },

            getRollingAvg: (field: string, days: number) => {
                return computeRollingAverage(get().records, field, days);
            },
        }),
        {
            name: 'astra-health',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);
