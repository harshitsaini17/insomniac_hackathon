import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { HealthFlag } from '@/types';
import { AstraColors, AstraRadius } from '@/constants/astraTheme';

interface FlagChipsProps {
    flags: HealthFlag[];
}

export function FlagChips({ flags }: FlagChipsProps) {
    if (flags.length === 0) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {flags.map((flag) => (
                <View
                    key={flag.id}
                    style={[
                        styles.chip,
                        flag.type === 'urgent' && styles.chipUrgent,
                        flag.type === 'warning' && styles.chipWarning,
                    ]}
                >
                    <Text
                        style={[
                            styles.chipText,
                            flag.type === 'urgent' && styles.chipTextUrgent,
                        ]}
                    >
                        {flag.label}
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    content: { gap: 8, paddingHorizontal: 2 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: AstraRadius.full,
        borderWidth: 1,
        borderColor: AstraColors.border,
        backgroundColor: AstraColors.card,
    },
    chipUrgent: {
        backgroundColor: AstraColors.destructive,
        borderColor: AstraColors.destructive,
    },
    chipWarning: {
        borderColor: AstraColors.warning,
        backgroundColor: 'rgba(212,162,58,0.08)',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: AstraColors.warmGray,
    },
    chipTextUrgent: {
        color: AstraColors.primaryForeground,
    },
});
