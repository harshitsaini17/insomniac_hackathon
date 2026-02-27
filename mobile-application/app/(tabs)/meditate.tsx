import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SessionCard } from '@/components/meditate/SessionCard';
import { DurationPicker } from '@/components/meditate/DurationPicker';
import { useMeditationStore } from '@/store/meditation-store';
import { useHealthStore } from '@/store/health-store';
import { useUserStore } from '@/store/user-store';
import { evaluateRules } from '@/engine/rule-engine';
import { meditationRules } from '@/engine/meditation-rules';
import type { MeditationType, RuleContext, DailyHealthInput } from '@/types';

const DEFAULT_HEALTH: DailyHealthInput = {
    date: new Date().toISOString().slice(0, 10),
    sleep_hours: 7,
    sleep_quality: 3,
    sleep_disturbances: 0,
    exercise_minutes: 20,
    sedentary_hours: 4,
    water_ml: 1500,
    stress_level: 2,
    fatigue_level: 2,
};

export default function MeditateScreen() {
    const router = useRouter();
    const [duration, setDuration] = useState(10);
    const { sessions, getAverageRating, getSessionCount, getTotalMinutes } = useMeditationStore();
    const latestRecord = useHealthStore((s) => s.getLatestRecord());
    const healthRecords = useHealthStore((s) => s.getRecordsForDays(30));
    const health = latestRecord?.input ?? DEFAULT_HEALTH;
    const profile = useUserStore((s) => s.profile);

    const recommendations = useMemo(() => {
        const ctx: RuleContext = {
            user: profile,
            health,
            healthRecords,
            focusSessions: [],
            meditationSessions: sessions,
        };
        return evaluateRules(meditationRules, ctx);
    }, [profile, health, healthRecords, sessions]);

    // Determine recommended type from engine
    const recommendedType: MeditationType | null = useMemo(() => {
        const medRec = recommendations.find((r) => r.type === 'meditation' || r.type === 'recovery');
        if (!medRec) return null;
        if (medRec.triggeredBy.includes('breathing')) return 'breathing';
        if (medRec.triggeredBy.includes('yoga-nidra')) return 'yoga-nidra';
        if (medRec.triggeredBy.includes('mindfulness')) return 'mindfulness';
        if (medRec.triggeredBy.includes('body-scan')) return 'body-scan';
        return null;
    }, [recommendations]);

    const types: MeditationType[] = ['mindfulness', 'body-scan', 'breathing', 'yoga-nidra'];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{getSessionCount()}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{getTotalMinutes()}</Text>
                    <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{getAverageRating() || '—'}</Text>
                    <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
            </View>

            {/* Duration Picker */}
            <DurationPicker selected={duration} onSelect={setDuration} />

            {/* Session Types */}
            <Text style={styles.sectionTitle}>Choose Practice</Text>
            <View style={styles.sessionList}>
                {types.map((type) => (
                    <SessionCard
                        key={type}
                        type={type}
                        recommended={type === recommendedType}
                        onPress={() =>
                            router.push(`/meditate/session?type=${type}&duration=${duration}`)
                        }
                    />
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 24,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#F0F0F0',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    sessionList: {
        gap: 10,
    },
});
