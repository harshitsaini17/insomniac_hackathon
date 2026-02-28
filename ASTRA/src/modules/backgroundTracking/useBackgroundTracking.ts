// ─────────────────────────────────────────────────────────────────────────────
// useBackgroundTracking — React Hook for ASTRA Background Tracking
// Integrates native tracking with the orchestrator for interventions
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback, useRef, useState } from 'react';
import { useOrchestratorStore } from '../agent/store/orchestratorStore';
import {
    startTracking,
    stopTracking,
    isTrackingEnabled,
    hasUsagePermission,
    requestUsagePermission,
    onSpiralDetected,
    onBingeDetected,
    onAppSessionEnded,
    onFragmentedAttention,
    isNativeModuleAvailable,
    getDailyMetrics,
    getFragmentationScore,
    type InterventionEvent,
    type SessionEndedEvent,
    type DailyMetrics,
} from './NativeTrackingBridge';

// ── Hook Return Type ─────────────────────────────────────────────────────────

interface BackgroundTrackingState {
    isAvailable: boolean;
    isEnabled: boolean;
    hasPermission: boolean;
    dailyMetrics: DailyMetrics | null;
    afiScore: number;
    lastIntervention: InterventionEvent | null;

    // Actions
    enable: () => Promise<void>;
    disable: () => Promise<void>;
    requestPermission: () => Promise<void>;
    refresh: () => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBackgroundTracking(): BackgroundTrackingState {
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasPermissionState, setHasPermission] = useState(false);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
    const [afiScore, setAfiScore] = useState(0);
    const [lastIntervention, setLastIntervention] = useState<InterventionEvent | null>(null);

    const isAvailable = isNativeModuleAvailable();

    // ── Initialize ───────────────────────────────────────────────────────

    useEffect(() => {
        if (!isAvailable) return;

        const init = async () => {
            const [enabled, permission] = await Promise.all([
                isTrackingEnabled(),
                hasUsagePermission(),
            ]);
            setIsEnabled(enabled);
            setHasPermission(permission);

            if (enabled) {
                const [metrics, afi] = await Promise.all([
                    getDailyMetrics(),
                    getFragmentationScore(),
                ]);
                setDailyMetrics(metrics);
                setAfiScore(afi);
            }
        };

        init();
    }, [isAvailable]);

    // ── Event Listeners ──────────────────────────────────────────────────

    useEffect(() => {
        if (!isAvailable || !isEnabled) return;

        const unsubSpiral = onSpiralDetected((event) => {
            console.log('[BackgroundTracking] Spiral detected:', event.message);
            setLastIntervention(event);
        });

        const unsubBinge = onBingeDetected((event) => {
            console.log('[BackgroundTracking] Binge detected:', event.message);
            setLastIntervention(event);
        });

        const unsubSession = onAppSessionEnded((event: SessionEndedEvent) => {
            setAfiScore(event.afiScore);
        });

        const unsubFrag = onFragmentedAttention((_event) => {
            console.log('[BackgroundTracking] Fragmented attention detected');
        });

        return () => {
            unsubSpiral();
            unsubBinge();
            unsubSession();
            unsubFrag();
        };
    }, [isAvailable, isEnabled]);

    // ── Actions ──────────────────────────────────────────────────────────

    const enable = useCallback(async () => {
        if (!isAvailable) return;

        const permission = await hasUsagePermission();
        if (!permission) {
            await requestUsagePermission();
            return;
        }

        await startTracking();
        setIsEnabled(true);
    }, [isAvailable]);

    const disable = useCallback(async () => {
        if (!isAvailable) return;
        await stopTracking();
        setIsEnabled(false);
    }, [isAvailable]);

    const requestPermissionAction = useCallback(async () => {
        if (!isAvailable) return;
        await requestUsagePermission();
        // Check again after a short delay (user will return from settings)
        setTimeout(async () => {
            const granted = await hasUsagePermission();
            setHasPermission(granted);
        }, 1000);
    }, [isAvailable]);

    const refresh = useCallback(async () => {
        if (!isAvailable || !isEnabled) return;
        const [metrics, afi] = await Promise.all([
            getDailyMetrics(),
            getFragmentationScore(),
        ]);
        setDailyMetrics(metrics);
        setAfiScore(afi);
    }, [isAvailable, isEnabled]);

    return {
        isAvailable,
        isEnabled,
        hasPermission: hasPermissionState,
        dailyMetrics,
        afiScore,
        lastIntervention,
        enable,
        disable,
        requestPermission: requestPermissionAction,
        refresh,
    };
}
