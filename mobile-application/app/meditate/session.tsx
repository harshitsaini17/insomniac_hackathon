import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RatingModal } from '@/components/meditate/RatingModal';
import { useMeditationStore } from '@/store/meditation-store';
import { MEDITATION_LABELS } from '@/types';
import type { MeditationType, SessionPhase } from '@/types';

const PHASE_LABELS: Record<SessionPhase, string> = {
    preparation: 'Prepare',
    core: 'Practice',
    reflection: 'Reflect',
};

const PHASE_INSTRUCTIONS: Record<SessionPhase, string> = {
    preparation: 'Find a comfortable position.\nClose your eyes gently.\nTake three deep breaths.',
    core: 'Maintain your focus.\nLet thoughts pass without judgment.\nReturn to the practice when distracted.',
    reflection: 'Slowly bring your awareness back.\nNotice how you feel.\nTake a moment of gratitude.',
};

export default function MeditationSessionScreen() {
    const { type = 'mindfulness', duration = '600' } = useLocalSearchParams<{
        type: string;
        duration: string;
    }>();
    const router = useRouter();
    const { recordSession } = useMeditationStore();

    const totalSeconds = parseInt(duration, 10) * 60;
    const prepTime = 30;
    const reflectTime = 30;
    const coreTime = Math.max(totalSeconds - prepTime - reflectTime, 60);

    const [phase, setPhase] = useState<SessionPhase>('preparation');
    const [remaining, setRemaining] = useState(prepTime);
    const [running, setRunning] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const getCurrentPhaseDuration = useCallback(() => {
        switch (phase) {
            case 'preparation': return prepTime;
            case 'core': return coreTime;
            case 'reflection': return reflectTime;
        }
    }, [phase, prepTime, coreTime, reflectTime]);

    const advancePhase = useCallback(() => {
        if (phase === 'preparation') {
            setPhase('core');
            setRemaining(coreTime);
        } else if (phase === 'core') {
            setPhase('reflection');
            setRemaining(reflectTime);
        } else {
            // Session complete
            setRunning(false);
            setShowRating(true);
        }
    }, [phase, coreTime, reflectTime]);

    useEffect(() => {
        if (!running) return;
        intervalRef.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    advancePhase();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running, advancePhase]);

    const start = useCallback(() => setRunning(true), []);

    const handleRating = useCallback(
        (rating: 1 | 2 | 3 | 4 | 5) => {
            recordSession({
                date: new Date().toISOString().slice(0, 10),
                type: type as MeditationType,
                intent: 'calm',
                duration_seconds: totalSeconds,
                completed: true,
                rating,
            });
            setShowRating(false);
            router.back();
        },
        [type, totalSeconds, recordSession, router],
    );

    const handleSkipRating = useCallback(() => {
        recordSession({
            date: new Date().toISOString().slice(0, 10),
            type: type as MeditationType,
            intent: 'calm',
            duration_seconds: totalSeconds,
            completed: true,
            rating: 3,
        });
        setShowRating(false);
        router.back();
    }, [type, totalSeconds, recordSession, router]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const phaseProgress = 1 - remaining / getCurrentPhaseDuration();

    return (
        <View style={styles.container}>
            {/* Phase indicator */}
            <View style={styles.phaseRow}>
                {(['preparation', 'core', 'reflection'] as SessionPhase[]).map((p) => (
                    <View
                        key={p}
                        style={[
                            styles.phaseDot,
                            phase === p && styles.phaseDotActive,
                            (['core', 'reflection'].indexOf(phase) > ['preparation', 'core', 'reflection'].indexOf(p)) && styles.phaseDotDone,
                        ]}
                    />
                ))}
            </View>

            <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
            <Text style={styles.typeLabel}>{MEDITATION_LABELS[type as MeditationType] || type}</Text>

            {/* Timer */}
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>{PHASE_INSTRUCTIONS[phase]}</Text>

            {/* Actions */}
            {!running && !showRating && (
                <Pressable style={styles.button} onPress={start}>
                    <Text style={styles.buttonText}>Begin</Text>
                </Pressable>
            )}

            {running && (
                <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                        setRunning(false);
                        router.back();
                    }}
                >
                    <Text style={[styles.buttonText, styles.cancelText]}>End Session</Text>
                </Pressable>
            )}

            <RatingModal
                visible={showRating}
                onSubmit={handleRating}
                onCancel={handleSkipRating}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    phaseRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    phaseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    phaseDotActive: {
        backgroundColor: '#1A1A1A',
        width: 24,
    },
    phaseDotDone: {
        backgroundColor: '#999',
    },
    phaseLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 40,
    },
    timerContainer: {
        marginBottom: 32,
    },
    timerText: {
        fontSize: 56,
        fontWeight: '200',
        color: '#1A1A1A',
        fontVariant: ['tabular-nums'],
    },
    instructions: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        maxWidth: 280,
    },
    button: {
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: '#666',
    },
});
