import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface HRVScatterProps {
    data: { date: string; delta: number }[];
}

export function HRVScatter({ data }: HRVScatterProps) {
    if (data.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.title}>Pre/Post HRV</Text>
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No HRV data</Text>
                </View>
            </View>
        );
    }

    const maxDelta = Math.max(...data.map((d) => Math.abs(d.delta)), 10);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Pre/Post HRV Δ</Text>
            <View style={styles.plotArea}>
                <View style={styles.zeroLine} />
                {data.slice(-7).map((d, i) => {
                    const yPct = (d.delta / maxDelta) * 30;
                    return (
                        <View
                            key={d.date + i}
                            style={[
                                styles.dot,
                                {
                                    left: `${(i / Math.max(data.slice(-7).length - 1, 1)) * 85 + 5}%`,
                                    bottom: `${50 + yPct}%`,
                                    backgroundColor: d.delta >= 0 ? AstraColors.healthHRV : AstraColors.muted,
                                },
                            ]}
                        />
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
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 8,
    },
    plotArea: {
        height: 60,
        position: 'relative',
    },
    zeroLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: AstraColors.border,
    },
    dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: -4,
        marginBottom: -4,
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
