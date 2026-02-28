import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface MSSChartProps {
    data: { date: string; mss: number }[];
}

export function MSSChart({ data }: MSSChartProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const last7 = data.slice(-7);
    const maxVal = 100;

    if (last7.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>MSS Trend</Text>
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No data yet</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>MSS Trend</Text>
            {selected != null && last7[selected] && (
                <Text style={styles.tooltip}>
                    {last7[selected].date.slice(5)} — {last7[selected].mss}
                </Text>
            )}
            <View style={styles.barRow}>
                {last7.map((d, i) => {
                    const h = (d.mss / maxVal) * 80;
                    return (
                        <Pressable
                            key={d.date}
                            style={styles.barCol}
                            onPress={() => setSelected(i)}
                        >
                            <View
                                style={[
                                    styles.bar,
                                    { height: h },
                                    selected === i && styles.barActive,
                                ]}
                            />
                            <Text style={styles.dayLabel}>
                                {d.date.slice(8)}
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
        ...AstraCard,
        padding: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 8,
    },
    tooltip: {
        fontSize: 12,
        color: AstraColors.mutedForeground,
        marginBottom: 6,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 90,
    },
    barCol: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 16,
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 4,
    },
    barActive: {
        backgroundColor: AstraColors.primary,
    },
    dayLabel: {
        fontSize: 10,
        color: AstraColors.mutedForeground,
        marginTop: 4,
    },
    empty: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
    },
});
