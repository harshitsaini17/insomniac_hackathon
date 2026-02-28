/**
 * ASTRA Health Module — Rolling Averages & Trend Detection
 */

import type { HealthDayRecord } from '@/types';
import {
    TREND_DROP_THRESHOLD,
    CHRONIC_LOW_THRESHOLD,
    CHRONIC_LOW_DAYS,
    ROLLING_WINDOW_SHORT,
    ROLLING_WINDOW_MEDIUM,
} from '@/constants/health-constants';

/** Sort records by date ascending. */
function sortByDate(records: HealthDayRecord[]): HealthDayRecord[] {
    return [...records].sort(
        (a, b) => a.input.date.localeCompare(b.input.date)
    );
}

/** Get records from the last N days, sorted ascending. */
export function getRecentRecords(
    records: HealthDayRecord[],
    days: number
): HealthDayRecord[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return sortByDate(records.filter((r) => r.input.date >= cutoffStr));
}

type NumericFieldExtractor = (record: HealthDayRecord) => number;

const FIELD_EXTRACTORS: Record<string, NumericFieldExtractor> = {
    sleep_hours: (r) => r.input.sleep_hours,
    CognitiveReadiness: (r) => r.computed.CognitiveReadiness,
    HRVScore: (r) => r.computed.HRVScore,
    RecoveryScore: (r) => r.computed.RecoveryScore,
    LifestyleScore: (r) => r.computed.LifestyleScore,
    ExerciseScore: (r) => r.computed.ExerciseScore,
    SleepScore: (r) => r.computed.SleepScore,
};

/**
 * Compute rolling average for a given field over the last windowDays.
 */
export function computeRollingAverage(
    records: HealthDayRecord[],
    field: string,
    windowDays: number
): number | null {
    const recent = getRecentRecords(records, windowDays);
    if (recent.length === 0) return null;
    const extract = FIELD_EXTRACTORS[field];
    if (!extract) return null;
    const sum = recent.reduce((acc, r) => acc + extract(r), 0);
    return Math.round((sum / recent.length) * 10) / 10;
}

export interface TrendResult {
    direction: 'up' | 'down' | 'stable';
    percentageChange: number;
    shortAvg: number | null;
    longAvg: number | null;
}

/**
 * Detect trend by comparing 7-day vs 14-day rolling averages.
 * If 7-day avg is >10% lower than 14-day → downward trend.
 */
export function detectTrend(
    records: HealthDayRecord[],
    field: string
): TrendResult {
    const shortAvg = computeRollingAverage(records, field, ROLLING_WINDOW_SHORT);
    const longAvg = computeRollingAverage(records, field, ROLLING_WINDOW_MEDIUM);

    if (shortAvg == null || longAvg == null || longAvg === 0) {
        return { direction: 'stable', percentageChange: 0, shortAvg, longAvg };
    }

    const change = (shortAvg - longAvg) / longAvg;

    if (change < -TREND_DROP_THRESHOLD) {
        return { direction: 'down', percentageChange: Math.round(change * 100), shortAvg, longAvg };
    }
    if (change > TREND_DROP_THRESHOLD) {
        return { direction: 'up', percentageChange: Math.round(change * 100), shortAvg, longAvg };
    }

    return { direction: 'stable', percentageChange: Math.round(change * 100), shortAvg, longAvg };
}

export interface ChronicLowResult {
    isChronicLow: boolean;
    consecutiveDays: number;
    message?: string;
}

/**
 * Check if CognitiveReadiness has been below threshold for >= CHRONIC_LOW_DAYS consecutive days.
 */
export function checkChronicLow(records: HealthDayRecord[]): ChronicLowResult {
    const sorted = sortByDate(records);
    let consecutive = 0;

    // Count from the most recent backwards
    for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].computed.CognitiveReadiness < CHRONIC_LOW_THRESHOLD) {
            consecutive++;
        } else {
            break;
        }
    }

    if (consecutive >= CHRONIC_LOW_DAYS) {
        return {
            isChronicLow: true,
            consecutiveDays: consecutive,
            message: `Cognitive readiness has been low for ${consecutive} days. Reduce cognitive load for 48–72h.`,
        };
    }

    return { isChronicLow: false, consecutiveDays: consecutive };
}

/**
 * Compute Pearson correlation coefficient between two arrays.
 */
export function pearsonCorrelation(x: number[], y: number[]): number | null {
    const n = Math.min(x.length, y.length);
    if (n < 3) return null;

    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);

    const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
    const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
        const dx = xSlice[i] - meanX;
        const dy = ySlice[i] - meanY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    if (denom === 0) return null;

    return Math.round((numerator / denom) * 100) / 100;
}
