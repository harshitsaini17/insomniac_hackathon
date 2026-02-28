import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { AttentionCapacity } from '@/types';

interface AttentionRecommendationProps {
    attention: AttentionCapacity;
    onStartSession?: () => void;
    onLogCheckIn?: () => void;
}

const LEVEL_CONFIG: Record<
    AttentionCapacity['level'],
    { icon: string; label: string; description: string }
> = {
    high: {
        icon: '◎',
        label: 'High Focus Session',
        description: 'You\'re primed for deep work. Start a 25-min focus session.',
    },
    moderate: {
        icon: '◐',
        label: 'Moderate Focus Session',
        description: 'Good for focused work. Try a 15-min session.',
    },
    light: {
        icon: '○',
        label: 'Light Session',
        description: 'Take it easy — an 8-min session or light task is ideal.',
    },
    recovery: {
        icon: '🧘',
        label: 'Recovery Mode',
        description: 'Rest first. Try Yoga Nidra or a 10-min breathing exercise.',
    },
};

export function AttentionRecommendation({
    attention,
    onStartSession,
    onLogCheckIn,
}: AttentionRecommendationProps) {
    const config = LEVEL_CONFIG[attention.level];

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.icon}>{config.icon}</Text>
                <Text style={styles.label}>{config.label}</Text>
            </View>
            <Text style={styles.description}>{config.description}</Text>
            <View style={styles.actionsRow}>
                <Pressable
                    style={styles.primaryBtn}
                    onPress={onStartSession}
                >
                    <Text style={styles.primaryBtnText}>
                        {attention.level === 'recovery'
                            ? 'Start Recovery Session'
                            : `Start ${attention.minutes}-min Focus`}
                    </Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={onLogCheckIn}>
                    <Text style={styles.secondaryBtnText}>Log Check-in</Text>
                </Pressable>
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 20,
        marginRight: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 14,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    primaryBtn: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    secondaryBtn: {
        borderWidth: 1,
        borderColor: '#CCC',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '500',
    },
});
