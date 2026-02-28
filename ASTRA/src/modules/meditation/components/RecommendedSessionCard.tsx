import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MeditationType, MeditationFlag } from '@/types';
import { MEDITATION_LABELS } from '@/types';
import { AstraColors, AstraCard, AstraShadow, AstraRadius } from '@/constants/astraTheme';

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
        ...AstraCard,
        padding: 16,
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
        color: AstraColors.foreground,
    },
    subtitle: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        marginTop: 2,
    },
    flagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    flag: {
        backgroundColor: AstraColors.muted,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    flagWarn: {
        backgroundColor: 'rgba(212,162,58,0.12)',
    },
    flagBoost: {
        backgroundColor: AstraColors.primaryLight,
    },
    flagText: {
        fontSize: 11,
        color: AstraColors.warmGray,
        fontWeight: '500',
    },
    cta: {
        backgroundColor: AstraColors.primary,
        borderRadius: AstraRadius.md,
        paddingVertical: 14,
        alignItems: 'center',
        ...AstraShadow.button,
    },
    ctaText: {
        color: AstraColors.primaryForeground,
        fontSize: 15,
        fontWeight: '700',
    },
});
