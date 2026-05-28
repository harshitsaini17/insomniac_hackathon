import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FocusTimer } from '@/components/train/FocusTimer';
import { useFocusStore } from '@/store/focus-store';
import type { FocusTaskType } from '@/types';

const DURATION_BY_DIFFICULTY: Record<number, number> = {
    1: 60, 2: 90, 3: 120, 4: 150, 5: 180,
    6: 210, 7: 240, 8: 270, 9: 300, 10: 360,
};

export default function FocusSessionScreen() {
    const { type = 'attention' } = useLocalSearchParams<{ type: string }>();
    const router = useRouter();
    const { currentDifficulty, addSession } = useFocusStore();

    const duration = DURATION_BY_DIFFICULTY[currentDifficulty] || 60;

    const handleComplete = useCallback(
        (elapsed: number) => {
            // Simulate accuracy and reaction time for the completed session
            const accuracy = Math.min(100, 50 + Math.random() * 50);
            const reactionTimeMs = 200 + Math.random() * 500;

            addSession({
                type: type as FocusTaskType,
                startedAt: Date.now() - elapsed * 1000,
                duration: elapsed,
                accuracy: Math.round(accuracy),
                reactionTimeMs: Math.round(reactionTimeMs),
                completed: true,
                difficulty: currentDifficulty,
            });

            router.back();
        },
        [type, currentDifficulty, addSession, router],
    );

    const handleCancel = useCallback(() => {
        addSession({
            type: type as FocusTaskType,
            startedAt: Date.now(),
            duration: 0,
            accuracy: 0,
            reactionTimeMs: 0,
            completed: false,
            difficulty: currentDifficulty,
        });
        router.back();
    }, [type, currentDifficulty, addSession, router]);

    return (
        <View style={styles.container}>
            <FocusTimer
                durationSeconds={duration}
                onComplete={handleComplete}
                onCancel={handleCancel}
                difficulty={currentDifficulty}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
});
