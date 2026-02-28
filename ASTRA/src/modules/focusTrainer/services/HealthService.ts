// ─────────────────────────────────────────────────────────────────────────────
// Health Service — Health Connect Bridge
// Abstracts sleep, HRV, steps, and activity data
// ─────────────────────────────────────────────────────────────────────────────

import { HealthSignals } from '../models/types';
import { minMaxNormalize } from '../math/normalize';
import { NORM_RANGES } from '../models/constants';

/**
 * Get the latest health signals.
 * In production: bridges to Health Connect API.
 */
export async function getHealthSignals(): Promise<HealthSignals> {
    // TODO: Replace with HealthConnect native module calls:
    // - readSleepSessions()
    // - readHeartRateVariability()
    // - readStepsCount()
    return generateMockHealthSignals();
}

/**
 * Get sleep duration in hours for the last night.
 */
export async function getSleepDuration(): Promise<number> {
    // TODO: Bridge to Health Connect SleepSessionRecord
    return 5.5 + Math.random() * 3; // 5.5–8.5 hours
}

/**
 * Get latest HRV reading in milliseconds.
 */
export async function getHRV(): Promise<number> {
    // TODO: Bridge to Health Connect HeartRateVariabilityRmssdRecord
    return 40 + Math.random() * 60; // 40–100 ms
}

/**
 * Get today's step count.
 */
export async function getSteps(): Promise<number> {
    // TODO: Bridge to Health Connect StepsRecord
    return Math.floor(2000 + Math.random() * 8000); // 2000–10000
}

/**
 * Check if Health Connect is available and authorized.
 */
export async function hasHealthPermission(): Promise<boolean> {
    // TODO: Bridge to HealthConnect.getOrCreate().permissionController
    return true; // Mock
}

/**
 * Request Health Connect permissions.
 */
export async function requestHealthPermission(): Promise<boolean> {
    // TODO: Bridge to native permission request
    console.log('[Health] Requesting Health Connect permissions...');
    return true;
}

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalize raw health data to standardized HealthSignals.
 */
export function normalizeHealthData(raw: {
    sleepHours: number;
    hrvMs: number;
    steps: number;
}): HealthSignals {
    const sleepQuality = minMaxNormalize(
        raw.sleepHours,
        NORM_RANGES.sleepHours.min,
        NORM_RANGES.sleepHours.max,
    );

    const hrvNormalized = minMaxNormalize(
        raw.hrvMs,
        NORM_RANGES.hrv.min,
        NORM_RANGES.hrv.max,
    );

    const activityLevel = minMaxNormalize(
        raw.steps,
        NORM_RANGES.steps.min,
        NORM_RANGES.steps.max,
    );

    return {
        sleepDuration: raw.sleepHours,
        sleepQuality,
        hrv: raw.hrvMs,
        hrvNormalized,
        steps: raw.steps,
        activityLevel,
        timestamp: Date.now(),
    };
}

// ── Mock Data ────────────────────────────────────────────────────────────────

function generateMockHealthSignals(): HealthSignals {
    const sleepHours = 5.5 + Math.random() * 3;
    const hrvMs = 40 + Math.random() * 60;
    const steps = Math.floor(2000 + Math.random() * 8000);

    return normalizeHealthData({
        sleepHours,
        hrvMs,
        steps,
    });
}
