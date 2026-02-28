// ─────────────────────────────────────────────────────────────────────────────
// Cognitive Training Screen — Dual N-Back & Attention Switching
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import {
    initializeNBackGame,
    processNBackResponse,
    computeNBackAccuracy,
    computeNextLevel,
    gameToTrainingResult,
} from '../modules/focusTrainer/training/DualNBack';
import {
    initializeSwitchTask,
    advanceTrial,
    recordSwitchResponse,
    computeSwitchAccuracy,
    switchToTrainingResult,
} from '../modules/focusTrainer/training/AttentionSwitching';
import { NBACK_DEFAULTS, ATTENTION_SWITCH_DEFAULTS } from '../modules/focusTrainer/models/constants';
import { insertCognitiveResult, getCognitiveHistory } from '../database/repository';
import { AstraColors, AstraCard, AstraShadow, AstraRadius } from '../constants/astraTheme';

type GameMode = 'menu' | 'nback' | 'switching';

export default function CognitiveTrainingScreen() {
    const {
        nBackGame,
        switchGame,
        trainingHistory,
        setNBackGame,
        setSwitchGame,
        addTrainingResult,
    } = useFocusStore();

    const [mode, setMode] = useState<GameMode>('menu');
    const [nBackLevel, setNBackLevel] = useState(NBACK_DEFAULTS.startingLevel);
    const [highlightPos, setHighlightPos] = useState<number | null>(null);
    const [trialActive, setTrialActive] = useState(false);
    const trialStartRef = useRef(0);

    // ── Load history ───────────────────────────────────────────────────────
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const history = await getCognitiveHistory(undefined, 20);
        history.forEach(r => addTrainingResult(r));
    };

    // ── N-Back Game Logic ──────────────────────────────────────────────────
    const startNBack = () => {
        const game = initializeNBackGame(nBackLevel);
        setNBackGame(game);
        setMode('nback');
        showNextNBackTrial(game);
    };

    const showNextNBackTrial = (game: typeof nBackGame) => {
        if (!game || !game.isRunning) return;

        const pos = game.positionSequence[game.currentTrial];
        setHighlightPos(pos);
        setTrialActive(true);
        trialStartRef.current = Date.now();

        // Auto-advance after trial duration
        setTimeout(() => {
            setHighlightPos(null);
            setTrialActive(false);
        }, NBACK_DEFAULTS.trialDurationMs);
    };

    const handleNBackResponse = (posMatch: boolean, audioMatch: boolean) => {
        if (!nBackGame || !nBackGame.isRunning) return;

        const rt = Date.now() - trialStartRef.current;
        const updated = processNBackResponse(nBackGame, posMatch, audioMatch, rt);
        setNBackGame(updated);

        if (updated.isRunning) {
            setTimeout(() => showNextNBackTrial(updated), NBACK_DEFAULTS.interTrialMs);
        } else {
            finishNBack(updated);
        }
    };

    const finishNBack = async (game: NonNullable<typeof nBackGame>) => {
        const result = gameToTrainingResult(game);
        addTrainingResult(result);
        await insertCognitiveResult(result);

        const nextLevel = computeNextLevel(
            game.level,
            computeNBackAccuracy(game.responses),
        );
        setNBackLevel(nextLevel);
        setMode('menu');
        setNBackGame(null);
    };

    // ── Attention Switching Logic ──────────────────────────────────────────
    const startSwitching = () => {
        const game = initializeSwitchTask();
        setSwitchGame(game);
        setMode('switching');
        setTrialActive(true);
        trialStartRef.current = Date.now();
    };

    const handleSwitchAnswer = (answer: string) => {
        if (!switchGame || !switchGame.isRunning) return;

        const rt = Date.now() - trialStartRef.current;
        let updated = recordSwitchResponse(switchGame, answer, rt);
        updated = advanceTrial(updated);
        setSwitchGame(updated);

        if (updated.isRunning) {
            trialStartRef.current = Date.now();
        } else {
            finishSwitching(updated);
        }
    };

    const finishSwitching = async (game: NonNullable<typeof switchGame>) => {
        const result = switchToTrainingResult(game);
        addTrainingResult(result);
        await insertCognitiveResult(result);
        setMode('menu');
        setSwitchGame(null);
    };

    // ── Render: Menu ───────────────────────────────────────────────────────
    if (mode === 'menu') {
        const nBackHistory = trainingHistory.filter(r => r.type === 'dual-n-back');
        const switchHistory = trainingHistory.filter(r => r.type === 'attention-switching');

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.caption}>COGNITIVE</Text>
                <Text style={styles.title}>Training</Text>
                <Text style={styles.subtitle}>
                    Strengthen your attention through scientifically-grounded exercises
                </Text>

                {/* N-Back Card */}
                <TouchableOpacity style={styles.gameCard} onPress={startNBack}>
                    <View style={styles.gameHeader}>
                        <View style={styles.gameIconContainer}>
                            <Text style={styles.gameIconText}>N</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.gameTitle}>Dual N-Back</Text>
                            <Text style={styles.gameDesc}>
                                Match positions & sounds from {nBackLevel} steps ago
                            </Text>
                        </View>
                    </View>
                    <View style={styles.gameStats}>
                        <Text style={styles.gameStat}>Level {nBackLevel}</Text>
                        <Text style={styles.gameStat}>
                            {nBackHistory.length > 0
                                ? `Best: ${(Math.max(...nBackHistory.map(r => r.accuracy)) * 100).toFixed(0)}%`
                                : 'No history'}
                        </Text>
                    </View>
                    <View style={styles.playBtn}>
                        <Text style={styles.playBtnText}>Play →</Text>
                    </View>
                </TouchableOpacity>

                {/* Switching Card */}
                <TouchableOpacity style={styles.gameCard} onPress={startSwitching}>
                    <View style={styles.gameHeader}>
                        <View style={[styles.gameIconContainer, { backgroundColor: AstraColors.blueLight }]}>
                            <Text style={[styles.gameIconText, { color: AstraColors.blue }]}>⇄</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.gameTitle}>Attention Switching</Text>
                            <Text style={styles.gameDesc}>
                                Alternate between color and shape identification
                            </Text>
                        </View>
                    </View>
                    <View style={styles.gameStats}>
                        <Text style={styles.gameStat}>
                            {ATTENTION_SWITCH_DEFAULTS.trialsPerSession} trials
                        </Text>
                        <Text style={styles.gameStat}>
                            {switchHistory.length > 0
                                ? `Avg RT: ${Math.round(
                                    switchHistory.slice(-3).reduce((s, r) => s + r.reactionTimeMs, 0) /
                                    Math.min(3, switchHistory.length),
                                )}ms`
                                : 'No history'}
                        </Text>
                    </View>
                    <View style={styles.playBtn}>
                        <Text style={styles.playBtnText}>Play →</Text>
                    </View>
                </TouchableOpacity>

                {/* Progress Summary */}
                {trainingHistory.length > 0 && (
                    <View style={styles.progressCard}>
                        <Text style={styles.progressTitle}>Recent Progress</Text>
                        {trainingHistory.slice(0, 5).map((r, i) => (
                            <View key={i} style={styles.historyRow}>
                                <View style={[
                                    styles.historyIcon,
                                    { backgroundColor: r.type === 'dual-n-back' ? AstraColors.primaryLight : AstraColors.blueLight }
                                ]}>
                                    <Text style={styles.historyIconText}>
                                        {r.type === 'dual-n-back' ? 'N' : '⇄'}
                                    </Text>
                                </View>
                                <Text style={styles.historyAccuracy}>
                                    {(r.accuracy * 100).toFixed(0)}%
                                </Text>
                                <Text style={styles.historyRT}>{r.reactionTimeMs}ms</Text>
                                <Text style={styles.historyLevel}>L{r.level}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    }

    // ── Render: N-Back Game ─────────────────────────────────────────────────
    if (mode === 'nback' && nBackGame) {
        const accuracy = computeNBackAccuracy(nBackGame.responses);

        return (
            <View style={styles.gameContainer}>
                <View style={styles.gameInfo}>
                    <Text style={styles.gameInfoText}>
                        {nBackGame.level}-Back • Trial {nBackGame.currentTrial + 1}/
                        {nBackGame.totalTrials}
                    </Text>
                    <Text style={styles.gameInfoText}>
                        Accuracy: {(accuracy * 100).toFixed(0)}%
                    </Text>
                </View>

                {/* 3x3 Grid */}
                <View style={styles.grid}>
                    {Array.from({ length: 9 }, (_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.gridCell,
                                highlightPos === i && styles.gridCellActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Response Buttons */}
                <View style={styles.nbackButtons}>
                    <TouchableOpacity
                        style={styles.matchBtn}
                        onPress={() => handleNBackResponse(true, false)}
                    >
                        <Text style={styles.matchBtnText}>Position Match</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.matchBtn}
                        onPress={() => handleNBackResponse(false, true)}
                    >
                        <Text style={styles.matchBtnText}>Sound Match</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.matchBtn, styles.bothBtn]}
                        onPress={() => handleNBackResponse(true, true)}
                    >
                        <Text style={styles.matchBtnText}>Both Match</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.matchBtn, styles.noneBtn]}
                        onPress={() => handleNBackResponse(false, false)}
                    >
                        <Text style={styles.matchBtnText}>No Match</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Render: Attention Switching ──────────────────────────────────────────
    if (mode === 'switching' && switchGame) {
        const { currentTask, stimulus, trialIndex, totalTrials, responses } = switchGame;
        const accuracy = computeSwitchAccuracy(responses);
        const { colors, shapes } = ATTENTION_SWITCH_DEFAULTS;

        return (
            <View style={styles.gameContainer}>
                <View style={styles.gameInfo}>
                    <Text style={styles.gameInfoText}>
                        Trial {trialIndex + 1}/{totalTrials}
                    </Text>
                    <Text style={styles.gameInfoText}>
                        Accuracy: {(accuracy * 100).toFixed(0)}%
                    </Text>
                </View>

                {/* Task Indicator */}
                <View style={styles.taskIndicator}>
                    <Text style={styles.taskLabel}>
                        Identify the{' '}
                        <Text style={styles.taskHighlight}>
                            {currentTask.toUpperCase()}
                        </Text>
                    </Text>
                </View>

                {/* Stimulus */}
                <View
                    style={[
                        styles.stimulus,
                        { backgroundColor: stimulus.color },
                        stimulus.shape === 'circle' && styles.stimulusCircle,
                        stimulus.shape === 'diamond' && styles.stimulusDiamond,
                        stimulus.shape === 'triangle' && styles.stimulusTriangle,
                    ]}
                >
                    <Text style={styles.stimulusText}>{stimulus.shape}</Text>
                </View>

                {/* Answer Buttons */}
                <View style={styles.answerGrid}>
                    {(currentTask === 'color' ? colors : shapes).map((opt, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.answerBtn,
                                currentTask === 'color' && {
                                    backgroundColor: opt,
                                },
                            ]}
                            onPress={() => handleSwitchAnswer(opt)}
                        >
                            <Text style={styles.answerText}>
                                {currentTask === 'color'
                                    ? ''
                                    : opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    return null;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AstraColors.background },
    content: { padding: 20, paddingTop: 56, paddingBottom: 100 },
    caption: {
        fontSize: 11,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: AstraColors.foreground,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: AstraColors.mutedForeground,
        marginBottom: 24,
        lineHeight: 20,
    },
    gameCard: {
        ...AstraCard,
        padding: 20,
        marginBottom: 16,
    },
    gameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
    },
    gameIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: AstraColors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gameIconText: {
        fontSize: 20,
        fontWeight: '700',
        color: AstraColors.primary,
    },
    gameTitle: { fontSize: 18, fontWeight: '700', color: AstraColors.foreground },
    gameDesc: { fontSize: 13, color: AstraColors.mutedForeground, marginTop: 2 },
    gameStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gameStat: { fontSize: 13, color: AstraColors.blue },
    playBtn: {
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(92,138,108,0.2)',
    },
    playBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: AstraColors.primary,
    },
    progressCard: {
        ...AstraCard,
        padding: 20,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AstraColors.foreground,
        marginBottom: 14,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    historyIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyIconText: {
        fontSize: 14,
        fontWeight: '700',
        color: AstraColors.primary,
    },
    historyAccuracy: { fontSize: 14, color: AstraColors.primary, fontWeight: '600', width: 45 },
    historyRT: { fontSize: 13, color: AstraColors.mutedForeground, width: 55 },
    historyLevel: { fontSize: 13, color: AstraColors.blue },

    // ── Game View Styles ───────────────────────────────────────────────────
    gameContainer: {
        flex: 1,
        backgroundColor: AstraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    gameInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    gameInfoText: { fontSize: 14, color: AstraColors.mutedForeground },

    // N-Back grid
    grid: {
        width: 240,
        height: 240,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 40,
    },
    gridCell: {
        width: 74,
        height: 74,
        backgroundColor: AstraColors.card,
        borderRadius: AstraRadius.md,
        borderWidth: 1,
        borderColor: AstraColors.border,
    },
    gridCellActive: {
        backgroundColor: AstraColors.blue,
        borderColor: AstraColors.blue,
    },
    nbackButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    matchBtn: {
        ...AstraCard,
        paddingHorizontal: 20,
        paddingVertical: 14,
        minWidth: 140,
        alignItems: 'center',
    },
    bothBtn: { borderColor: AstraColors.primary },
    noneBtn: { borderColor: AstraColors.destructive },
    matchBtnText: { fontSize: 14, fontWeight: '600', color: AstraColors.foreground },

    // Switching task
    taskIndicator: {
        marginBottom: 30,
        paddingHorizontal: 24,
        paddingVertical: 12,
        ...AstraCard,
    },
    taskLabel: { fontSize: 18, color: AstraColors.mutedForeground },
    taskHighlight: {
        color: AstraColors.warning,
        fontWeight: '700',
    },
    stimulus: {
        width: 120,
        height: 120,
        borderRadius: AstraRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    stimulusCircle: { borderRadius: 60 },
    stimulusDiamond: { transform: [{ rotate: '45deg' }] },
    stimulusTriangle: {},
    stimulusText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    answerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    answerBtn: {
        ...AstraCard,
        paddingHorizontal: 24,
        paddingVertical: 14,
        minWidth: 100,
        alignItems: 'center',
    },
    answerText: {
        fontSize: 14,
        fontWeight: '600',
        color: AstraColors.foreground,
    },
});
