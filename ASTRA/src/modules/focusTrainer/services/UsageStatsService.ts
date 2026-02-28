// ─────────────────────────────────────────────────────────────────────────────
// UsageStats Service — Android UsageStatsManager Bridge
// Uses native AstraTrackingModule when available, falls back to mock data
// ─────────────────────────────────────────────────────────────────────────────

import { AppUsageSession, AppDailyStats, TimeOfDay } from '../models/types';
import { getTimeOfDay } from '../math/normalize';
import {
    isNativeModuleAvailable,
    getTodaySessions as getNativeSessions,
    hasUsagePermission as nativeHasPermission,
    requestUsagePermission as nativeRequestPermission,
} from '../../backgroundTracking/NativeTrackingBridge';

// ── Native Module Interface ──────────────────────────────────────────────────

/**
 * Get app usage sessions for a time range.
 * Uses native AstraTrackingModule when available, otherwise mock data.
 */
export async function getUsageSessions(
    startTime: number,
    endTime: number,
): Promise<AppUsageSession[]> {
    // Try native module first
    if (isNativeModuleAvailable()) {
        try {
            const nativeSessions = await getNativeSessions();
            return nativeSessions
                .filter(s => s.startTime >= startTime && s.startTime <= endTime)
                .map(s => {
                    const date = new Date(s.startTime);
                    return {
                        appName: s.appName,
                        packageName: s.packageName,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        duration: s.duration,
                        switchCount: 0,
                        unlockCount: 0,
                        timeOfDay: getTimeOfDay(date.getHours()),
                        dayOfWeek: date.getDay(),
                    };
                });
        } catch (e) {
            console.warn('[UsageStats] Native query failed, falling back to mock:', e);
        }
    }

    // Fallback to mock
    return generateMockSessions(startTime, endTime);
}

/**
 * Get screen unlock count for a time range.
 * In production: bridges to UsageStatsManager.queryEvents() for KEYGUARD_HIDDEN events
 */
export async function getUnlockCount(
    startTime: number,
    endTime: number,
): Promise<number> {
    // TODO: Replace with native module call
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.round(3 + Math.random() * 5 * hours); // ~3-8 per hour
}

/**
 * Get daily aggregated stats per app.
 * Computed from raw sessions.
 */
export async function getDailyAppStats(
    date: number,
): Promise<AppDailyStats[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await getUsageSessions(
        startOfDay.getTime(),
        endOfDay.getTime(),
    );

    return aggregateToDaily(sessions);
}

/**
 * Check if usage stats permission is granted.
 * Uses native module when available.
 */
export async function hasUsageStatsPermission(): Promise<boolean> {
    if (isNativeModuleAvailable()) {
        return nativeHasPermission();
    }
    return true; // Mock: always granted
}

/**
 * Request usage stats permission (opens system settings).
 */
export async function requestUsageStatsPermission(): Promise<void> {
    if (isNativeModuleAvailable()) {
        await nativeRequestPermission();
        return;
    }
    console.log('[UsageStats] Requesting permission...');
}

// ── Aggregation Helpers ──────────────────────────────────────────────────────

function aggregateToDaily(sessions: AppUsageSession[]): AppDailyStats[] {
    const appMap = new Map<
        string,
        { totalTime: number; count: number; durations: number[]; conflict: number }
    >();

    for (const s of sessions) {
        const existing = appMap.get(s.packageName) || {
            totalTime: 0,
            count: 0,
            durations: [],
            conflict: 0,
        };
        existing.totalTime += s.duration;
        existing.count++;
        existing.durations.push(s.duration);
        appMap.set(s.packageName, existing);
    }

    return Array.from(appMap.entries()).map(([pkg, data]) => ({
        appName: pkg.split('.').pop() || pkg,
        packageName: pkg,
        totalTime: data.totalTime,
        openFrequency: data.count,
        avgSessionDuration:
            data.durations.reduce((s, d) => s + d, 0) / data.durations.length,
        conflictDuringFocus: Math.random() * 0.5, // Mock: random conflict score
    }));
}

// ── Mock Data Generator ──────────────────────────────────────────────────────

const MOCK_APPS = [
    { name: 'Instagram', pkg: 'com.instagram.android' },
    { name: 'Twitter', pkg: 'com.twitter.android' },
    { name: 'YouTube', pkg: 'com.google.android.youtube' },
    { name: 'Chrome', pkg: 'com.android.chrome' },
    { name: 'Gmail', pkg: 'com.google.android.gm' },
    { name: 'Slack', pkg: 'com.Slack' },
    { name: 'VS Code', pkg: 'com.microsoft.vscode' },
    { name: 'Notion', pkg: 'notion.id' },
    { name: 'Spotify', pkg: 'com.spotify.music' },
    { name: 'WhatsApp', pkg: 'com.whatsapp' },
];

function generateMockSessions(
    startTime: number,
    endTime: number,
): AppUsageSession[] {
    const sessions: AppUsageSession[] = [];
    let current = startTime;

    while (current < endTime) {
        const app = MOCK_APPS[Math.floor(Math.random() * MOCK_APPS.length)];
        const duration = (30 + Math.random() * 600) * 1000; // 30s to 10min
        const end = Math.min(current + duration, endTime);
        const date = new Date(current);

        sessions.push({
            appName: app.name,
            packageName: app.pkg,
            startTime: current,
            endTime: end,
            duration: end - current,
            switchCount: Math.floor(Math.random() * 3),
            unlockCount: Math.random() > 0.7 ? 1 : 0,
            timeOfDay: getTimeOfDay(date.getHours()),
            dayOfWeek: date.getDay(),
        });

        // Gap between sessions (1–5 minutes)
        current = end + (60 + Math.random() * 240) * 1000;
    }

    return sessions;
}
