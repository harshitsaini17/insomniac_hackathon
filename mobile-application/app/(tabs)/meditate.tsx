import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMeditationStore } from '@/store/meditation-store';
import { useHealthStore } from '@/store/health-store';
import { useUserStore } from '@/store/user-store';
import { computeFullScores } from '@/engine/meditation-scores';
import type { MeditationType, MeditationIntent, DailyMeditationInput, ExperienceLevel } from '@/types';

// Components
import { MSSBadge } from '@/components/meditate/MSSBadge';
import { RecommendedSessionCard } from '@/components/meditate/RecommendedSessionCard';
import { IntentPicker } from '@/components/meditate/IntentPicker';
import { DurationPicker } from '@/components/meditate/DurationPicker';
import { MSSChart } from '@/components/meditate/MSSChart';
import { RatingSparkline } from '@/components/meditate/RatingSparkline';
import { HRVScatter } from '@/components/meditate/HRVScatter';
import { TimeSpentBar } from '@/components/meditate/TimeSpentBar';
import { SessionCard } from '@/components/meditate/SessionCard';

export default function MeditateScreen() {
    const router = useRouter();
    const [intent, setIntent] = useState<MeditationIntent>('calm');
    const [duration, setDuration] = useState(10);

    const latestHealthRecord = useHealthStore((s) => s.getLatestRecord());
    const profile = useUserStore((s) => s.profile);
    const { getSessionCount, getTotalMinutes, getAverageRating } = useMeditationStore();
    const summary = useMeditationStore((s) => s.getMeditationSummary(7));

    // Build a live DailyMeditationInput from current health + UI selections
    const meditationInput: DailyMeditationInput = useMemo(() => ({
        date: new Date().toISOString().slice(0, 10),
        stress_level: latestHealthRecord?.input.stress_level ?? 2,
        fatigue_level: latestHealthRecord?.input.fatigue_level ?? 2,
        mood: 3,
        available_minutes: duration,
        experience_level: (getSessionCount() > 20
            ? 'advanced'
            : getSessionCount() > 5
                ? 'intermediate'
                : 'novice') as ExperienceLevel,
        intent,
        hrv_rmssd_ms: latestHealthRecord?.input.hrv_rmssd_ms,
    }), [intent, duration, latestHealthRecord, getSessionCount]);

    // Compute MSS live
    const computed = useMemo(
        () => computeFullScores(meditationInput, profile),
        [meditationInput, profile]
    );

    const handleStartSession = useCallback(() => {
        router.push(
            `/meditate/session?type=${computed.recommended_type}&duration=${computed.recommended_duration}` as any
        );
    }, [computed, router]);

    const types: MeditationType[] = ['mindfulness', 'body-scan', 'breathing', 'yoga-nidra'];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* MSS Badge */}
            <MSSBadge score={computed.MSS} />

            {/* Stats Row */}
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

            {/* Intent Picker */}
            <IntentPicker selected={intent} onSelect={setIntent} />

            {/* Time Slider */}
            <DurationPicker selected={duration} onSelect={setDuration} />

            {/* Recommended Session CTA */}
            <RecommendedSessionCard
                type={computed.recommended_type}
                duration={computed.recommended_duration}
                attentionBoost={computed.attention_boost_est}
                flags={computed.flags}
                onStart={handleStartSession}
            />

            {/* 7-day MSS Chart */}
            <MSSChart data={summary.mssHistory} />

            {/* Ratings + HRV row */}
            <View style={styles.twoCol}>
                <RatingSparkline data={summary.ratingHistory} />
                <View style={{ width: 10 }} />
                <HRVScatter data={summary.hrvDelta} />
            </View>

            {/* Time Spent */}
            <TimeSpentBar data={summary.timeSpent} />

            {/* All Session Types */}
            <Text style={styles.sectionTitle}>All Practices</Text>
            <View style={styles.sessionList}>
                {types.map((type) => (
                    <SessionCard
                        key={type}
                        type={type}
                        recommended={type === computed.recommended_type}
                        onPress={() =>
                            router.push(`/meditate/session?type=${type}&duration=${duration}` as any)
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
        marginBottom: 16,
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
    twoCol: {
        flexDirection: 'row',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
        marginTop: 4,
    },
    sessionList: {
        gap: 10,
    },
});
