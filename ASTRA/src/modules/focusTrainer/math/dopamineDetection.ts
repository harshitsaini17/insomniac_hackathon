// ─────────────────────────────────────────────────────────────────────────────
// Model 9: Dopamine Binge Detection
// Detects single-app binge sessions & switch bursts
// ─────────────────────────────────────────────────────────────────────────────

import { AppUsageSession, BingeDetectionResult, ResetAction } from '../models/types';
import { DOPAMINE_THRESHOLDS } from '../models/constants';

/**
 * Detect dopamine binge patterns.
 *
 * Triggers if:
 *   1. Single distractive app session > 20 minutes
 *   2. Switch burst > threshold (15 switches in 5 minutes)
 *
 * @param sessions          Recent app usage sessions
 * @param distractiveApps   Set of package names classified as distractive
 * @returns BingeDetectionResult with protocol if binge detected
 */
export function detectDopamineBinge(
    sessions: AppUsageSession[],
    distractiveApps: Set<string>,
): BingeDetectionResult {
    // ── Check 1: Single distractive app session > threshold ─────────────────
    const bingeSession = detectLongBinge(sessions, distractiveApps);
    if (bingeSession) {
        return {
            isBinge: true,
            triggerApp: bingeSession.appName,
            protocol: getResetProtocol('long-session'),
        };
    }

    // ── Check 2: Switch burst detection ─────────────────────────────────────
    const hasBurst = detectSwitchBurst(sessions);
    if (hasBurst) {
        return {
            isBinge: true,
            triggerApp: undefined,
            protocol: getResetProtocol('switch-burst'),
        };
    }

    return {
        isBinge: false,
        protocol: [],
    };
}

/**
 * Check if any single distractive app session exceeds the binge threshold.
 */
function detectLongBinge(
    sessions: AppUsageSession[],
    distractiveApps: Set<string>,
): AppUsageSession | null {
    const thresholdMs = DOPAMINE_THRESHOLDS.bingeSessionMinutes * 60 * 1000;

    for (const session of sessions) {
        if (
            distractiveApps.has(session.packageName) &&
            session.duration > thresholdMs
        ) {
            return session;
        }
    }

    return null;
}

/**
 * Check for switch burst: too many app switches in a short window.
 * Scans sessions for clusters of rapid switching.
 */
function detectSwitchBurst(
    sessions: AppUsageSession[],
): boolean {
    if (sessions.length < 2) return false;

    const { switchBurstCount, switchBurstWindowMs } = DOPAMINE_THRESHOLDS;

    // Sort by start time
    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);

    // Sliding window: count sessions that start within the window
    for (let i = 0; i < sorted.length; i++) {
        const windowEnd = sorted[i].startTime + switchBurstWindowMs;
        let count = 0;

        for (let j = i; j < sorted.length && sorted[j].startTime <= windowEnd; j++) {
            count++;
        }

        if (count >= switchBurstCount) {
            return true;
        }
    }

    return false;
}

/**
 * Generate reset protocol based on binge type.
 *
 * Reset protocol steps:
 *   1. Breathing exercise (always)
 *   2. Walk suggestion (for long sessions)
 *   3. Reflection nudge (always)
 */
function getResetProtocol(
    triggerType: 'long-session' | 'switch-burst',
): ResetAction[] {
    const protocol: ResetAction[] = ['breathing-exercise'];

    if (triggerType === 'long-session') {
        protocol.push('walk-suggestion');
    }

    protocol.push('reflection-nudge');

    return protocol;
}

/**
 * Generate a human-readable message for the dopamine reset protocol.
 */
export function getResetMessage(result: BingeDetectionResult): string {
    if (!result.isBinge) return '';

    const parts: string[] = [];

    if (result.triggerApp) {
        parts.push(
            `You've been on ${result.triggerApp} for a while. Let's take a mindful break.`,
        );
    } else {
        parts.push(
            "You've been switching apps rapidly. Let's reset and refocus.",
        );
    }

    for (const action of result.protocol) {
        switch (action) {
            case 'breathing-exercise':
                parts.push('🧘 Try a 1-minute breathing exercise');
                break;
            case 'walk-suggestion':
                parts.push('🚶 Take a short 5-minute walk');
                break;
            case 'reflection-nudge':
                parts.push('💭 Reflect: What were you hoping to accomplish?');
                break;
        }
    }

    return parts.join('\n');
}
