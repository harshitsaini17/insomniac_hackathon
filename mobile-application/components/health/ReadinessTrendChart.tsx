import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { HealthDayRecord } from '@/types';

interface ReadinessTrendChartProps {
    records: HealthDayRecord[];
}

export function ReadinessTrendChart({ records }: ReadinessTrendChartProps) {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Get last 7 records, fill gaps with null
    const last7 = records.slice(-7);
    const maxVal = 100;

    if (last7.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Cognitive Readiness — 7 Days</Text>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No data yet. Log your first day!</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Cognitive Readiness — 7 Days</Text>
            {selectedIdx != null && last7[selectedIdx] && (
                <Text style={styles.tooltip}>
                    {last7[selectedIdx].input.date}:{' '}
                    {last7[selectedIdx].computed.CognitiveReadiness}%
                </Text>
            )}
            <View style={styles.chartArea}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                    <Text style={styles.yLabel}>100</Text>
                    <Text style={styles.yLabel}>50</Text>
                    <Text style={styles.yLabel}>0</Text>
                </View>

                {/* Chart body with lines */}
                <View style={styles.chartBody}>
                    {/* Grid lines */}
                    <View style={[styles.gridLine, { top: '0%' }]} />
                    <View style={[styles.gridLine, { top: '50%' }]} />
                    <View style={[styles.gridLine, { top: '100%' }]} />

                    {/* Bars */}
                    <View style={styles.barsRow}>
                        {last7.map((record, i) => {
                            const height =
                                (record.computed.CognitiveReadiness / maxVal) * 100;
                            return (
                                <Pressable
                                    key={record.input.date}
                                    style={styles.barWrapper}
                                    onPress={() =>
                                        setSelectedIdx(
                                            selectedIdx === i ? null : i
                                        )
                                    }
                                >
                                    <View style={styles.barContainer}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: `${height}%`,
                                                    backgroundColor:
                                                        selectedIdx === i
                                                            ? '#1A1A1A'
                                                            : '#666',
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.xLabel}>
                                        {record.input.date.slice(5)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
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
    tooltip: {
        fontSize: 12,
        color: '#1A1A1A',
        fontWeight: '600',
        marginBottom: 8,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    chartArea: {
        flexDirection: 'row',
        height: 140,
    },
    yAxis: {
        width: 28,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 4,
    },
    yLabel: {
        fontSize: 10,
        color: '#AAA',
    },
    chartBody: {
        flex: 1,
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    barsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        flex: 1,
        width: '60%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 3,
        minHeight: 2,
    },
    xLabel: {
        fontSize: 9,
        color: '#AAA',
        marginTop: 4,
    },
    emptyState: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#AAA',
    },
});
