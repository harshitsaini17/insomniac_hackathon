import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AttentionCapacity } from '@/types';

interface CognitiveReadinessGaugeProps {
    score: number;
    attention: AttentionCapacity;
    date: string;
}

const LEVEL_LABELS: Record<AttentionCapacity['level'], string> = {
    high: 'High',
    moderate: 'Moderate',
    light: 'Light',
    recovery: 'Recovery',
};

export function CognitiveReadinessGauge({
    score,
    attention,
    date,
}: CognitiveReadinessGaugeProps) {
    const fillWidth = `${Math.min(100, Math.max(0, score))}%`;
    const label = LEVEL_LABELS[attention.level];

    return (
        <View style={styles.container}>
            <Text style={styles.date}>{date}</Text>
            <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreUnit}>%</Text>
                <Text style={styles.scoreLabel}>
                    Cognitive Readiness — {label}
                </Text>
            </View>
            <View style={styles.barTrack}>
                <View
                    style={[
                        styles.barFill,
                        { width: fillWidth as any },
                    ]}
                />
            </View>
            {attention.minutes > 0 ? (
                <Text style={styles.sessionHint}>
                    Recommended: {attention.minutes}-min focus session
                </Text>
            ) : (
                <Text style={styles.sessionHint}>
                    Recommended: Recovery (meditation / Yoga Nidra)
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 16,
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    scoreUnit: {
        fontSize: 20,
        fontWeight: '600',
        color: '#888',
        marginLeft: 2,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
        flex: 1,
    },
    barTrack: {
        height: 6,
        backgroundColor: '#EEEEEE',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    barFill: {
        height: 6,
        backgroundColor: '#1A1A1A',
        borderRadius: 3,
    },
    sessionHint: {
        fontSize: 13,
        color: '#888',
    },
});
