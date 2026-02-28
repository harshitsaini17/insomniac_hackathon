import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AttentionCapacity } from '@/types';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

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
        ...AstraCard,
        padding: 20,
        marginBottom: 16,
    },
    date: {
        fontSize: 12,
        color: AstraColors.mutedForeground,
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
        color: AstraColors.foreground,
    },
    scoreUnit: {
        fontSize: 20,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        marginLeft: 2,
    },
    scoreLabel: {
        fontSize: 14,
        color: AstraColors.warmGray,
        marginLeft: 12,
        flex: 1,
    },
    barTrack: {
        height: 6,
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    barFill: {
        height: 6,
        backgroundColor: AstraColors.primary,
        borderRadius: 3,
    },
    sessionHint: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
    },
});
