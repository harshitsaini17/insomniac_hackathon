import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AstraColors, AstraCard } from '@/constants/astraTheme';

interface MetricCardProps {
    icon: string;
    label: string;
    value: string;
    unit?: string;
    status?: 'good' | 'warn' | 'bad';
}

const STATUS_COLORS = {
    good: AstraColors.healthHRV,
    warn: AstraColors.warning,
    bad: AstraColors.destructive,
};

export function MetricCard({ icon, label, value, unit, status }: MetricCardProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.value}>
                {value}
                {unit && <Text style={styles.unit}> {unit}</Text>}
            </Text>
            <Text style={styles.label}>{label}</Text>
            {status && (
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        padding: 16,
        alignItems: 'center',
        flex: 1,
    },
    icon: { fontSize: 24, marginBottom: 8 },
    value: { fontSize: 24, fontWeight: '700', color: AstraColors.foreground },
    unit: { fontSize: 12, fontWeight: '400', color: AstraColors.mutedForeground },
    label: { fontSize: 12, color: AstraColors.mutedForeground, marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
});
