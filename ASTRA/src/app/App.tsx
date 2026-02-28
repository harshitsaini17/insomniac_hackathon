// ─────────────────────────────────────────────────────────────────────────────
// App Entry Point — ASTRA Focus Trainer
// With onboarding flow integration
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
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
import SplashScreen from '../screens/SplashScreen';
import { AstraColors } from '../constants/astraTheme';

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const setPersonality = useFocusStore(s => s.setPersonality);
    const setInitialized = useFocusStore(s => s.setInitialized);

    const initializeApp = async () => {
        try {
            console.log('[App] Starting initialization...');
            // 1. Initialize database
            await initializeDatabase();

            // 2. Check if onboarding is complete
            const onboarded = isOnboardingComplete();

            if (!onboarded) {
                setShowOnboarding(true);
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
        } catch (err) {
            console.error('[App] Initialization error:', err);
        }
    };

    const handleSplashComplete = async () => {
        await initializeApp();
        setIsLoading(false);
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
            <>
                <StatusBar barStyle="dark-content" backgroundColor={AstraColors.background} />
                <SplashScreen onInitializationComplete={handleSplashComplete} />
            </>
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
