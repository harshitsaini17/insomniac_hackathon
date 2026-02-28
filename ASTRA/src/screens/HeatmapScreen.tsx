// ─────────────────────────────────────────────────────────────────────────────
// Heatmap Screen — 7-day Focus Analytics
// 7×24 grid showing predicted AFI per hour slot
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import {
    generateFocusHeatmap,
    findOptimalWindows,
    getSuggestedSchedule,
    aggregateToFocusWindows,
} from '../modules/focusTrainer/math/attentionForecasting';
import { HourBlock } from '../modules/focusTrainer/models/types';
import { AstraColors, AstraCard, AstraRadius } from '../constants/astraTheme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS_DISPLAY = [
    '12a', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
    '12p', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
];

export default function HeatmapScreen() {
    const { focusHeatmap, suggestedWindows, setFocusHeatmap, setSuggestedWindows } =
        useFocusStore();

    useEffect(() => {
        loadHeatmapData();
    }, []);

    const loadHeatmapData = () => {
        // Generate mock AFI data points for 7 days
        const now = Date.now();
        const dataPoints = [];
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                const timestamp = now - d * 24 * 60 * 60 * 1000 + h * 60 * 60 * 1000;
                // Simulate focus patterns: better in morning, worse in evening
                const baseAFI = h >= 8 && h <= 11 ? 0.2 : h >= 14 && h <= 16 ? 0.35 : 0.6;
                const noise = (Math.random() - 0.5) * 0.2;
                dataPoints.push({ timestamp, afi: Math.max(0, Math.min(1, baseAFI + noise)) });
            }
        }

        const windows = aggregateToFocusWindows(dataPoints);
        const heatmap = generateFocusHeatmap(windows);
        setFocusHeatmap(heatmap);

        const today = new Date().getDay();
        const suggested = getSuggestedSchedule(heatmap, today);
        setSuggestedWindows(suggested);
    };

    const getColor = (block: HourBlock): string => {
        switch (block.label) {
            case 'optimal': return AstraColors.primary;
            case 'good': return AstraColors.primaryMuted;
            case 'fair': return AstraColors.warning;
            case 'poor': return AstraColors.destructive;
            default: return AstraColors.muted;
        }
    };

    const getOpacity = (block: HourBlock): number => {
        return 0.3 + block.confidence * 0.7;
    };

    // Group heatmap by day
    const heatmapByDay = useMemo(() => {
        const map = new Map<number, HourBlock[]>();
        for (const block of focusHeatmap) {
            const existing = map.get(block.dayOfWeek) || [];
            existing.push(block);
            map.set(block.dayOfWeek, existing);
        }
        // Sort hours within each day
        for (const [day, blocks] of map) {
            map.set(day, blocks.sort((a, b) => a.hour - b.hour));
        }
        return map;
    }, [focusHeatmap]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.caption}>ANALYTICS</Text>
            <Text style={styles.title}>Focus Heatmap</Text>
            <Text style={styles.subtitle}>
                Your predicted attention quality across the week
            </Text>

            {/* ── Legend ──────────────────────────────────────────────────────── */}
            <View style={styles.legend}>
                {(['optimal', 'good', 'fair', 'poor'] as const).map(label => (
                    <View key={label} style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendDot,
                                {
                                    backgroundColor:
                                        label === 'optimal' ? AstraColors.primary :
                                            label === 'good' ? AstraColors.primaryMuted :
                                                label === 'fair' ? AstraColors.warning : AstraColors.destructive,
                                },
                            ]}
                        />
                        <Text style={styles.legendText}>
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* ── Heatmap Grid ───────────────────────────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* Hour headers */}
                    <View style={styles.hourRow}>
                        <View style={styles.dayLabel} />
                        {HOURS_DISPLAY.map((h, i) => (
                            <Text
                                key={i}
                                style={[
                                    styles.hourLabel,
                                    i % 3 === 0 ? styles.hourLabelVisible : styles.hourLabelHidden,
                                ]}
                            >
                                {i % 3 === 0 ? h : ''}
                            </Text>
                        ))}
                    </View>

                    {/* Day rows */}
                    {DAYS.map((day, dayIdx) => (
                        <View key={dayIdx} style={styles.dayRow}>
                            <Text style={styles.dayLabel}>{day}</Text>
                            {(heatmapByDay.get(dayIdx) || []).map((block, hourIdx) => (
                                <View
                                    key={hourIdx}
                                    style={[
                                        styles.cell,
                                        {
                                            backgroundColor: getColor(block),
                                            opacity: getOpacity(block),
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Suggested Windows ──────────────────────────────────────────── */}
            <View style={styles.suggestedCard}>
                <Text style={styles.suggestedTitle}>Optimal Windows Today</Text>
                {suggestedWindows.length > 0 ? (
                    suggestedWindows.map((w, i) => (
                        <View key={i} style={styles.windowRow}>
                            <Text style={styles.windowTime}>
                                {formatHour(w.hour)} – {formatHour(w.hour + 1)}
                            </Text>
                            <View
                                style={[
                                    styles.windowBadge,
                                    { backgroundColor: getColor(w) },
                                ]}
                            >
                                <Text style={styles.windowLabel}>
                                    {w.label.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.windowAFI}>
                                AFI: {(w.predictedAFI * 100).toFixed(0)}%
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noData}>
                        Not enough data yet. Keep using ASTRA to see predictions.
                    </Text>
                )}
            </View>

            {/* ── Insights ───────────────────────────────────────────────────── */}
            <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>Insights</Text>
                <Text style={styles.insightText}>
                    • Your best focus hours tend to be in the morning (8–11 AM)
                </Text>
                <Text style={styles.insightText}>
                    • Attention fragmentation increases after 3 PM
                </Text>
                <Text style={styles.insightText}>
                    • Consider scheduling demanding tasks before noon
                </Text>
            </View>
        </ScrollView>
    );
}

function formatHour(h: number): string {
    const hour = h % 24;
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AstraColors.background },
    content: { padding: 20, paddingTop: 56, paddingBottom: 100 },
    caption: {
        fontSize: 11,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 30, fontWeight: '700', color: AstraColors.foreground,
        letterSpacing: -0.5, marginBottom: 4,
    },
    subtitle: {
        fontSize: 14, color: AstraColors.mutedForeground, marginBottom: 20,
    },
    legend: {
        flexDirection: 'row', gap: 16, marginBottom: 16,
        justifyContent: 'center',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 3 },
    legendText: { fontSize: 12, color: AstraColors.mutedForeground },
    hourRow: { flexDirection: 'row', marginBottom: 4 },
    hourLabel: { width: 18, fontSize: 9, color: AstraColors.mutedForeground, textAlign: 'center' },
    hourLabelVisible: {},
    hourLabelHidden: { opacity: 0 },
    dayRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'center' },
    dayLabel: { width: 36, fontSize: 11, color: AstraColors.mutedForeground, fontWeight: '500' },
    cell: {
        width: 16, height: 16, borderRadius: 4, marginHorizontal: 1,
    },
    suggestedCard: {
        ...AstraCard,
        padding: 20,
        marginTop: 20,
    },
    suggestedTitle: {
        fontSize: 16, fontWeight: '600', color: AstraColors.foreground, marginBottom: 14,
    },
    windowRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12,
    },
    windowTime: { fontSize: 14, color: AstraColors.foreground, width: 130 },
    windowBadge: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    },
    windowLabel: { fontSize: 10, fontWeight: '700', color: AstraColors.primaryForeground },
    windowAFI: { fontSize: 12, color: AstraColors.mutedForeground },
    noData: { fontSize: 13, color: AstraColors.mutedForeground, fontStyle: 'italic' },
    insightCard: {
        ...AstraCard,
        padding: 20,
        marginTop: 12,
    },
    insightTitle: {
        fontSize: 16, fontWeight: '600', color: AstraColors.foreground, marginBottom: 12,
    },
    insightText: {
        fontSize: 13, color: AstraColors.mutedForeground, marginBottom: 6, lineHeight: 20,
    },
});
