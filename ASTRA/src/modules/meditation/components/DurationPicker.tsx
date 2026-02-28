import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AstraColors, AstraRadius } from '@/constants/astraTheme';

interface DurationPickerProps {
    selected: number;
    onSelect: (minutes: number) => void;
}

const DURATIONS = [5, 10, 15, 20];

export function DurationPicker({ selected, onSelect }: DurationPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
                {DURATIONS.map((min) => (
                    <Pressable
                        key={min}
                        style={[styles.pill, selected === min && styles.pillActive]}
                        onPress={() => onSelect(min)}
                    >
                        <Text style={[styles.pillText, selected === min && styles.pillTextActive]}>
                            {min} min
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: AstraRadius.md,
        borderWidth: 1,
        borderColor: AstraColors.border,
        alignItems: 'center',
        backgroundColor: AstraColors.card,
    },
    pillActive: {
        backgroundColor: AstraColors.primary,
        borderColor: AstraColors.primary,
    },
    pillText: {
        fontSize: 14,
        color: AstraColors.mutedForeground,
        fontWeight: '500',
    },
    pillTextActive: {
        color: AstraColors.primaryForeground,
    },
});
