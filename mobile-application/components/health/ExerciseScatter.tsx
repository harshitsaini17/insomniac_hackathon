import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HealthDayRecord } from '@/types';
import { pearsonCorrelation } from '@/engine/health-trends';

interface ExerciseScatterProps {
    records: HealthDayRecord[];
}

export function ExerciseScatter({ records }: ExerciseScatterProps) {
    const last14 = records.slice(-14);

    if (last14.length < 2) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Exercise vs Readiness</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        Need 2+ days of data
                    </Text>
                </View>
            </View>
        );
    }

    const exerciseVals = last14.map((r) => r.input.exercise_minutes);
    const readinessVals = last14.map((r) => r.computed.CognitiveReadiness);
    const r = pearsonCorrelation(exerciseVals, readinessVals);

    const maxExercise = Math.max(...exerciseVals, 60);
    const maxReadiness = 100;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Exercise vs Readiness</Text>
                {r != null && (
                    <Text style={styles.corrText}>r = {r.toFixed(2)}</Text>
                )}
            </View>
            <View style={styles.plotArea}>
                {/* Y-axis (Readiness) */}
                <View style={styles.yAxis}>
                    <Text style={styles.axisLabel}>100</Text>
                    <Text style={styles.axisLabel}>0</Text>
                </View>
                {/* Plot body */}
                <View style={styles.plotBody}>
                    {last14.map((rec, i) => {
                        const xPct =
                            (rec.input.exercise_minutes / maxExercise) * 100;
                        const yPct =
                            (rec.computed.CognitiveReadiness / maxReadiness) *
                            100;
                        return (
                            <View
                                key={rec.input.date}
                                style={[
                                    styles.dot,
                                    {
                                        left: `${Math.min(90, xPct)}%`,
                                        bottom: `${yPct}%`,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
            </View>
            <View style={styles.xAxisRow}>
                <Text style={styles.axisLabel}>0 min</Text>
                <Text style={styles.axisLabel}>{maxExercise} min</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    corrText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    plotArea: {
        flexDirection: 'row',
        height: 120,
    },
    yAxis: {
        width: 28,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 4,
    },
    plotBody: {
        flex: 1,
        position: 'relative',
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
    },
    dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1A1A1A',
        marginLeft: -4,
        marginBottom: -4,
    },
    xAxisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingLeft: 32,
    },
    axisLabel: {
        fontSize: 10,
        color: '#AAA',
    },
    emptyState: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#AAA',
    },
});
