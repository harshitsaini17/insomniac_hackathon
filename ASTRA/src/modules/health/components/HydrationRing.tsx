import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AstraColors, AstraCard, AstraRadius } from '@/constants/astraTheme';

interface HydrationRingProps {
    currentMl: number;
    targetMl: number;
    isLow: boolean;
}

export function HydrationRing({ currentMl, targetMl, isLow }: HydrationRingProps) {
    const pct = Math.min(100, Math.round((currentMl / targetMl) * 100));

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Hydration</Text>
            <View style={styles.ringRow}>
                <View style={styles.ringContainer}>
                    <View style={styles.ringBg}>
                        <View
                            style={[
                                styles.ringFill,
                                { height: `${pct}%` },
                            ]}
                        />
                        <View style={styles.ringInner}>
                            <Text style={[
                                styles.ringPct,
                                pct > 50 && { color: AstraColors.primaryForeground },
                            ]}>{pct}%</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.mlText}>
                        {currentMl} / {targetMl} ml
                    </Text>
                    {isLow && (
                        <Pressable style={styles.ctaButton}>
                            <Text style={styles.ctaText}>💧 Drink now</Text>
                        </Pressable>
                    )}
                    {!isLow && pct >= 100 && (
                        <Text style={styles.doneText}>✓ Target reached</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { ...AstraCard, padding: 16, marginBottom: 12 },
    title: { fontSize: 14, fontWeight: '600', color: AstraColors.foreground, marginBottom: 12 },
    ringRow: { flexDirection: 'row', alignItems: 'center' },
    ringContainer: { marginRight: 20 },
    ringBg: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: AstraColors.blueLight,
        overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center',
    },
    ringFill: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: AstraColors.blue, borderRadius: 0,
    },
    ringInner: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
    },
    ringPct: { fontSize: 18, fontWeight: '700', color: AstraColors.blue },
    infoCol: { flex: 1 },
    mlText: { fontSize: 16, fontWeight: '600', color: AstraColors.foreground, marginBottom: 8 },
    ctaButton: {
        backgroundColor: AstraColors.blue, paddingHorizontal: 16,
        paddingVertical: 8, borderRadius: AstraRadius.md, alignSelf: 'flex-start',
    },
    ctaText: { color: AstraColors.primaryForeground, fontSize: 13, fontWeight: '600' },
    doneText: { fontSize: 13, color: AstraColors.healthHRV, fontWeight: '500' },
});
