// ─────────────────────────────────────────────────────────────────────────────
// NudgeOverlay — Adaptive Nudge Popup Component
// Displays personalized nudges from the Behavioral Orchestrator
// Adapts visual style based on tone and priority
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import { useOrchestratorStore } from '../modules/agent/store/orchestratorStore';
import type { NudgePayload, NudgeAction } from '../modules/agent/types/orchestratorTypes';
import type { NudgeTone } from '../modules/onboarding/models/onboardingTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// Theme Maps
// ═══════════════════════════════════════════════════════════════════════════════

const TONE_THEMES: Record<NudgeTone, {
    bg: string; accent: string; text: string; subtitle: string; border: string;
}> = {
    supportive: {
        bg: '#F0F7FF',
        accent: '#3B82F6',
        text: '#1E293B',
        subtitle: '#64748B',
        border: '#BFDBFE',
    },
    sharp: {
        bg: '#FEF2F2',
        accent: '#DC2626',
        text: '#1E293B',
        subtitle: '#64748B',
        border: '#FECACA',
    },
    challenge: {
        bg: '#FFFBEB',
        accent: '#D97706',
        text: '#1E293B',
        subtitle: '#64748B',
        border: '#FDE68A',
    },
    confidence_building: {
        bg: '#F0FDF4',
        accent: '#16A34A',
        text: '#1E293B',
        subtitle: '#64748B',
        border: '#BBF7D0',
    },
};

const PRIORITY_GLOW: Record<string, string> = {
    urgent: '#DC262640',
    high: '#D9770640',
    medium: '#3B82F620',
    low: '#64748B10',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

interface NudgeOverlayProps {
    onNavigate?: (screen: string) => void;
}

export default function NudgeOverlay({ onNavigate }: NudgeOverlayProps) {
    const { currentNudge, dismissNudge, snoozeNudge, acceptNudge } = useOrchestratorStore();
    const slideAnim = useRef(new Animated.Value(300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentNudge) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 45,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            slideAnim.setValue(300);
            fadeAnim.setValue(0);
        }
    }, [currentNudge]);

    if (!currentNudge) return null;

    const theme = TONE_THEMES[currentNudge.tone] || TONE_THEMES.supportive;
    const glowColor = PRIORITY_GLOW[currentNudge.priority] || PRIORITY_GLOW.low;

    const handleAction = (action: NudgeAction) => {
        switch (action.action) {
            case 'accept':
                acceptNudge();
                break;
            case 'dismiss':
                dismissNudge();
                break;
            case 'snooze':
                snoozeNudge(5 * 60 * 1000); // 5 minutes
                break;
            case 'navigate':
                acceptNudge();
                if (action.target && onNavigate) {
                    onNavigate(action.target);
                }
                break;
        }
    };

    return (
        <Modal transparent visible animationType="none">
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.bg,
                            borderColor: theme.border,
                            shadowColor: glowColor,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.icon}>{currentNudge.icon}</Text>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: theme.text }]}>
                                {currentNudge.title}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: theme.accent + '20' }]}>
                                <Text style={[styles.badgeText, { color: theme.accent }]}>
                                    {currentNudge.contextMode.replace('-', ' ')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Message */}
                    <Text style={[styles.message, { color: theme.subtitle }]}>
                        {currentNudge.message}
                    </Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {currentNudge.actions.map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.actionBtn,
                                    action.isPrimary
                                        ? { backgroundColor: theme.accent }
                                        : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
                                ]}
                                onPress={() => handleAction(action)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.actionText,
                                        { color: action.isPrimary ? '#FFFFFF' : theme.subtitle },
                                    ]}
                                >
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        width: SCREEN_WIDTH - 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 36,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
