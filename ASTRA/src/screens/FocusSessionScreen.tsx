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

    // ── Pulse animation ────────────────────────────────────────────────────
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
            {/* ── Phase Indicator ────────────────────────────────────────────── */}
            <Text style={styles.phaseLabel}>
                {phase === 'idle'
                    ? 'Ready to Focus'
                    : phase === 'focus'
                        ? '🎯 Deep Focus'
                        : '☕ Break Time'}
            </Text>

            {/* ── Timer Ring ─────────────────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.timerContainer,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                <View style={styles.timerOuter}>
                    <View
                        style={[
                            styles.timerProgress,
                            {
                                borderColor: phase === 'break' ? '#58A6FF' : '#00E676',
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
                    <Text style={styles.goalLabel}>Goal</Text>
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
        backgroundColor: '#0D1117',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    phaseLabel: {
        fontSize: 20,
        fontWeight: '700',
        color: '#E6EDF3',
        marginBottom: 40,
        letterSpacing: 1,
    },
    timerContainer: {
        marginBottom: 40,
    },
    timerOuter: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: '#161B22',
        borderWidth: 2,
        borderColor: '#30363D',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#E6EDF3',
        fontVariant: ['tabular-nums'],
    },
    timerPhase: {
        fontSize: 13,
        color: '#8B949E',
        marginTop: 4,
    },
    goalBanner: {
        backgroundColor: '#161B22',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 32,
        borderLeftWidth: 3,
        borderLeftColor: '#58A6FF',
        width: '100%',
    },
    goalLabel: {
        fontSize: 10,
        color: '#8B949E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E6EDF3',
        marginTop: 4,
    },
    controls: {
        marginBottom: 32,
    },
    startBtn: {
        backgroundColor: '#238636',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 30,
    },
    startBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    stopBtn: {
        backgroundColor: '#21262D',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#F85149',
    },
    stopBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F85149',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    statBox: {
        backgroundColor: '#161B22',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#21262D',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#E6EDF3',
    },
    statLabel: {
        fontSize: 11,
        color: '#8B949E',
        marginTop: 4,
    },
});
