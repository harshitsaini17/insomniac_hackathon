import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MeditationType, MeditationFlag } from '@/types';
import { MEDITATION_LABELS } from '@/types';

interface RecommendedSessionCardProps {
    type: MeditationType;
    duration: number;
    attentionBoost: number;
    flags: MeditationFlag[];
    onStart: () => void;
}

const TYPE_ICONS: Record<MeditationType, string> = {
    mindfulness: '◎',
    breathing: '◉',
    'body-scan': '◐',
    'yoga-nidra': '🧘',
};

export function RecommendedSessionCard({
    type,
    duration,
    attentionBoost,
    flags,
    onStart,
}: RecommendedSessionCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.icon}>{TYPE_ICONS[type]}</Text>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{MEDITATION_LABELS[type]}</Text>
                    <Text style={styles.subtitle}>
                        {duration} min · {attentionBoost > 0 ? '+' : ''}
                        {attentionBoost} focus pts
                    </Text>
                </View>
            </View>

            {flags.length > 0 && (
                <View style={styles.flagRow}>
                    {flags.slice(0, 2).map((f) => (
                        <View
                            key={f.id}
                            style={[
                                styles.flag,
                                f.type === 'warning' && styles.flagWarn,
                                f.type === 'boost' && styles.flagBoost,
                            ]}
                        >
                            <Text style={styles.flagText}>{f.label}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Pressable style={styles.cta} onPress={onStart}>
                <Text style={styles.ctaText}>Start {duration}-min Session</Text>
            </Pressable>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 28,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    flagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    flag: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    flagWarn: {
        backgroundColor: '#FFF3E0',
    },
    flagBoost: {
        backgroundColor: '#E8F5E9',
    },
    flagText: {
        fontSize: 11,
        color: '#555',
        fontWeight: '500',
    },
    cta: {
        backgroundColor: '#1A1A1A',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    ctaText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
