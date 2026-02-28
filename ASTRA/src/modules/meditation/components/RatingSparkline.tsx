import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface RatingSparklineProps {
    data: { date: string; avg: number }[];
}

export function RatingSparkline({ data }: RatingSparklineProps) {
    const last7 = data.slice(-7);

    if (last7.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Session Ratings</Text>
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No sessions yet</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Session Ratings</Text>
            <View style={styles.sparkRow}>
                {last7.map((d) => (
                    <View key={d.date} style={styles.sparkCol}>
                        <View
                            style={[
                                styles.dot,
                                { bottom: ((d.avg - 1) / 4) * 40 },
                            ]}
                        />
                        <Text style={styles.dayLabel}>{d.date.slice(8)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        padding: 16,
        marginBottom: 12,
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 8,
    },
    sparkRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 60,
        position: 'relative',
    },
    sparkCol: {
        alignItems: 'center',
        flex: 1,
        height: 50,
        justifyContent: 'flex-end',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AstraColors.meditation,
        position: 'absolute',
    },
    dayLabel: {
        fontSize: 10,
        color: AstraColors.mutedForeground,
    },
    empty: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 12,
        color: AstraColors.mutedForeground,
    },
});
