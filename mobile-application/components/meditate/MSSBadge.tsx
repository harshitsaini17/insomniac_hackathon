import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MSSBadgeProps {
    score: number;
    label?: string;
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
}

export function MSSBadge({ score, label }: MSSBadgeProps) {
    const pct = Math.min(score, 100);

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.score}>{score}</Text>
                <View style={styles.right}>
                    <Text style={styles.label}>MSS</Text>
                    <Text style={styles.sublabel}>{label || getScoreLabel(score)}</Text>
                </View>
            </View>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    score: {
        fontSize: 40,
        fontWeight: '800',
        color: '#1A1A1A',
        marginRight: 12,
    },
    right: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sublabel: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
        marginTop: 2,
    },
    barBg: {
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
    },
    barFill: {
        height: 4,
        backgroundColor: '#1A1A1A',
        borderRadius: 2,
    },
});
