// ─────────────────────────────────────────────────────────────────────────────
// NativeTrackingBridge — TypeScript wrapper for the native AstraTrackingModule
// Provides typed access to the Android background tracking service
// ─────────────────────────────────────────────────────────────────────────────

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AstraTrackingModule } = NativeModules;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppSession {
    id: number;
    packageName: string;
    appName: string;
    startTime: number;
    endTime: number;
    duration: number;
    isDistractive: boolean;
}

export interface DailyMetrics {
    date: string;
    totalScreenTime: number;
    totalDistractiveTime: number;
    switchCount: number;
    longestFocusSession: number;
    afiScore: number;
}

export interface InterventionEvent {
    type: 'SPIRAL' | 'BINGE';
    message: string;
    tone: string;
    triggerApp: string;
    remainingToday: number;
    durationMinutes?: number;
}

export interface SessionEndedEvent {
    packageName: string;
    duration: number;
    isDistractive: boolean;
    afiScore: number;
}

export interface FragmentationEvent {
    switchRate: number;
    currentApp: string;
}

// ── Event Types ──────────────────────────────────────────────────────────────

export type TrackingEventType =
    | 'appSessionEnded'
    | 'spiralDetected'
    | 'bingeDetected'
    | 'fragmentedAttention';

// ── Module Check ─────────────────────────────────────────────────────────────

const isNativeAvailable = Platform.OS === 'android' && AstraTrackingModule != null;

// ── Event Emitter ────────────────────────────────────────────────────────────

let emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
    if (!isNativeAvailable) return null;
    if (!emitter) {
        emitter = new NativeEventEmitter(AstraTrackingModule);
    }
    return emitter;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start background app tracking service.
 * Requires Usage Access permission.
 */
export async function startTracking(): Promise<boolean> {
    if (!isNativeAvailable) {
        console.log('[NativeTrackingBridge] Native module not available, using mock');
        return false;
    }
    return AstraTrackingModule.startTracking();
}

/**
 * Stop background app tracking service.
 */
export async function stopTracking(): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return AstraTrackingModule.stopTracking();
}

/**
 * Check if tracking is currently enabled.
 */
export async function isTrackingEnabled(): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return AstraTrackingModule.isTrackingEnabled();
}

/**
 * Get today's app usage sessions.
 */
export async function getTodaySessions(): Promise<AppSession[]> {
    if (!isNativeAvailable) return [];
    const json = await AstraTrackingModule.getTodaySessions();
    try {
        return JSON.parse(json) as AppSession[];
    } catch {
        return [];
    }
}

/**
 * Get the currently active foreground app.
 */
export async function getLiveApp(): Promise<string> {
    if (!isNativeAvailable) return 'unknown';
    return AstraTrackingModule.getLiveApp();
}

/**
 * Get the current Attention Fragmentation Index (0-1).
 */
export async function getFragmentationScore(): Promise<number> {
    if (!isNativeAvailable) return 0;
    return AstraTrackingModule.getFragmentationScore();
}

/**
 * Get the current distraction state: NORMAL, ELEVATED, SPIRAL, BINGE.
 */
export async function getDistractionState(): Promise<string> {
    if (!isNativeAvailable) return 'NORMAL';
    return AstraTrackingModule.getDistractionState();
}

/**
 * Get today's daily metrics (screen time, switches, AFI, etc.).
 */
export async function getDailyMetrics(): Promise<DailyMetrics | null> {
    if (!isNativeAvailable) return null;
    const json = await AstraTrackingModule.getDailyMetrics();
    try {
        const parsed = JSON.parse(json);
        return Object.keys(parsed).length > 0 ? parsed as DailyMetrics : null;
    } catch {
        return null;
    }
}

/**
 * Check if Usage Access permission is granted.
 */
export async function hasUsagePermission(): Promise<boolean> {
    if (!isNativeAvailable) return true; // Mock: always granted
    return AstraTrackingModule.hasUsagePermission();
}

/**
 * Open Android settings to request Usage Access permission.
 */
export async function requestUsagePermission(): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return AstraTrackingModule.requestUsagePermission();
}

/**
 * Set the list of distractive app package names.
 */
export async function setDistractiveApps(apps: string[]): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return AstraTrackingModule.setDistractiveApps(apps);
}

// ── Event Subscriptions ──────────────────────────────────────────────────────

/**
 * Subscribe to tracking events from the native service.
 * Returns an unsubscribe function.
 */
export function onTrackingEvent(
    eventType: TrackingEventType,
    callback: (data: any) => void,
): () => void {
    const em = getEmitter();
    if (!em) return () => { };

    const subscription = em.addListener(eventType, callback);
    return () => subscription.remove();
}

/**
 * Subscribe to spiral detection events.
 */
export function onSpiralDetected(callback: (event: InterventionEvent) => void): () => void {
    return onTrackingEvent('spiralDetected', callback);
}

/**
 * Subscribe to binge detection events.
 */
export function onBingeDetected(callback: (event: InterventionEvent) => void): () => void {
    return onTrackingEvent('bingeDetected', callback);
}

/**
 * Subscribe to app session ended events.
 */
export function onAppSessionEnded(callback: (event: SessionEndedEvent) => void): () => void {
    return onTrackingEvent('appSessionEnded', callback);
}

/**
 * Subscribe to fragmented attention events.
 */
export function onFragmentedAttention(callback: (event: FragmentationEvent) => void): () => void {
    return onTrackingEvent('fragmentedAttention', callback);
}

/**
 * Check if the native module is available.
 */
export function isNativeModuleAvailable(): boolean {
    return isNativeAvailable;
}
