import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGoogleAuth, ConnectionStatus } from '@/hooks/google-auth';

const { width } = Dimensions.get('window');

/* ─── colour palette ─── */
const palette = {
    dark: {
        bg: '#0B0F1A',
        card: 'rgba(255,255,255,0.06)',
        cardBorder: 'rgba(255,255,255,0.10)',
        text: '#F1F3F8',
        textSecondary: '#8B93A7',
        accent: '#6C63FF',
        classroomGrad: ['#1B7A43', '#0D5C2F'] as [string, string],
        gmailGrad: ['#C62828', '#8E0000'] as [string, string],
        successBg: 'rgba(76, 175, 80, 0.15)',
        successText: '#66BB6A',
        errorBg: 'rgba(244, 67, 54, 0.15)',
        errorText: '#EF5350',
    },
    light: {
        bg: '#F4F6FC',
        card: 'rgba(255,255,255,0.85)',
        cardBorder: 'rgba(0,0,0,0.08)',
        text: '#1A1D2E',
        textSecondary: '#6B7394',
        accent: '#6C63FF',
        classroomGrad: ['#1E8E4F', '#14713D'] as [string, string],
        gmailGrad: ['#E53935', '#B71C1C'] as [string, string],
        successBg: 'rgba(76, 175, 80, 0.12)',
        successText: '#2E7D32',
        errorBg: 'rgba(244, 67, 54, 0.12)',
        errorText: '#C62828',
    },
};

/* ─── Animated checkmark ─── */
function AnimatedCheck() {
    const scale = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, []);
    return (
        <Animated.View style={[styles.checkBadge, { transform: [{ scale }] }]}>
            <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
    );
}

/* ─── Service card ─── */
interface ServiceCardProps {
    title: string;
    description: string;
    icon: string;
    gradient: [string, string];
    status: ConnectionStatus;
    email?: string;
    error?: string;
    onPress: () => void;
    colors: typeof palette.dark;
    delay: number;
}

function ServiceCard({
    title,
    description,
    icon,
    gradient,
    status,
    email,
    error,
    onPress,
    colors,
    delay,
}: ServiceCardProps) {
    const translateY = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const isError = status === 'error';

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                { transform: [{ translateY }, { scale: buttonScale }], opacity },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isConnecting || isConnected}
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.card,
                        borderColor: isConnected
                            ? colors.successText
                            : isError
                                ? colors.errorText
                                : colors.cardBorder,
                    },
                ]}
            >
                {/* Icon row */}
                <View style={styles.cardHeader}>
                    <LinearGradient
                        colors={gradient}
                        style={styles.iconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.iconEmoji}>{icon}</Text>
                    </LinearGradient>

                    {isConnected && <AnimatedCheck />}
                    {isConnecting && (
                        <ActivityIndicator size="small" color={colors.accent} />
                    )}
                </View>

                {/* Info */}
                <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    {description}
                </Text>

                {/* Status */}
                {isConnected && email && (
                    <View
                        style={[styles.statusChip, { backgroundColor: colors.successBg }]}
                    >
                        <Text style={[styles.statusText, { color: colors.successText }]}>
                            Connected as {email}
                        </Text>
                    </View>
                )}
                {isError && error && (
                    <View
                        style={[styles.statusChip, { backgroundColor: colors.errorBg }]}
                    >
                        <Text style={[styles.statusText, { color: colors.errorText }]}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* Button */}
                {!isConnected && (
                    <View
                        style={[
                            styles.connectButton,
                            {
                                backgroundColor: isConnecting
                                    ? 'rgba(108,99,255,0.3)'
                                    : colors.accent,
                            },
                        ]}
                    >
                        <Text style={styles.connectButtonText}>
                            {isConnecting
                                ? 'Connecting…'
                                : isError
                                    ? 'Retry'
                                    : 'Connect'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

/* ─── Main Screen ─── */
export default function IntegrationScreen() {
    const colorScheme = useColorScheme();
    const colors = palette[colorScheme === 'dark' ? 'dark' : 'light'];
    const { classroom, gmail, connectClassroom, connectGmail } = useGoogleAuth();

    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: headerOpacity,
                            transform: [{ translateY: headerTranslateY }],
                        },
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#6C63FF', '#AB47BC']}
                            style={styles.logo}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.logoText}>📚</Text>
                        </LinearGradient>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>
                        Connect Your{'\n'}Services
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Link Google Classroom and Gmail to unlock powerful integrations
                    </Text>
                </Animated.View>

                {/* Cards */}
                <View style={styles.cardsContainer}>
                    <ServiceCard
                        title="Google Classroom"
                        description="Access courses, assignments, and student rosters from your Classroom account."
                        icon="🎓"
                        gradient={colors.classroomGrad}
                        status={classroom.status}
                        email={classroom.userEmail}
                        error={classroom.error}
                        onPress={connectClassroom}
                        colors={colors}
                        delay={200}
                    />

                    <ServiceCard
                        title="Gmail"
                        description="Read and organize your emails to stay on top of notifications and updates."
                        icon="✉️"
                        gradient={colors.gmailGrad}
                        status={gmail.status}
                        email={gmail.userEmail}
                        error={gmail.error}
                        onPress={connectGmail}
                        colors={colors}
                        delay={400}
                    />
                </View>

                {/* Footer hint */}
                <Animated.Text
                    style={[
                        styles.footerHint,
                        {
                            color: colors.textSecondary,
                            opacity: headerOpacity,
                        },
                    ]}
                >
                    Your data is secured with Google OAuth 2.0
                </Animated.Text>
            </ScrollView>
        </View>
    );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 70 : 56,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },

    /* Header */
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#6C63FF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    logoText: {
        fontSize: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
        maxWidth: width * 0.8,
    },

    /* Cards */
    cardsContainer: {
        gap: 18,
    },
    cardWrapper: {},
    card: {
        borderRadius: 20,
        padding: 22,
        borderWidth: 1.5,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconEmoji: {
        fontSize: 26,
    },

    /* Check */
    checkBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(76,175,80,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: '700',
    },

    /* Card text */
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },

    /* Status chip */
    statusChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 14,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },

    /* Connect button */
    connectButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    connectButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* Footer */
    footerHint: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 32,
    },
});
