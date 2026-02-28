// ─────────────────────────────────────────────────────────────────────────────
// Background Task Service — Android WorkManager Bridge
// Schedules periodic data collection and model updates
// ─────────────────────────────────────────────────────────────────────────────

export type TaskId =
    | 'collect-usage-stats'
    | 'update-afi'
    | 'update-heatmap'
    | 'health-sync'
    | 'daily-aggregation';

export interface ScheduledTask {
    id: TaskId;
    intervalMs: number;
    lastRun: number;
    isActive: boolean;
}

// Task configurations
const TASK_CONFIGS: Record<TaskId, { intervalMs: number; description: string }> = {
    'collect-usage-stats': {
        intervalMs: 15 * 60 * 1000,  // Every 15 minutes
        description: 'Collect app usage statistics',
    },
    'update-afi': {
        intervalMs: 30 * 60 * 1000,  // Every 30 minutes
        description: 'Recompute Attention Fragmentation Index',
    },
    'update-heatmap': {
        intervalMs: 60 * 60 * 1000,  // Every hour
        description: 'Update focus heatmap data',
    },
    'health-sync': {
        intervalMs: 60 * 60 * 1000,  // Every hour
        description: 'Sync health data from Health Connect',
    },
    'daily-aggregation': {
        intervalMs: 24 * 60 * 60 * 1000,  // Once per day
        description: 'Aggregate daily statistics',
    },
};

/**
 * Schedule a background task.
 * In production: bridges to AndroidX WorkManager.enqueuePeriodicWork()
 */
export async function scheduleTask(taskId: TaskId): Promise<void> {
    const config = TASK_CONFIGS[taskId];
    // TODO: Replace with:
    // NativeModules.WorkManagerModule.enqueuePeriodicWork(
    //   taskId,
    //   config.intervalMs,
    //   { requiresNetwork: false, requiresBatteryNotLow: true }
    // )
    console.log(
        `[Background] Scheduled "${taskId}" every ${config.intervalMs / 60000} min`,
    );
}

/**
 * Cancel a scheduled background task.
 */
export async function cancelTask(taskId: TaskId): Promise<void> {
    // TODO: Replace with WorkManager.cancelUniqueWork(taskId)
    console.log(`[Background] Cancelled "${taskId}"`);
}

/**
 * Schedule all default background tasks.
 * Called during app initialization.
 */
export async function scheduleAllTasks(): Promise<void> {
    const taskIds = Object.keys(TASK_CONFIGS) as TaskId[];
    for (const id of taskIds) {
        await scheduleTask(id);
    }
    console.log(`[Background] All ${taskIds.length} tasks scheduled`);
}

/**
 * Cancel all background tasks.
 * Called when user disables the module.
 */
export async function cancelAllTasks(): Promise<void> {
    const taskIds = Object.keys(TASK_CONFIGS) as TaskId[];
    for (const id of taskIds) {
        await cancelTask(id);
    }
    console.log('[Background] All tasks cancelled');
}

/**
 * Get the status of all scheduled tasks.
 */
export function getTaskStatuses(): ScheduledTask[] {
    return (Object.keys(TASK_CONFIGS) as TaskId[]).map(id => ({
        id,
        intervalMs: TASK_CONFIGS[id].intervalMs,
        lastRun: 0, // TODO: Read from persistent storage
        isActive: true,
    }));
}

/**
 * Check if a task should run based on its last run time.
 * Used as a fallback when WorkManager is not available.
 */
export function shouldTaskRun(
    taskId: TaskId,
    lastRunTime: number,
): boolean {
    const config = TASK_CONFIGS[taskId];
    return Date.now() - lastRunTime >= config.intervalMs;
}
