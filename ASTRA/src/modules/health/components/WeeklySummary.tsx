import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HealthDayRecord } from '@/types';
import { CHRONIC_LOW_THRESHOLD } from '@/constants/health-constants';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface WeeklySummaryProps {
    records: HealthDayRecord[];
}

export function WeeklySummary({ records }: WeeklySummaryProps) {
    const last7 = records.slice(-7);

    if (last7.length === 0) {
        return null;
    }

    const avgSleep =
        Math.round(
            (last7.reduce((s, r) => s + r.input.sleep_hours, 0) / last7.length) * 10
        ) / 10;

    const avgReadiness =
        Math.round(
            last7.reduce((s, r) => s + r.computed.CognitiveReadiness, 0) / last7.length
        );

    const daysBelow = last7.filter(
        (r) => r.computed.CognitiveReadiness < CHRONIC_LOW_THRESHOLD
    ).length;

    let suggestion = '';
    if (daysBelow >= 2) {
        suggestion = ` ${daysBelow} days below threshold — suggest 48h light load.`;
    } else if (avgReadiness >= 70) {
        suggestion = ' You\'re performing well. Keep it up!';
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>7-Day Summary</Text>
            <Text style={styles.text}>
                Past week: Avg sleep {avgSleep}h, avg readiness {avgReadiness}.
                {suggestion}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        backgroundColor: AstraColors.warmGrayLight,
        padding: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 6,
    },
    text: {
        fontSize: 13,
        color: AstraColors.warmGray,
        lineHeight: 19,
    },
});
