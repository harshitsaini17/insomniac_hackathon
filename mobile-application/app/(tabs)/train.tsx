import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { TaskCard } from '@/components/train/TaskCard';
import { FocusScoreChart } from '@/components/train/FocusScoreChart';
import { useFocusStore } from '@/store/focus-store';

export default function TrainScreen() {
    const router = useRouter();
    const { getWeeklyScores, getStreak, getFocusScore, currentDifficulty } = useFocusStore();

    const streak = getStreak();
    const focusScore = getFocusScore();
    const weeklyScores = getWeeklyScores();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                    <TaskCard
                        title="Focused Attention"
                        description="Timed concentration on a single point"
                        icon="◎"
                        onPress={() => router.push('/train/session?type=attention')}
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
                        onPress={() => router.push('/train/session?type=switching')}
                    />
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
