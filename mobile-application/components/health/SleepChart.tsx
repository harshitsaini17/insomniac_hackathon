import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { HealthDayRecord } from '@/types';

interface SleepChartProps {
    records: HealthDayRecord[];
}

export function SleepChart({ records }: SleepChartProps) {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const last7 = records.slice(-7);

    if (last7.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Sleep — 7 Days</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No data</Text>
                </View>
            </View>
        );
    }

    const maxHours = 10;

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Sleep — 7 Days</Text>
            {selectedIdx != null && last7[selectedIdx] && (
                <Text style={styles.tooltip}>
                    {last7[selectedIdx].input.date.slice(5)}:{' '}
                    {last7[selectedIdx].input.sleep_hours}h
                </Text>
            )}
            <View style={styles.barsRow}>
                {last7.map((r, i) => {
                    const height = (r.input.sleep_hours / maxHours) * 100;
                    return (
                        <Pressable
                            key={r.input.date}
                            style={styles.barWrapper}
                            onPress={() =>
                                setSelectedIdx(selectedIdx === i ? null : i)
                            }
                        >
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${Math.min(100, height)}%`,
                                            backgroundColor:
                                                r.input.sleep_hours >= 7
                                                    ? '#555'
                                                    : r.input.sleep_hours >= 6
                                                        ? '#999'
                                                        : '#CCC',
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.xLabel}>
                                {r.input.date.slice(8)}
                            </Text>
                        </Pressable>
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
        padding: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        flex: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    tooltip: {
        fontSize: 11,
        color: '#1A1A1A',
        fontWeight: '600',
        marginBottom: 4,
    },
    barsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 80,
        justifyContent: 'space-around',
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        flex: 1,
        width: '50%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 2,
        minHeight: 2,
    },
    xLabel: {
        fontSize: 9,
        color: '#AAA',
        marginTop: 3,
    },
    emptyState: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 12,
        color: '#AAA',
    },
});
