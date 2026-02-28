import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { TaskCard } from '@/components/train/TaskCard';
import { FocusScoreChart } from '@/components/train/FocusScoreChart';
import { useFocusStore } from '@/store/focus-store';
import { useHealthStore } from '@/store/health-store';

export default function TrainScreen() {
    const router = useRouter();
    const { getWeeklyScores, getStreak, getFocusScore, currentDifficulty } = useFocusStore();
    const healthOutput = useHealthStore((s) => s.getLatestHealthOutput());
    const last7Health = useHealthStore((s) => s.getRecordsForDays(7));

    const streak = getStreak();
    const focusScore = getFocusScore();
    const weeklyScores = getWeeklyScores();

    const isRecovery = healthOutput?.AttentionCapacity.level === 'recovery';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Health Readiness Badge */}
            {healthOutput && (
                <View style={styles.readinessBadge}>
                    <View style={styles.readinessLeft}>
                        <Text style={styles.readinessScore}>
                            {healthOutput.CognitiveReadiness}
                        </Text>
                        <View>
                            <Text style={styles.readinessLabel}>Readiness</Text>
                            <Text style={styles.readinessLevel}>
                                {healthOutput.AttentionCapacity.level.toUpperCase()} ·{' '}
                                {healthOutput.AttentionCapacity.minutes > 0
                                    ? `${healthOutput.AttentionCapacity.minutes} min`
                                    : 'Rest'}
                            </Text>
                        </View>
                    </View>
                    {/* Sparkline */}
                    {last7Health.length > 1 && (
                        <View style={styles.sparkline}>
                            {last7Health.map((r, i) => (
                                <View
                                    key={r.input.date}
                                    style={[
                                        styles.sparkBar,
                                        {
                                            height:
                                                (r.computed.CognitiveReadiness / 100) * 28,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{streak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{focusScore}</Text>
                    <Text style={styles.statLabel}>Focus Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{currentDifficulty}</Text>
                    <Text style={styles.statLabel}>Level</Text>
                </View>
            </View>

            {/* Weekly Chart */}
            <View style={styles.section}>
                <FocusScoreChart scores={weeklyScores} />
            </View>

            {/* Training Tasks */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <View style={styles.taskList}>
                    {isRecovery ? (
                        <>
                            <TaskCard
                                title="Start Recovery Session"
                                description="Yoga Nidra or 10-min breathing — rest first"
                                icon="🧘"
                                onPress={() =>
                                    router.push('/meditate/session?type=yoga-nidra' as any)
                                }
                            />
                            <TaskCard
                                title="Light Focus (Optional)"
                                description="Only if you feel up for it — 8 min max"
                                icon="○"
                                onPress={() =>
                                    router.push('/train/session?type=attention')
                                }
                            />
                        </>
                    ) : (
                        <>
                            <TaskCard
                                title="Focused Attention"
                                description="Timed concentration on a single point"
                                icon="◎"
                                onPress={() =>
                                    router.push('/train/session?type=attention')
                                }
                            />
                            <TaskCard
                                title="Dual N-Back"
                                description="Working memory training task"
                                icon="▦"
                                onPress={() => router.push('/train/n-back')}
                            />
                            <TaskCard
                                title="Attention Switching"
                                description="Rapidly shift focus between targets"
                                icon="⇄"
                                onPress={() =>
                                    router.push('/train/session?type=switching')
                                }
                            />
                        </>
                    )}
                </View>
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
    readinessBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 12,
    },
    readinessLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    readinessScore: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    readinessLabel: {
        fontSize: 11,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    readinessLevel: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
        marginTop: 1,
    },
    sparkline: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 30,
    },
    sparkBar: {
        width: 4,
        backgroundColor: '#1A1A1A',
        borderRadius: 2,
        minHeight: 2,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 20,
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    taskList: {
        gap: 10,
    },
});

