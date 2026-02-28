import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useHealthStore } from '@/store/health-store';
import { getHydrationTarget } from '@/engine/health-normalizers';
import { RULE_LOW_HYDRATION_RATIO } from '@/constants/health-constants';

// Components
import { CognitiveReadinessGauge } from '@/components/health/CognitiveReadinessGauge';
import { FlagChips } from '@/components/health/FlagChips';
import { ReadinessTrendChart } from '@/components/health/ReadinessTrendChart';
import { SleepChart } from '@/components/health/SleepChart';
import { HRVChart } from '@/components/health/HRVChart';
import { HydrationRing } from '@/components/health/HydrationRing';
import { ExerciseScatter } from '@/components/health/ExerciseScatter';
import { AttentionRecommendation } from '@/components/health/AttentionRecommendation';
import { WeeklySummary } from '@/components/health/WeeklySummary';
import { DailyInputForm } from '@/components/health/DailyInputForm';
import { RecommendationCard } from '@/components/health/RecommendationCard';

import type { DailyHealthInput } from '@/types';

export default function HealthScreen() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const addDailyInput = useHealthStore((s) => s.addDailyInput);
    const latestRecord = useHealthStore((s) => s.getLatestRecord());
    const last7 = useHealthStore((s) => s.getRecordsForDays(7));
    const last14 = useHealthStore((s) => s.getRecordsForDays(14));

    const today = new Date().toISOString().slice(0, 10);
    const hasToday = latestRecord?.input.date === today;

    const handleSubmit = (input: DailyHealthInput) => {
        addDailyInput(input);
    };

    // Hydration data
    const hydrationTarget = latestRecord
        ? getHydrationTarget(latestRecord.input.weight_kg)
        : 2000;
    const currentWater = latestRecord?.input.water_ml ?? 0;
    const isHydrationLow =
        currentWater < RULE_LOW_HYDRATION_RATIO * hydrationTarget;

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Cognitive Readiness Gauge */}
                {latestRecord ? (
                    <CognitiveReadinessGauge
                        score={latestRecord.computed.CognitiveReadiness}
                        attention={latestRecord.computed.AttentionCapacity}
                        date={latestRecord.input.date}
                    />
                ) : (
                    <View style={styles.emptyGauge}>
                        <Text style={styles.emptyTitle}>No Health Data Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap the button below to log your first day
                        </Text>
                    </View>
                )}

                {/* Flag Chips */}
                {latestRecord && <FlagChips flags={latestRecord.flags} />}

                {/* Recommendations */}
                {latestRecord && latestRecord.recommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Actions</Text>
                        <View style={styles.recList}>
                            {latestRecord.recommendations.slice(0, 3).map((rec) => (
                                <RecommendationCard key={rec.id} recommendation={rec} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Card 1: 7-day Readiness Trend */}
                <ReadinessTrendChart records={last7} />

                {/* Card 2: Sleep + HRV row */}
                <View style={styles.twoCol}>
                    <SleepChart records={last7} />
                    <View style={{ width: 10 }} />
                    <HRVChart records={last7} />
                </View>

                {/* Card 3: Hydration Ring */}
                <HydrationRing
                    currentMl={currentWater}
                    targetMl={hydrationTarget}
                    isLow={isHydrationLow}
                />

                {/* Card 4: Exercise Scatter */}
                <ExerciseScatter records={last14} />

                {/* Card 5: Attention Recommendation */}
                {latestRecord && (
                    <AttentionRecommendation
                        attention={latestRecord.computed.AttentionCapacity}
                        onStartSession={() => {
                            if (latestRecord.computed.AttentionCapacity.level === 'recovery') {
                                router.push('/meditate/session?type=yoga-nidra' as any);
                            } else {
                                router.push('/train/session?type=attention' as any);
                            }
                        }}
                    />
                )}

                {/* 7-day Summary */}
                <WeeklySummary records={last7} />
            </ScrollView>

            {/* FAB: Log Today */}
            <Pressable
                style={styles.fab}
                onPress={() => setShowForm(true)}
            >
                <Text style={styles.fabText}>
                    {hasToday ? '✏️ Update Today' : '＋ Log Today'}
                </Text>
            </Pressable>

            {/* Daily Input Form Modal */}
            <DailyInputForm
                visible={showForm}
                onClose={() => setShowForm(false)}
                onSubmit={handleSubmit}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    emptyGauge: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 32,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 16,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    recList: {
        gap: 8,
    },
    twoCol: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        left: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
