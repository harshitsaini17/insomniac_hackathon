import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
    icon: string;
    label: string;
    value: string;
    unit?: string;
    status?: 'good' | 'warn' | 'bad';
}

const STATUS_COLORS = {
    good: '#2D8A4E',
    warn: '#B5860B',
    bad: '#C0392B',
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
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        fontSize: 24,
        marginBottom: 8,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    unit: {
        fontSize: 12,
        fontWeight: '400',
        color: '#888',
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
});
