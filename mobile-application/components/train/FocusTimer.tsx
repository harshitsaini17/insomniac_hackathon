import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface FocusTimerProps {
    durationSeconds: number;
    onComplete: (elapsed: number) => void;
    onCancel: () => void;
    difficulty: number;
}

export function FocusTimer({ durationSeconds, onComplete, onCancel, difficulty }: FocusTimerProps) {
    const [remaining, setRemaining] = useState(durationSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);

    const start = useCallback(() => {
        setRunning(true);
        startTimeRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (!running) return;
        intervalRef.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    setRunning(false);
                    onComplete(durationSeconds);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running, durationSeconds, onComplete]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const progress = 1 - remaining / durationSeconds;

    return (
        <View style={styles.container}>
            <Text style={styles.diffLabel}>Level {difficulty}</Text>

            <View style={styles.timerRing}>
                <View
                    style={[
                        styles.progressFill,
                        { height: `${progress * 100}%` },
                    ]}
                />
                <Text style={styles.timerText}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </Text>
            </View>

            {!running ? (
                <Pressable style={styles.button} onPress={start}>
                    <Text style={styles.buttonText}>Start</Text>
                </Pressable>
            ) : (
                <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                    <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    diffLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    timerRing: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        overflow: 'hidden',
    },
    progressFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    timerText: {
        fontSize: 48,
        fontWeight: '300',
        color: '#1A1A1A',
        fontVariant: ['tabular-nums'],
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
