// ─────────────────────────────────────────────────────────────────────────────
// Activity Recognition Service — Google Activity Recognition API Bridge
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityType =
    | 'still'
    | 'walking'
    | 'running'
    | 'cycling'
    | 'in_vehicle'
    | 'unknown';

export interface ActivityData {
    type: ActivityType;
    confidence: number; // 0–100
    timestamp: number;
}

/**
 * Get the current detected activity.
 * In production: bridges to Google Activity Recognition API.
 */
export async function getCurrentActivity(): Promise<ActivityData> {
    // TODO: Replace with NativeModules.ActivityRecognitionModule.getCurrentActivity()
    const activities: ActivityType[] = ['still', 'walking', 'still', 'still'];
    const type = activities[Math.floor(Math.random() * activities.length)];

    return {
        type,
        confidence: 70 + Math.floor(Math.random() * 30),
        timestamp: Date.now(),
    };
}

/**
 * Start periodic activity recognition updates.
 * In production: registers for activity transition updates.
 */
export async function startActivityTracking(
    intervalMs: number = 60000,
): Promise<void> {
    // TODO: Bridge to ActivityRecognitionClient.requestActivityTransitionUpdates()
    console.log(
        `[Activity] Started tracking with interval ${intervalMs}ms`,
    );
}

/**
 * Stop activity recognition updates.
 */
export async function stopActivityTracking(): Promise<void> {
    // TODO: Bridge to removeActivityTransitionUpdates()
    console.log('[Activity] Stopped tracking');
}

/**
 * Convert activity type to an activity level score (0–1).
 * Used as input to CRS.
 */
export function activityToLevel(activity: ActivityData): number {
    switch (activity.type) {
        case 'running':
            return 0.9;
        case 'cycling':
            return 0.75;
        case 'walking':
            return 0.5;
        case 'in_vehicle':
            return 0.1;
        case 'still':
            return 0.05;
        default:
            return 0.2;
    }
}
