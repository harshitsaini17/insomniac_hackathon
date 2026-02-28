// ─────────────────────────────────────────────────────────────────────────────
// Focus Session Screen — Adaptive Pomodoro Timer
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
} from 'react-native';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import { PomodoroSession } from '../modules/focusTrainer/models/types';
import {
    computeNextSessionLength,
    computeBreakDuration,
    isSessionSuccessful,
} from '../modules/focusTrainer/math/pomodoroSurvival';
import { insertPomodoroSession, getRecentPomodoroSessions } from '../database/repository';
import { AstraColors, AstraCard, AstraShadow, AstraRadius } from '../constants/astraTheme';

export default function FocusSessionScreen() {
    const {
        isInFocusSession,
        activeSession,
        sessionTimeRemaining,
        completedSessionsToday,
        activeGoal,
        startFocusSession,
        endFocusSession,
        updateTimeRemaining,
    } = useFocusStore();

    const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
    const [sessionDuration, setSessionDuration] = useState(25 * 60 * 1000);
    const [breakDuration, setBreakDuration] = useState(5 * 60 * 1000);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sessionStartRef = useRef(0);

    // ── Load optimal session length ────────────────────────────────────────
    useEffect(() => {
        loadOptimalDuration();
    }, []);

    const loadOptimalDuration = async () => {
        const history = await getRecentPomodoroSessions(10);
        const optimization = computeNextSessionLength(
            history.map(h => ({
                ...h,
                breakDuration: h.breakDuration || 5 * 60 * 1000,
            })),
        );
        setSessionDuration(optimization.nextDuration);
        setBreakDuration(
            computeBreakDuration(completedSessionsToday),
        );
    };

    // ── Timer logic ────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'focus' || phase === 'break') {
            intervalRef.current = setInterval(() => {
                updateTimeRemaining(
                    Math.max(0, sessionTimeRemaining - 1000),
                );
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [phase, sessionTimeRemaining]);

    // Check if timer completed
    useEffect(() => {
        if (sessionTimeRemaining <= 0 && phase === 'focus') {
            handleSessionComplete(true);
        } else if (sessionTimeRemaining <= 0 && phase === 'break') {
            setPhase('idle');
            Vibration.vibrate([0, 200, 100, 200]);
        }
    }, [sessionTimeRemaining, phase]);

    // ── Pulse animation — sage green breathing ──────────────────────────────
    useEffect(() => {
        if (phase === 'focus') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [phase]);

    // ── Actions ────────────────────────────────────────────────────────────
    const handleStart = () => {
        const now = Date.now();
        sessionStartRef.current = now;

        const session: PomodoroSession = {
            goalId: activeGoal?.id,
            startTime: now,
            plannedDuration: sessionDuration,
            actualDuration: 0,
            wasSuccessful: false,
            breakDuration: 0,
        };

        startFocusSession(session);
        updateTimeRemaining(sessionDuration);
        setPhase('focus');
    };

    const handleSessionComplete = async (successful: boolean) => {
        const now = Date.now();
        const actualDuration = now - sessionStartRef.current;

        const session: PomodoroSession = {
            goalId: activeGoal?.id,
            startTime: sessionStartRef.current,
            endTime: now,
            plannedDuration: sessionDuration,
            actualDuration,
            wasSuccessful: isSessionSuccessful(actualDuration, sessionDuration),
            breakDuration,
        };

        await insertPomodoroSession(session);
        endFocusSession();

        Vibration.vibrate([0, 500, 200, 500]);

        // Start break
        updateTimeRemaining(breakDuration);
        setPhase('break');
    };

    const handleStop = () => {
        handleSessionComplete(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase('idle');
        endFocusSession();
    };

    // ── Format time ────────────────────────────────────────────────────────
    const formatTime = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const progress =
        phase === 'focus'
            ? 1 - sessionTimeRemaining / sessionDuration
            : phase === 'break'
                ? 1 - sessionTimeRemaining / breakDuration
                : 0;

    return (
        <View style={styles.container}>
            {/* ── Header Caption ──────────────────────────────────────────── */}
            <Text style={styles.headerCaption}>FOCUS MODE</Text>
            <Text style={styles.headerTitle}>Deep Work</Text>

            {/* ── Phase Indicator ────────────────────────────────────────────── */}
            <Text style={styles.phaseLabel}>
                {phase === 'idle'
                    ? 'Ready to Focus'
                    : phase === 'focus'
                        ? 'Deep Focus'
                        : 'Break Time'}
            </Text>

            {/* ── Timer Ring ─────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.timerContainer,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                {/* Outer breathing ring */}
                <View style={styles.breatheRingOuter} />
                <View style={styles.breatheRingInner} />

                <View style={styles.timerOuter}>
                    <View
                        style={[
                            styles.timerProgress,
                            {
                                borderColor: phase === 'break' ? AstraColors.blue : AstraColors.primary,
                                borderWidth: 4,
                                opacity: progress,
                            },
                        ]}
                    />
                    <View style={styles.timerInner}>
                        <Text style={styles.timerText}>
                            {phase === 'idle'
                                ? formatTime(sessionDuration)
                                : formatTime(sessionTimeRemaining)}
                        </Text>
                        <Text style={styles.timerPhase}>
                            {phase === 'idle'
                                ? `Optimized: ${Math.round(sessionDuration / 60000)}min`
                                : `${Math.round(progress * 100)}%`}
                        </Text>
                    </View>
                </View>
            </Animated.View>

            {/* ── Goal Display ───────────────────────────────────────────────── */}
            {activeGoal && (
                <View style={styles.goalBanner}>
                    <Text style={styles.goalLabel}>GOAL</Text>
                    <Text style={styles.goalTitle}>{activeGoal.title}</Text>
                </View>
            )}

            {/* ── Controls ───────────────────────────────────────────────────── */}
            <View style={styles.controls}>
                {phase === 'idle' ? (
                    <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                        <Text style={styles.startBtnText}>Start Session</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                        <Text style={styles.stopBtnText}>
                            {phase === 'focus' ? 'Stop Early' : 'Skip Break'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Stats ──────────────────────────────────────────────────────── */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{completedSessionsToday}</Text>
                    <Text style={styles.statLabel}>Sessions Today</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                        {Math.round(sessionDuration / 60000)}m
                    </Text>
                    <Text style={styles.statLabel}>Session Length</Text>
                </View>
            </View>
        </View>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AstraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    headerCaption: {
        fontSize: 11,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
        position: 'absolute',
        top: 56,
        left: 24,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: AstraColors.foreground,
        letterSpacing: -0.5,
        position: 'absolute',
        top: 74,
        left: 24,
    },
    phaseLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 40,
        letterSpacing: -0.3,
    },
    timerContainer: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breatheRingOuter: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(92,138,108,0.06)',
    },
    breatheRingInner: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(92,138,108,0.04)',
    },
    timerOuter: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: AstraColors.card,
        borderWidth: 2,
        borderColor: AstraColors.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...AstraShadow.elevated,
    },
    timerProgress: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    timerInner: {
        alignItems: 'center',
    },
    timerText: {
        fontSize: 56,
        fontWeight: '200',
        color: AstraColors.foreground,
        fontVariant: ['tabular-nums'],
    },
    timerPhase: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        marginTop: 4,
    },
    goalBanner: {
        ...AstraCard,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 32,
        borderLeftWidth: 3,
        borderLeftColor: AstraColors.primary,
        width: '100%',
    },
    goalLabel: {
        fontSize: 10,
        color: AstraColors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginTop: 4,
    },
    controls: {
        marginBottom: 32,
    },
    startBtn: {
        backgroundColor: AstraColors.primary,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 30,
        ...AstraShadow.button,
    },
    startBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: AstraColors.primaryForeground,
    },
    stopBtn: {
        backgroundColor: AstraColors.muted,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: AstraColors.destructive,
    },
    stopBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: AstraColors.destructive,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    statBox: {
        ...AstraCard,
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: AstraColors.foreground,
    },
    statLabel: {
        fontSize: 11,
        color: AstraColors.mutedForeground,
        marginTop: 4,
    },
});
