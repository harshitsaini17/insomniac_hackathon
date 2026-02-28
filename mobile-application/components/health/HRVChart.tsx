import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { HealthDayRecord } from '@/types';

interface HRVChartProps {
    records: HealthDayRecord[];
}

export function HRVChart({ records }: HRVChartProps) {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Filter records that have HRV data
    const withHRV = records.slice(-7).filter((r) => r.input.hrv_rmssd_ms != null);

    if (withHRV.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>HRV</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>💓</Text>
                    <Text style={styles.emptyText}>Enter HRV in your{'\n'}daily log</Text>
                </View>
            </View>
        );
    }

    const maxHRV = 80;

    return (
        <View style={styles.card}>
            <Text style={styles.title}>HRV — RMSSD</Text>
            {selectedIdx != null && withHRV[selectedIdx] && (
                <Text style={styles.tooltip}>
                    {withHRV[selectedIdx].input.date.slice(5)}:{' '}
                    {withHRV[selectedIdx].input.hrv_rmssd_ms}ms
                </Text>
            )}
            <View style={styles.barsRow}>
                {withHRV.map((r, i) => {
                    const hrv = r.input.hrv_rmssd_ms!;
                    const height = (hrv / maxHRV) * 100;
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
                                                hrv >= 50 ? '#555' : hrv >= 40 ? '#999' : '#CCC',
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
    emptyIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 11,
        color: '#AAA',
        textAlign: 'center',
    },
});
