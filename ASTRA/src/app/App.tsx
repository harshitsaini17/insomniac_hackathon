// ─────────────────────────────────────────────────────────────────────────────
// App Entry Point — ASTRA Focus Trainer
// With onboarding flow integration
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from './Navigation';
import { initializeDatabase } from '../database/repository';
import { scheduleAllTasks } from '../modules/focusTrainer/services/BackgroundTaskService';
import { useFocusStore } from '../modules/focusTrainer/store/focusStore';
import {
    getPersonalityProfile,
    isOnboardingComplete,
    getUserProfile,
} from '../storage/mmkvStore';
import OnboardingScreen from '../screens/OnboardingScreen';
import { AstraColors } from '../constants/astraTheme';

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const setPersonality = useFocusStore(s => s.setPersonality);
    const setInitialized = useFocusStore(s => s.setInitialized);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // 1. Initialize database
            await initializeDatabase();

            // 2. Check if onboarding is complete
            const onboarded = isOnboardingComplete();

            if (!onboarded) {
                setShowOnboarding(true);
                setIsLoading(false);
                return;
            }

            // 3. Load cached personality from onboarding profile or fallback
            const userProfile = getUserProfile();
            if (userProfile) {
                setPersonality({
                    conscientiousness: userProfile.bigFive.conscientiousness,
                    neuroticism: userProfile.bigFive.neuroticism,
                });
            } else {
                const personality = getPersonalityProfile();
                setPersonality(personality);
            }

            // 4. Schedule background tasks
            await scheduleAllTasks();

            // 5. Mark initialized
            setInitialized(true);
            setIsLoading(false);
        } catch (err) {
            console.error('[App] Initialization error:', err);
            setIsLoading(false);
        }
    };

    const handleOnboardingComplete = async () => {
        // Load the new profile
        const userProfile = getUserProfile();
        if (userProfile) {
            setPersonality({
                conscientiousness: userProfile.bigFive.conscientiousness,
                neuroticism: userProfile.bigFive.neuroticism,
            });
        }

        // Schedule background tasks
        await scheduleAllTasks();

        // Transition to main app
        setInitialized(true);
        setShowOnboarding(false);
    };

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <StatusBar barStyle="dark-content" backgroundColor={AstraColors.background} />
                <Text style={styles.logo}>ASTRA</Text>
                <ActivityIndicator size="large" color={AstraColors.primary} />
                <Text style={styles.loadingText}>Initializing Focus Trainer...</Text>
            </View>
        );
    }

    if (showOnboarding) {
        return (
            <>
                <StatusBar barStyle="dark-content" backgroundColor={AstraColors.background} />
                <OnboardingScreen onComplete={handleOnboardingComplete} />
            </>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={AstraColors.background} />
            <Navigation />
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: AstraColors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 48,
        fontWeight: '800',
        color: AstraColors.primary,
        letterSpacing: 6,
        marginBottom: 24,
    },
    loadingText: {
        fontSize: 14,
        color: AstraColors.mutedForeground,
        marginTop: 16,
    },
});
