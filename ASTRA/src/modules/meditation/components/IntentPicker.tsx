import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { MeditationIntent } from '@/types';

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
        color: '#1A1A1A',
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
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 6,
    },
    chipActive: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    chipIcon: {
        fontSize: 14,
    },
    chipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFF',
    },
});
