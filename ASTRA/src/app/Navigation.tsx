// ─────────────────────────────────────────────────────────────────────────────
// Navigation — Bottom Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import CognitiveTrainingScreen from '../screens/CognitiveTrainingScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function Navigation() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#58A6FF',
                tabBarInactiveTintColor: '#8B949E',
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={styles.tabIcon}>{focused ? '🏠' : '🏠'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="FocusSession"
                component={FocusSessionScreen}
                options={{
                    tabBarLabel: 'Focus',
                    tabBarIcon: ({ focused }) => (
                        <Text style={styles.tabIcon}>{focused ? '🎯' : '🎯'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Training"
                component={CognitiveTrainingScreen}
                options={{
                    tabBarLabel: 'Train',
                    tabBarIcon: ({ focused }) => (
                        <Text style={styles.tabIcon}>{focused ? '🧠' : '🧠'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Heatmap"
                component={HeatmapScreen}
                options={{
                    tabBarLabel: 'Analytics',
                    tabBarIcon: ({ focused }) => (
                        <Text style={styles.tabIcon}>{focused ? '📊' : '📊'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={styles.tabIcon}>{focused ? '⚙️' : '⚙️'}</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#161B22',
        borderTopColor: '#21262D',
        borderTopWidth: 1,
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    tabIcon: {
        fontSize: 22,
    },
});
