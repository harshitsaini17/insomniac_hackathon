import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MeditationType } from '@/types';
import { MEDITATION_LABELS, MEDITATION_DESCRIPTIONS } from '@/types';
import { AstraColors, AstraCard, AstraRadius } from '@/constants/astraTheme';

interface SessionCardProps {
    type: MeditationType;
    recommended?: boolean;
    onPress: () => void;
}

const ICONS: Record<MeditationType, string> = {
    'mindfulness': '◉',
    'body-scan': '◎',
    'breathing': '❍',
    'yoga-nidra': '☾',
};

export function SessionCard({ type, recommended, onPress }: SessionCardProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={onPress}
        >
            <View style={styles.row}>
                <Text style={styles.icon}>{ICONS[type]}</Text>
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{MEDITATION_LABELS[type]}</Text>
                        {recommended && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Recommended</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.description}>{MEDITATION_DESCRIPTIONS[type]}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        ...AstraCard,
        padding: 16,
    },
    pressed: {
        backgroundColor: AstraColors.warmGrayLight,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
        marginRight: 14,
        color: AstraColors.meditation,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: AstraColors.foreground,
    },
    badge: {
        marginLeft: 8,
        backgroundColor: AstraColors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: AstraColors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        lineHeight: 18,
    },
});
