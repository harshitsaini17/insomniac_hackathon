import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { AttentionCapacity } from '@/types';
import { AstraColors, AstraCard, AstraRadius, AstraShadow } from '@/constants/astraTheme';

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
    card: { ...AstraCard, padding: 16, marginBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    icon: { fontSize: 20, marginRight: 10 },
    label: { fontSize: 16, fontWeight: '600', color: AstraColors.foreground },
    description: {
        fontSize: 14, color: AstraColors.warmGray, lineHeight: 20, marginBottom: 14,
    },
    actionsRow: { flexDirection: 'row', gap: 10 },
    primaryBtn: {
        backgroundColor: AstraColors.primary,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: AstraRadius.md, flex: 1, alignItems: 'center',
        ...AstraShadow.button,
    },
    primaryBtnText: {
        color: AstraColors.primaryForeground, fontSize: 13, fontWeight: '600',
    },
    secondaryBtn: {
        borderWidth: 1, borderColor: AstraColors.border,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: AstraRadius.md, alignItems: 'center',
    },
    secondaryBtnText: {
        color: AstraColors.warmGray, fontSize: 13, fontWeight: '500',
    },
});
