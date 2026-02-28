import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MeditationType } from '@/types';
import { MEDITATION_LABELS, MEDITATION_DESCRIPTIONS } from '@/types';

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
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    pressed: {
        backgroundColor: '#FAFAFA',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
        marginRight: 14,
        color: '#1A1A1A',
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
        color: '#1A1A1A',
    },
    badge: {
        marginLeft: 8,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
});
