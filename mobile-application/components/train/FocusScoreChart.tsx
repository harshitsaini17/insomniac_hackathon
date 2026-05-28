import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FocusScore } from '@/types';

interface FocusScoreChartProps {
    scores: FocusScore[];
}

export function FocusScoreChart({ scores }: FocusScoreChartProps) {
    const maxScore = Math.max(...scores.map((s) => s.score), 1);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Focus Score</Text>
            <View style={styles.chartRow}>
                {scores.map((s, i) => {
                    const height = (s.score / maxScore) * 80;
                    const dayLabel = new Date(s.date).toLocaleDateString('en', { weekday: 'narrow' });
                    return (
                        <View key={s.date} style={styles.barContainer}>
                            <View style={styles.barTrack}>
                                <View style={[styles.bar, { height }]} />
                            </View>
                            <Text style={styles.dayLabel}>{dayLabel}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    chartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
    },
    barTrack: {
        width: 20,
        height: 80,
        justifyContent: 'flex-end',
    },
    bar: {
        width: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 4,
        minHeight: 2,
    },
    dayLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 6,
    },
});
