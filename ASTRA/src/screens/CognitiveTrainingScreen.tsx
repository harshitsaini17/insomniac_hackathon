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
                <Text style={styles.title}>🧠 Cognitive Training</Text>
                <Text style={styles.subtitle}>
                    Strengthen your attention through scientifically-grounded exercises
                </Text>

                {/* N-Back Card */}
                <TouchableOpacity style={styles.gameCard} onPress={startNBack}>
                    <View style={styles.gameHeader}>
                        <Text style={styles.gameEmoji}>🔢</Text>
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
                        <Text style={styles.gameEmoji}>🔄</Text>
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
                        <Text style={styles.progressTitle}>📈 Recent Progress</Text>
                        {trainingHistory.slice(0, 5).map((r, i) => (
                            <View key={i} style={styles.historyRow}>
                                <Text style={styles.historyType}>
                                    {r.type === 'dual-n-back' ? '🔢' : '🔄'}
                                </Text>
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
    container: { flex: 1, backgroundColor: '#0D1117' },
    content: { padding: 16, paddingBottom: 100 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#E6EDF3',
        marginTop: 8,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8B949E',
        marginBottom: 24,
        lineHeight: 20,
    },
    gameCard: {
        backgroundColor: '#161B22',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#21262D',
    },
    gameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 12,
    },
    gameEmoji: { fontSize: 36 },
    gameTitle: { fontSize: 18, fontWeight: '700', color: '#E6EDF3' },
    gameDesc: { fontSize: 13, color: '#8B949E', marginTop: 2 },
    gameStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gameStat: { fontSize: 13, color: '#58A6FF' },
    playBtn: {
        backgroundColor: '#1A3A2A',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#238636',
    },
    playBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3FB950',
    },
    progressCard: {
        backgroundColor: '#161B22',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#21262D',
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E6EDF3',
        marginBottom: 14,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    historyType: { fontSize: 18 },
    historyAccuracy: { fontSize: 14, color: '#3FB950', fontWeight: '600', width: 45 },
    historyRT: { fontSize: 13, color: '#8B949E', width: 55 },
    historyLevel: { fontSize: 13, color: '#58A6FF' },

    // ── Game View Styles ───────────────────────────────────────────────────
    gameContainer: {
        flex: 1,
        backgroundColor: '#0D1117',
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
    gameInfoText: { fontSize: 14, color: '#8B949E' },

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
        backgroundColor: '#161B22',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#21262D',
    },
    gridCellActive: {
        backgroundColor: '#1F6FEB',
        borderColor: '#58A6FF',
    },
    nbackButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    matchBtn: {
        backgroundColor: '#161B22',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#30363D',
        minWidth: 140,
        alignItems: 'center',
    },
    bothBtn: { borderColor: '#3FB950' },
    noneBtn: { borderColor: '#F85149' },
    matchBtnText: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },

    // Switching task
    taskIndicator: {
        marginBottom: 30,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#161B22',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#30363D',
    },
    taskLabel: { fontSize: 18, color: '#8B949E' },
    taskHighlight: {
        color: '#FFD740',
        fontWeight: '700',
    },
    stimulus: {
        width: 120,
        height: 120,
        borderRadius: 16,
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
        backgroundColor: '#161B22',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#30363D',
        minWidth: 100,
        alignItems: 'center',
    },
    answerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E6EDF3',
    },
});
