// ─────────────────────────────────────────────────────────────────────────────
// Navigation — Bottom Tab Navigator (ASTRA Design System)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { AstraColors, AstraShadow } from '../constants/astraTheme';
import DashboardScreen from '../screens/DashboardScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import CognitiveTrainingScreen from '../screens/CognitiveTrainingScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HealthScreen from '../screens/HealthScreen';
import MeditateScreen from '../screens/MeditateScreen';

const Tab = createBottomTabNavigator();

// Clean icon component — text-based, matching Apple style
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
    return (
        <Text
            style={[
                styles.tabIcon,
                { color: focused ? AstraColors.primary : AstraColors.mutedForeground },
            ]}
        >
            {label}
        </Text>
    );
}

const TAB_ICONS: Record<string, string> = {
    Dashboard: '⌂',
    FocusSession: '◎',
    Training: '◆',
    Meditate: '❋',
    Health: '♥',
    Settings: '⚙',
};

export default function Navigation() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: AstraColors.primary,
                tabBarInactiveTintColor: AstraColors.mutedForeground,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Insights',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.Dashboard} focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="FocusSession"
                component={FocusSessionScreen}
                options={{
                    tabBarLabel: 'Focus',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.FocusSession} focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Training"
                component={CognitiveTrainingScreen}
                options={{
                    tabBarLabel: 'Train',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.Training} focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Meditate"
                component={MeditateScreen}
                options={{
                    tabBarLabel: 'Meditate',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.Meditate} focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Health"
                component={HealthScreen}
                options={{
                    tabBarLabel: 'Health',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.Health} focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={TAB_ICONS.Settings} focused={focused} />
                    ),
                }}
            />
            {/* Hidden screens accessible via navigation */}
            <Tab.Screen
                name="Heatmap"
                component={HeatmapScreen}
                options={{
                    tabBarButton: () => null,
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: AstraColors.surfaceElevated,
        borderTopColor: AstraColors.border,
        borderTopWidth: 0.5,
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        ...AstraShadow.card,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    tabIcon: {
        fontSize: 22,
    },
});
