// ─────────────────────────────────────────────────────────────────────────────
// Model 8: Attention Forecasting
// Rolling 7-day window → Personal Focus Heatmap
// ─────────────────────────────────────────────────────────────────────────────

import { FocusWindow, HourBlock } from '../models/types';
import { FORECAST_WINDOW_DAYS, HEATMAP_THRESHOLDS } from '../models/constants';
import { clamp } from './normalize';

/**
 * Generate a personal focus heatmap from historical focus windows.
 *
 * Uses a rolling 7-day window of AFI measurements per (dayOfWeek, hour)
 * to predict optimal focus times.
 *
 * Output: 7×24 = 168 HourBlocks with predicted AFI and quality label.
 *
 * @param focusWindows  Historical focus window data
 * @returns Array of HourBlocks for the heatmap
 */
export function generateFocusHeatmap(
    focusWindows: FocusWindow[],
): HourBlock[] {
    const heatmap: HourBlock[] = [];

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const matching = focusWindows.filter(
                fw => fw.dayOfWeek === day && fw.hourOfDay === hour,
            );

            if (matching.length === 0) {
                // No data → use neutral default
                heatmap.push({
                    dayOfWeek: day,
                    hour,
                    predictedAFI: 0.5,
                    confidence: 0,
                    label: 'fair',
                });
                continue;
            }

            // Weighted average — more recent samples get higher weight
            const totalSamples = matching.reduce((s, fw) => s + fw.sampleCount, 0);
            const weightedAFI =
                matching.reduce((s, fw) => s + fw.avgAFI * fw.sampleCount, 0) /
                totalSamples;

            const predictedAFI = clamp(weightedAFI, 0, 1);
            const confidence = computeConfidence(totalSamples);
            const label = classifyHourBlock(predictedAFI);

            heatmap.push({
                dayOfWeek: day,
                hour,
                predictedAFI,
                confidence,
                label,
            });
        }
    }

    return heatmap;
}

/**
 * Find optimal focus windows from the heatmap.
 * Returns hours classified as 'optimal' or 'good', sorted by quality.
 */
export function findOptimalWindows(
    heatmap: HourBlock[],
    dayOfWeek?: number,
): HourBlock[] {
    let candidates = heatmap.filter(
        hb => hb.label === 'optimal' || hb.label === 'good',
    );

    if (dayOfWeek !== undefined) {
        candidates = candidates.filter(hb => hb.dayOfWeek === dayOfWeek);
    }

    // Sort by AFI ascending (lower = better focus)
    return candidates.sort((a, b) => a.predictedAFI - b.predictedAFI);
}

/**
 * Get suggested focus schedule for today.
 * Returns top N optimal hour blocks.
 */
export function getSuggestedSchedule(
    heatmap: HourBlock[],
    dayOfWeek: number,
    maxSlots: number = 3,
): HourBlock[] {
    return findOptimalWindows(heatmap, dayOfWeek).slice(0, maxSlots);
}

/**
 * Confidence based on sample count.
 * More samples → higher confidence.
 * 7+ samples (one per day for a week) → full confidence.
 */
function computeConfidence(sampleCount: number): number {
    return clamp(sampleCount / FORECAST_WINDOW_DAYS, 0, 1);
}

/**
 * Classify an hour block by predicted AFI.
 */
function classifyHourBlock(afi: number): HourBlock['label'] {
    if (afi < HEATMAP_THRESHOLDS.optimal) return 'optimal';
    if (afi < HEATMAP_THRESHOLDS.good) return 'good';
    if (afi < HEATMAP_THRESHOLDS.fair) return 'fair';
    return 'poor';
}

/**
 * Convert raw AFI data points into FocusWindow aggregates.
 * Groups by (dayOfWeek, hour) and computes running averages.
 */
export function aggregateToFocusWindows(
    dataPoints: Array<{
        timestamp: number;
        afi: number;
    }>,
): FocusWindow[] {
    const map = new Map<string, { totalAFI: number; count: number }>();

    for (const dp of dataPoints) {
        const date = new Date(dp.timestamp);
        const day = date.getDay();
        const hour = date.getHours();
        const key = `${day}-${hour}`;

        const existing = map.get(key) || { totalAFI: 0, count: 0 };
        existing.totalAFI += dp.afi;
        existing.count += 1;
        map.set(key, existing);
    }

    const windows: FocusWindow[] = [];
    for (const [key, data] of map.entries()) {
        const [day, hour] = key.split('-').map(Number);
        const avgAFI = data.totalAFI / data.count;

        windows.push({
            dayOfWeek: day,
            hourOfDay: hour,
            avgAFI,
            sampleCount: data.count,
            qualityLabel: classifyHourBlock(avgAFI) as FocusWindow['qualityLabel'],
        });
    }

    return windows;
}
