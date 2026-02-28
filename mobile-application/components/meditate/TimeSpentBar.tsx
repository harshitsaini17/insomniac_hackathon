import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimeSpentBarProps {
    data: { date: string; minutes: number }[];
}

export function TimeSpentBar({ data }: TimeSpentBarProps) {
    const last7 = data.slice(-7);
    const maxMin = Math.max(...last7.map((d) => d.minutes), 20);

    if (last7.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Time Spent</Text>
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No data yet</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Time Spent</Text>
            <View style={styles.barRow}>
                {last7.map((d) => {
                    const h = (d.minutes / maxMin) * 60;
                    return (
                        <View key={d.date} style={styles.barCol}>
                            <View style={[styles.bar, { height: h }]} />
                            <Text style={styles.barLabel}>{d.minutes}m</Text>
                            <Text style={styles.dayLabel}>
                                {d.date.slice(8)}
                            </Text>
                        </View>
                    );
                })}
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
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 80,
    },
    barCol: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 14,
        backgroundColor: '#1A1A1A',
        borderRadius: 3,
    },
    barLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    dayLabel: {
        fontSize: 10,
        color: '#AAA',
    },
    empty: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#AAA',
    },
});
