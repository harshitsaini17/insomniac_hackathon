import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand-compatible storage adapter using AsyncStorage.
 * Works seamlessly in Expo Go without native module requirements.
 */
export const zustandStorage: StateStorage = {
    getItem: async (name: string) => {
        const value = await AsyncStorage.getItem(name);
        return value ?? null;
    },
    setItem: async (name: string, value: string) => {
        await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string) => {
        await AsyncStorage.removeItem(name);
    },
};

/**
 * Generate a simple unique ID (no external dependency).
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
