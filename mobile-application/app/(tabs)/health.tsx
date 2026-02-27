import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MetricCard } from '@/components/health/MetricCard';
import { RecommendationCard } from '@/components/health/RecommendationCard';
import { useHealthStore } from '@/store/health-store';
import { useUserStore } from '@/store/user-store';
import { useFocusStore } from '@/store/focus-store';
import { useMeditationStore } from '@/store/meditation-store';
import { evaluateRules } from '@/engine/rule-engine';
import { healthRules } from '@/engine/health-rules';
import type { RuleContext, HealthSnapshot } from '@/types';

const DEFAULT_HEALTH: HealthSnapshot = {
    date: new Date().toISOString().slice(0, 10),
    steps: 4200,
    sleepHours: 6.5,
    sedentaryMinutes: 90,
    hydrationGlasses: 3,
};

export default function HealthScreen() {
    const snapshot = useHealthStore((s) => s.getLatestSnapshot()) ?? DEFAULT_HEALTH;
    const profile = useUserStore((s) => s.profile);
    const focusSessions = useFocusStore((s) => s.sessions);
    const meditationSessions = useMeditationStore((s) => s.sessions);

    const recommendations = useMemo(() => {
        const ctx: RuleContext = {
            user: profile,
            health: snapshot,
            focusSessions,
            meditationSessions,
        };
        return evaluateRules(healthRules, ctx);
    }, [profile, snapshot, focusSessions, meditationSessions]);

    const sleepStatus =
        snapshot.sleepHours >= 7 ? 'good' : snapshot.sleepHours >= 6 ? 'warn' : 'bad';
    const stepsStatus = snapshot.steps >= 6000 ? 'good' : snapshot.steps >= 3000 ? 'warn' : 'bad';
    const hydrationStatus =
        snapshot.hydrationGlasses >= 6 ? 'good' : snapshot.hydrationGlasses >= 4 ? 'warn' : 'bad';
    const hrvStatus =
        snapshot.hrv === undefined ? undefined : snapshot.hrv >= 50 ? 'good' : snapshot.hrv >= 40 ? 'warn' : 'bad';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
                <View style={styles.metricsRow}>
                    <MetricCard
                        icon="👟"
                        label="Steps"
                        value={snapshot.steps.toLocaleString()}
                        status={stepsStatus as any}
                    />
                    <View style={{ width: 10 }} />
                    <MetricCard
                        icon="🌙"
                        label="Sleep"
                        value={String(snapshot.sleepHours)}
                        unit="hrs"
                        status={sleepStatus as any}
                    />
                </View>
                <View style={styles.metricsRow}>
                    <MetricCard
                        icon="💧"
                        label="Hydration"
                        value={String(snapshot.hydrationGlasses)}
                        unit="glasses"
                        status={hydrationStatus as any}
                    />
                    <View style={{ width: 10 }} />
                    <MetricCard
                        icon="💓"
                        label="HRV"
                        value={snapshot.hrv !== undefined ? String(snapshot.hrv) : '—'}
                        unit={snapshot.hrv !== undefined ? 'ms' : ''}
                        status={hrvStatus as any}
                    />
                </View>
            </View>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                    <View style={styles.recList}>
                        {recommendations.map((rec) => (
                            <RecommendationCard key={rec.id} recommendation={rec} />
                        ))}
                    </View>
                </View>
            )}

            {recommendations.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>✓</Text>
                    <Text style={styles.emptyText}>All looking good today</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    metricsGrid: {
        gap: 10,
        marginBottom: 24,
    },
    metricsRow: {
        flexDirection: 'row',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    recList: {
        gap: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 36,
        color: '#2D8A4E',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});
