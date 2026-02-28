import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface MSSBadgeProps {
    score: number;
    label?: string;
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
}

export function MSSBadge({ score, label }: MSSBadgeProps) {
    const pct = Math.min(score, 100);

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.score}>{score}</Text>
                <View style={styles.right}>
                    <Text style={styles.label}>MSS</Text>
                    <Text style={styles.sublabel}>{label || getScoreLabel(score)}</Text>
                </View>
            </View>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        padding: 16,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    score: {
        fontSize: 40,
        fontWeight: '800',
        color: AstraColors.foreground,
        marginRight: 12,
    },
    right: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: AstraColors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sublabel: {
        fontSize: 14,
        color: AstraColors.warmGray,
        fontWeight: '500',
        marginTop: 2,
    },
    barBg: {
        height: 4,
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 2,
    },
    barFill: {
        height: 4,
        backgroundColor: AstraColors.primary,
        borderRadius: 2,
    },
});
