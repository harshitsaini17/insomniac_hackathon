// ─────────────────────────────────────────────────────────────────────────────
// ASTRA Onboarding Screen — Multi-step Onboarding Flow
// Structured scales + open-ended inputs + personalized summary
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import { useOnboardingStore } from '../modules/onboarding/store/onboardingStore';
import {
    STRUCTURED_QUESTIONS,
    OPEN_ENDED_QUESTIONS,
} from '../modules/onboarding/models/onboardingConstants';
import {
    OnboardingAnswers,
    OnboardingStep,
    ONBOARDING_STEPS,
    QuestionItem,
} from '../modules/onboarding/models/onboardingTypes';
import { buildUserProfile } from '../modules/onboarding/engine/profileBuilder';
import {
    setUserProfile,
    setOnboardingComplete,
} from '../storage/mmkvStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Colors (Astra warm-neutral palette) ──────────────────────────────────────

const COLORS = {
    bg: '#FAF8F5',
    card: '#FFFFFF',
    border: '#ECEAE7',
    accent: '#5C8A6C',
    accentDim: '#E6F0E8',
    text: '#24272C',
    textSecondary: '#8C8078',
    textMuted: '#B0A89F',
    error: '#CC4444',
    success: '#4DAD6D',
    gradientStart: '#5C8A6C',
    gradientEnd: '#8B6EA5',
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen({
    onComplete,
}: {
    onComplete: () => void;
}) {
    const {
        currentStepIndex,
        currentStep,
        answers,
        profile,
        stepErrors,
        goToNextStep,
        goToPreviousStep,
        setAnswer,
        setProfile,
        setStepError,
        clearStepErrors,
        markComplete,
    } = useOnboardingStore();

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // ── Animations ───────────────────────────────────────────────────────

    const animateTransition = useCallback(
        (direction: 'forward' | 'back', callback: () => void) => {
            const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                callback();
                slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }),
                ]).start();
            });
        },
        [fadeAnim, slideAnim],
    );

    // ── Validation ───────────────────────────────────────────────────────

    const validateCurrentStep = (): boolean => {
        clearStepErrors();
        const step = currentStep;

        if (step === 'welcome' || step === 'summary') return true;

        const questionsForStep = getQuestionsForStep(step);
        let valid = true;

        for (const q of questionsForStep) {
            const key = q.id as keyof OnboardingAnswers;
            const value = answers[key];

            if (q.required) {
                if (q.type === 'likert' && (value === undefined || value === null)) {
                    setStepError(q.id, 'Please rate this item');
                    valid = false;
                }
                if (q.type === 'open_ended' && (!value || String(value).trim().length < 3)) {
                    setStepError(q.id, 'Please provide a meaningful response');
                    valid = false;
                }
            }
        }

        return valid;
    };

    // ── Navigation ───────────────────────────────────────────────────────

    const handleNext = () => {
        if (!validateCurrentStep()) return;

        // If this is the last input step, build profile
        if (currentStep === 'open_weakness') {
            const fullAnswers = answers as OnboardingAnswers;
            const userProfile = buildUserProfile(fullAnswers);
            setProfile(userProfile);

            // Persist
            setUserProfile(userProfile);
        }

        if (currentStep === 'summary') {
            // Complete onboarding
            setOnboardingComplete(true);
            markComplete();
            onComplete();
            return;
        }

        animateTransition('forward', goToNextStep);
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            animateTransition('back', goToPreviousStep);
        }
    };

    // ── Progress ─────────────────────────────────────────────────────────

    const progress = (currentStepIndex + 1) / ONBOARDING_STEPS.length;

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress * 100}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
                </Text>
            </View>

            {/* Step Content */}
            <Animated.View
                style={[
                    styles.stepContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStep(
                        currentStep,
                        answers,
                        stepErrors,
                        setAnswer,
                        profile,
                    )}
                </ScrollView>
            </Animated.View>

            {/* Navigation Buttons */}
            <View style={styles.navContainer}>
                {currentStepIndex > 0 && currentStep !== 'summary' && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        currentStepIndex === 0 && styles.nextButtonFull,
                    ]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === 'summary'
                            ? 'Start Your Journey →'
                            : currentStep === 'welcome'
                                ? 'Begin →'
                                : 'Continue →'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ── Step Router ──────────────────────────────────────────────────────────────

function renderStep(
    step: OnboardingStep,
    answers: Partial<OnboardingAnswers>,
    errors: Record<string, string>,
    setAnswer: <K extends keyof OnboardingAnswers>(
        key: K,
        value: OnboardingAnswers[K],
    ) => void,
    profile: ReturnType<typeof buildUserProfile> | null,
) {
    switch (step) {
        case 'welcome':
            return <WelcomeStep />;
        case 'structured_1':
        case 'structured_2':
        case 'structured_3':
            return (
                <LikertStep
                    group={step}
                    answers={answers}
                    errors={errors}
                    setAnswer={setAnswer}
                />
            );
        case 'open_goal':
        case 'open_distraction':
        case 'open_emotion':
        case 'open_relationship':
        case 'open_future_self':
        case 'open_weakness':
            return (
                <OpenEndedStep
                    group={step}
                    answers={answers}
                    errors={errors}
                    setAnswer={setAnswer}
                />
            );
        case 'summary':
            return <SummaryStep profile={profile} />;
        default:
            return null;
    }
}

// ── Welcome Step ─────────────────────────────────────────────────────────────

function WelcomeStep() {
    return (
        <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeLogo}>✦ ASTRA</Text>
            <Text style={styles.welcomeTitle}>
                Let's personalize{'\n'}your experience
            </Text>
            <Text style={styles.welcomeSubtitle}>
                Answer a few questions so we can customize your focus training.
                There are no right or wrong answers — just be honest.
            </Text>
            <View style={styles.welcomeFeatures}>
                <FeatureRow icon="🧠" text="Understand your focus patterns" />
                <FeatureRow icon="🎯" text="Set your primary goal" />
                <FeatureRow icon="⚡" text="Calibrate nudge intensity" />
                <FeatureRow icon="🔒" text="Everything stays on your device" />
            </View>
        </View>
    );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

// ── Likert Scale Step ────────────────────────────────────────────────────────

function LikertStep({
    group,
    answers,
    errors,
    setAnswer,
}: {
    group: string;
    answers: Partial<OnboardingAnswers>;
    errors: Record<string, string>;
    setAnswer: <K extends keyof OnboardingAnswers>(
        key: K,
        value: OnboardingAnswers[K],
    ) => void;
}) {
    const questions = STRUCTURED_QUESTIONS.filter(q => q.group === group);

    const groupTitles: Record<string, string> = {
        structured_1: 'Self-Awareness',
        structured_2: 'Personality',
        structured_3: 'Preferences',
    };

    return (
        <View>
            <Text style={styles.stepTitle}>{groupTitles[group] || 'Questions'}</Text>
            <Text style={styles.stepDescription}>
                Rate each statement from 1 (Strongly Disagree) to 7 (Strongly Agree)
            </Text>
            {questions.map(q => (
                <View key={q.id} style={styles.questionCard}>
                    <Text style={styles.questionText}>{q.prompt}</Text>
                    {q.scaleLabels && (
                        <View style={styles.scaleLabelRow}>
                            <Text style={styles.scaleLabelText}>{q.scaleLabels[0]}</Text>
                            <Text style={styles.scaleLabelText}>{q.scaleLabels[1]}</Text>
                        </View>
                    )}
                    <View style={styles.likertRow}>
                        {[1, 2, 3, 4, 5, 6, 7].map(val => {
                            const key = q.id as keyof OnboardingAnswers;
                            const selected = answers[key] === val;
                            return (
                                <TouchableOpacity
                                    key={val}
                                    style={[
                                        styles.likertButton,
                                        selected && styles.likertButtonSelected,
                                    ]}
                                    onPress={() => setAnswer(key, val as any)}
                                >
                                    <Text
                                        style={[
                                            styles.likertButtonText,
                                            selected && styles.likertButtonTextSelected,
                                        ]}
                                    >
                                        {val}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {errors[q.id] && (
                        <Text style={styles.errorText}>{errors[q.id]}</Text>
                    )}
                </View>
            ))}
        </View>
    );
}

// ── Open-Ended Step ──────────────────────────────────────────────────────────

function OpenEndedStep({
    group,
    answers,
    errors,
    setAnswer,
}: {
    group: string;
    answers: Partial<OnboardingAnswers>;
    errors: Record<string, string>;
    setAnswer: <K extends keyof OnboardingAnswers>(
        key: K,
        value: OnboardingAnswers[K],
    ) => void;
}) {
    const question = OPEN_ENDED_QUESTIONS.find(q => q.group === group);
    if (!question) return null;

    const key = question.id as keyof OnboardingAnswers;
    const value = (answers[key] as string) || '';

    return (
        <View>
            <Text style={styles.stepTitle}>{question.prompt}</Text>
            {question.examples && question.examples.length > 0 && (
                <View style={styles.examplesContainer}>
                    <Text style={styles.examplesLabel}>Examples:</Text>
                    {question.examples.map((ex, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.exampleChip}
                            onPress={() => setAnswer(key, ex as any)}
                        >
                            <Text style={styles.exampleChipText}>{ex}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={text => setAnswer(key, text as any)}
                placeholder="Type your answer here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />
            {errors[question.id] && (
                <Text style={styles.errorText}>{errors[question.id]}</Text>
            )}
        </View>
    );
}

// ── Summary Step ─────────────────────────────────────────────────────────────

function SummaryStep({
    profile,
}: {
    profile: ReturnType<typeof buildUserProfile> | null;
}) {
    if (!profile) {
        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.stepTitle}>Building your profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.summaryContainer}>
            <Text style={styles.summaryIcon}>✦</Text>
            <Text style={styles.summaryTitle}>Your ASTRA Profile</Text>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                    {profile.personalizedSummary}
                </Text>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
                <MetricCard
                    label="Focus Baseline"
                    value={`${Math.round(profile.baselineFocusEstimate * 100)}%`}
                    color={COLORS.accent}
                />
                <MetricCard
                    label="Goal Urgency"
                    value={`${Math.round(profile.goalUrgencyScore * 100)}%`}
                    color="#D4823A"
                />
                <MetricCard
                    label="Self-Efficacy"
                    value={`${Math.round(profile.selfEfficacyScore * 100)}%`}
                    color={COLORS.success}
                />
                <MetricCard
                    label="Strictness Fit"
                    value={`${Math.round(profile.strictnessCompatibility * 100)}%`}
                    color="#8B6EA5"
                />
            </View>

            {/* Goal */}
            <View style={styles.goalCard}>
                <Text style={styles.goalLabel}>Your Goal</Text>
                <Text style={styles.goalText}>{profile.goalText}</Text>
            </View>

            {/* Future Self */}
            <View style={styles.goalCard}>
                <Text style={styles.goalLabel}>Your Future Self</Text>
                <Text style={styles.goalText}>{profile.idealFutureSelf}</Text>
            </View>

            <Text style={styles.privacyNote}>
                🔒 All data stays on your device. You can edit anytime in Settings.
            </Text>
        </View>
    );
}

function MetricCard({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: string;
}) {
    return (
        <View style={[styles.metricCard, { borderColor: color + '40' }]}>
            <Text style={[styles.metricValue, { color }]}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getQuestionsForStep(step: OnboardingStep): QuestionItem[] {
    if (step.startsWith('structured_')) {
        return STRUCTURED_QUESTIONS.filter(q => q.group === step);
    }
    if (step.startsWith('open_')) {
        return OPEN_ENDED_QUESTIONS.filter(q => q.group === step);
    }
    return [];
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 12,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.accent,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },

    // Step
    stepContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
        lineHeight: 30,
    },
    stepDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },

    // Welcome
    welcomeContainer: {
        paddingTop: 40,
    },
    welcomeLogo: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.accent,
        letterSpacing: 4,
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        lineHeight: 40,
        marginBottom: 16,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 32,
    },
    welcomeFeatures: {
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        fontSize: 20,
    },
    featureText: {
        fontSize: 16,
        color: COLORS.text,
    },

    // Question Card
    questionCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#B4AFA8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    questionText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    scaleLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    scaleLabelText: {
        fontSize: 11,
        color: COLORS.textMuted,
        maxWidth: '40%',
    },

    // Likert
    likertRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
    },
    likertButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.bg,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    likertButtonSelected: {
        backgroundColor: COLORS.accentDim,
        borderColor: COLORS.accent,
    },
    likertButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    likertButtonTextSelected: {
        color: COLORS.accent,
    },

    // Open-ended
    textInput: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
        minHeight: 120,
        marginTop: 16,
    },
    examplesContainer: {
        marginTop: 16,
    },
    examplesLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exampleChip: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignSelf: 'flex-start',
    },
    exampleChipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },

    // Error
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: 6,
    },

    // Navigation
    navContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    backButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    nextButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        shadowColor: '#5C8A6C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 3,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Summary
    summaryContainer: {
        paddingTop: 20,
        alignItems: 'center',
    },
    summaryIcon: {
        fontSize: 40,
        color: COLORS.accent,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.accent + '30',
        width: '100%',
    },
    summaryText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 24,
    },

    // Metrics
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        width: '100%',
        marginBottom: 20,
    },
    metricCard: {
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    metricLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Goal
    goalCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        width: '100%',
    },
    goalLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    goalText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
    },

    // Privacy
    privacyNote: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 16,
    },
});
