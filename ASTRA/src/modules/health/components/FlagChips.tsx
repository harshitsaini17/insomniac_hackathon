import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { HealthFlag } from '@/types';

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
    container: {
        marginBottom: 16,
    },
    content: {
        gap: 8,
        paddingHorizontal: 2,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#CCC',
        backgroundColor: '#FFF',
    },
    chipUrgent: {
        backgroundColor: '#1A1A1A',
        borderColor: '#1A1A1A',
    },
    chipWarning: {
        borderColor: '#888',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    chipTextUrgent: {
        color: '#FFF',
    },
});
