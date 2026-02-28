import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { MeditationIntent } from '@/types';
import { AstraColors, AstraRadius } from '@/constants/astraTheme';

interface IntentPickerProps {
    selected: MeditationIntent;
    onSelect: (intent: MeditationIntent) => void;
}

const INTENTS: { value: MeditationIntent; label: string; icon: string }[] = [
    { value: 'focus', label: 'Focus', icon: '◎' },
    { value: 'calm', label: 'Calm', icon: '○' },
    { value: 'sleep', label: 'Sleep', icon: '🌙' },
    { value: 'recovery', label: 'Recovery', icon: '♻' },
    { value: 'energy', label: 'Energy', icon: '⚡' },
];

export function IntentPicker({ selected, onSelect }: IntentPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Intent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.row}>
                    {INTENTS.map((item) => (
                        <Pressable
                            key={item.value}
                            style={[
                                styles.chip,
                                selected === item.value && styles.chipActive,
                            ]}
                            onPress={() => onSelect(item.value)}
                        >
                            <Text style={styles.chipIcon}>{item.icon}</Text>
                            <Text
                                style={[
                                    styles.chipText,
                                    selected === item.value && styles.chipTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: AstraRadius.full,
        backgroundColor: AstraColors.card,
        borderWidth: 1,
        borderColor: AstraColors.border,
        gap: 6,
    },
    chipActive: {
        backgroundColor: AstraColors.primaryLight,
        borderColor: 'rgba(92,138,108,0.3)',
    },
    chipIcon: {
        fontSize: 14,
    },
    chipText: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        fontWeight: '500',
    },
    chipTextActive: {
        color: AstraColors.primary,
    },
});
