import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Recommendation } from '@/types';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface RecommendationCardProps {
    recommendation: Recommendation;
}

const PRIORITY_INDICATOR = {
    high: '●',
    medium: '◐',
    low: '○',
};

const TYPE_ICONS: Record<string, string> = {
    exercise: '🚶',
    sleep: '🌙',
    hydration: '💧',
    recovery: '🧘',
    meditation: '◉',
};

export function RecommendationCard({ recommendation: rec }: RecommendationCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.icon}>{TYPE_ICONS[rec.type] || '•'}</Text>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{rec.title}</Text>
                    <Text style={styles.priority}>
                        {PRIORITY_INDICATOR[rec.priority]} {rec.priority}
                    </Text>
                </View>
            </View>
            <Text style={styles.description}>{rec.description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: { fontSize: 20, marginRight: 12 },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { fontSize: 16, fontWeight: '600', color: AstraColors.foreground },
    priority: {
        fontSize: 11,
        color: AstraColors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 14,
        color: AstraColors.warmGray,
        lineHeight: 20,
    },
});
