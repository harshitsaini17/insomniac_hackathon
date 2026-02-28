// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Screen — Focus Home
// Shows: AFI gauge, CRS, focus time, goals, distractive apps, quick Pomodoro
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import { getUsageSessions, getDailyAppStats } from '../modules/focusTrainer/services/UsageStatsService';
import { getHealthSignals } from '../modules/focusTrainer/services/HealthService';
import { computeAFI } from '../modules/focusTrainer/math/attentionFragmentation';
import { computeDistractivenessScores } from '../modules/focusTrainer/math/distractivenessScore';
import { computeCRS, getCRSSuggestion } from '../modules/focusTrainer/math/cognitiveReadiness';
import { computeImpulsivityIndex } from '../modules/focusTrainer/math/personalityStrictness';
import { AstraColors, AstraCard, AstraShadow, AstraRadius } from '../constants/astraTheme';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
    const {
        currentAFI,
        currentCRS,
        currentStrictness,
        distractiveApps,
        activeGoal,
        isInFocusSession,
        completedSessionsToday,
        personality,
        setAFI,
        setCRS,
        setStrictness,
        setDistractiveApps,
    } = useFocusStore();

    // ── Load data on mount ──────────────────────────────────────────────────
    const refreshData = useCallback(async () => {
        try {
            const now = Date.now();
            const oneHourAgo = now - 60 * 60 * 1000;

            // Fetch usage sessions
            const sessions = await getUsageSessions(oneHourAgo, now);
            const afi = computeAFI(sessions, 60 * 60 * 1000);
            setAFI(afi);

            // Fetch health & compute CRS
            const health = await getHealthSignals();
            const crs = computeCRS(health, afi.score);
            setCRS(crs);

            // Compute strictness
            const strictness = computeImpulsivityIndex(personality);
            setStrictness(strictness);

            // Fetch daily stats & classify apps
            const dailyStats = await getDailyAppStats(now);
            const dsResults = computeDistractivenessScores(dailyStats);
            setDistractiveApps(dsResults.filter(r => r.isDistractive));
        } catch (err) {
            console.error('[Dashboard] Error refreshing:', err);
        }
    }, [personality]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // ── AFI Color ───────────────────────────────────────────────────────────
    const getAFIColor = (level: string) => {
        switch (level) {
            case 'deep': return AstraColors.primary;
            case 'moderate': return AstraColors.warning;
            case 'fragmented': return AstraColors.destructive;
            default: return AstraColors.mutedForeground;
        }
    };

    const afiScore = currentAFI?.score ?? 0.5;
    const afiLevel = currentAFI?.level ?? 'moderate';
    const crsScore = currentCRS?.score ?? 0.5;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <Text style={styles.headerCaption}>FOCUS TRAINER</Text>
                <Text style={styles.headerTitle}>Insights</Text>
            </View>

            {/* ── AFI Card ───────────────────────────────────────────────────── */}
            <View style={[styles.card, styles.afiCard]}>
                <Text style={styles.cardLabel}>ATTENTION FRAGMENTATION</Text>
                <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeOuter}>
                        <View
                            style={[
                                styles.gaugeInner,
                                {
                                    width: `${(1 - afiScore) * 100}%`,
                                    backgroundColor: getAFIColor(afiLevel),
                                },
                            ]}
                        />
                    </View>
                    <Text
                        style={[styles.afiLevel, { color: getAFIColor(afiLevel) }]}
                    >
                        {afiLevel.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.scoreText}>
                    {(afiScore * 100).toFixed(0)}% fragmented
                </Text>
            </View>

            {/* ── CRS Card ───────────────────────────────────────────────────── */}
            <View style={[styles.card]}>
                <Text style={styles.cardLabel}>COGNITIVE READINESS</Text>
                <Text style={styles.crsScore}>
                    {(crsScore * 100).toFixed(0)}%
                </Text>
                {currentCRS && (
                    <Text style={styles.crsRecommendation}>
                        {getCRSSuggestion(currentCRS)}
                    </Text>
                )}
            </View>

            {/* ── Quick Actions ──────────────────────────────────────────────── */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.focusBtn]}
                    onPress={() => navigation.navigate('FocusSession')}
                >
                    <Text style={styles.actionIcon}>◎</Text>
                    <Text style={styles.actionText}>
                        {isInFocusSession ? 'Resume' : 'Focus'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.trainBtn]}
                    onPress={() => navigation.navigate('Training')}
                >
                    <Text style={styles.actionIcon}>◆</Text>
                    <Text style={styles.actionText}>Train</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.analyticsBtn]}
                    onPress={() => navigation.navigate('Heatmap')}
                >
                    <Text style={styles.actionIcon}>▥</Text>
                    <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
            </View>

            {/* ── Today's Stats ──────────────────────────────────────────────── */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>TODAY</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{completedSessionsToday}</Text>
                        <Text style={styles.statLabel}>Sessions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {currentAFI?.switchesPerHour.toFixed(0) ?? '—'}
                        </Text>
                        <Text style={styles.statLabel}>Switches/hr</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {currentAFI?.unlocksPerHour.toFixed(0) ?? '—'}
                        </Text>
                        <Text style={styles.statLabel}>Unlocks/hr</Text>
                    </View>
                </View>
            </View>

            {/* ── Active Goal ────────────────────────────────────────────────── */}
            {activeGoal && (
                <View style={[styles.card, styles.goalCard]}>
                    <Text style={styles.cardLabel}>ACTIVE GOAL</Text>
                    <Text style={styles.goalTitle}>{activeGoal.title}</Text>
                    <View style={styles.importanceBar}>
                        <View
                            style={[
                                styles.importanceFill,
                                { width: `${activeGoal.importance * 100}%` },
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* ── Distractive Apps ───────────────────────────────────────────── */}
            {distractiveApps.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>⚠ DISTRACTIVE APPS</Text>
                    {distractiveApps.slice(0, 5).map((app, i) => (
                        <View key={i} style={styles.appRow}>
                            <Text style={styles.appName}>{app.appName}</Text>
                            <View style={styles.dsBar}>
                                <View
                                    style={[
                                        styles.dsFill,
                                        { width: `${app.score * 100}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.dsScore}>
                                {(app.score * 100).toFixed(0)}%
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* ── Strictness Info ────────────────────────────────────────────── */}
            {currentStrictness && (
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>BLOCKING LEVEL</Text>
                    <Text style={styles.strictnessLabel}>
                        {currentStrictness.label.replace(/-/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.strictnessNote}>
                        Level {currentStrictness.recommendedLevel} •{' '}
                        Impulsivity: {(currentStrictness.impulsivityIndex * 100).toFixed(0)}%
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AstraColors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 20,
        paddingTop: 50,
    },
    headerCaption: {
        fontSize: 11,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: AstraColors.foreground,
        letterSpacing: -0.5,
    },
    card: {
        ...AstraCard,
        padding: 20,
        marginBottom: 12,
    },
    afiCard: {},
    goalCard: {
        borderLeftWidth: 3,
        borderLeftColor: AstraColors.primary,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: AstraColors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    gaugeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gaugeOuter: {
        flex: 1,
        height: 12,
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 6,
        overflow: 'hidden',
    },
    gaugeInner: {
        height: '100%',
        borderRadius: 6,
    },
    afiLevel: {
        fontSize: 14,
        fontWeight: '700',
        width: 100,
        textAlign: 'right',
    },
    scoreText: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        marginTop: 8,
    },
    crsScore: {
        fontSize: 48,
        fontWeight: '800',
        color: AstraColors.blue,
        textAlign: 'center',
    },
    crsRecommendation: {
        fontSize: 14,
        color: AstraColors.mutedForeground,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 20,
        borderRadius: AstraRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    focusBtn: {
        backgroundColor: AstraColors.primaryLight,
        borderWidth: 1,
        borderColor: 'rgba(92,138,108,0.2)',
    },
    trainBtn: {
        backgroundColor: AstraColors.blueLight,
        borderWidth: 1,
        borderColor: 'rgba(91,148,200,0.15)',
    },
    analyticsBtn: {
        backgroundColor: AstraColors.meditationLight,
        borderWidth: 1,
        borderColor: 'rgba(139,110,165,0.15)',
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 6,
        color: AstraColors.foreground,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: AstraColors.foreground,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: AstraColors.foreground,
    },
    statLabel: {
        fontSize: 11,
        color: AstraColors.mutedForeground,
        marginTop: 4,
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AstraColors.foreground,
    },
    importanceBar: {
        height: 4,
        backgroundColor: AstraColors.primaryLight,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    importanceFill: {
        height: '100%',
        backgroundColor: AstraColors.primary,
        borderRadius: 2,
    },
    appRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    appName: {
        width: 80,
        fontSize: 13,
        color: AstraColors.foreground,
    },
    dsBar: {
        flex: 1,
        height: 6,
        backgroundColor: AstraColors.muted,
        borderRadius: 3,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    dsFill: {
        height: '100%',
        backgroundColor: AstraColors.destructive,
        borderRadius: 3,
    },
    dsScore: {
        width: 40,
        fontSize: 12,
        color: AstraColors.mutedForeground,
        textAlign: 'right',
    },
    strictnessLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: AstraColors.foreground,
    },
    strictnessNote: {
        fontSize: 13,
        color: AstraColors.mutedForeground,
        marginTop: 4,
    },
});
