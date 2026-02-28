// ─────────────────────────────────────────────────────────────────────────────
// Database Repository — CRUD Operations
// Powered by expo-sqlite for real on-device persistence
// ─────────────────────────────────────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import {
    AppUsageSession,
    PomodoroSession,
    CognitiveTrainingResult,
    NudgeRecord,
    HealthSignals,
    FocusGoal,
    FocusWindow,
    DistractivenessResult,
} from '../modules/focusTrainer/models/types';
import { UserProfile } from '../modules/onboarding/models/onboardingTypes';
import { ComplianceEvent, InterventionType } from '../modules/personalization/models/personalizationTypes';
import { DB_NAME, CREATE_TABLES, CREATE_INDICES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

// ── Database Initialization ──────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
    try {
        db = await SQLite.openDatabaseAsync(DB_NAME);

        // Execute schema creations
        for (const sql of CREATE_TABLES) {
            await db.execAsync(sql);
        }
        for (const sql of CREATE_INDICES) {
            await db.execAsync(sql);
        }
        console.log('[DB] Database initialized (expo-sqlite)');
    } catch (e) {
        console.error('[DB] Failed to initialize database', e);
        throw e;
    }
}

function getDB(): SQLite.SQLiteDatabase {
    if (!db) throw new Error("Database not initialized. Call initializeDatabase first.");
    return db;
}

// ── Usage Sessions ───────────────────────────────────────────────────────────

export async function insertUsageSession(session: AppUsageSession): Promise<number> {
    const result = await getDB().runAsync(
        `INSERT INTO app_usage_sessions (app_name, package_name, start_time, end_time, duration, switch_count, unlock_count, time_of_day, day_of_week)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            session.appName,
            session.packageName,
            session.startTime,
            session.endTime,
            session.duration,
            session.switchCount,
            session.unlockCount,
            session.timeOfDay,
            session.dayOfWeek,
        ]
    );
    return result.lastInsertRowId;
}

export async function getUsageSessionsInRange(startTime: number, endTime: number): Promise<AppUsageSession[]> {
    const rows = await getDB().getAllAsync<any>(
        `SELECT * FROM app_usage_sessions WHERE start_time >= ? AND start_time <= ?`,
        [startTime, endTime]
    );
    return rows.map(rowToUsageSession);
}

export async function getRecentUsageSessions(limitMs: number): Promise<AppUsageSession[]> {
    const since = Date.now() - limitMs;
    return getUsageSessionsInRange(since, Date.now());
}

// ── Pomodoro Sessions ────────────────────────────────────────────────────────

export async function insertPomodoroSession(session: PomodoroSession): Promise<number> {
    const result = await getDB().runAsync(
        `INSERT INTO pomodoro_sessions (goal_id, start_time, end_time, planned_duration, actual_duration, distraction_time, was_successful, break_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            session.goalId || null,
            session.startTime,
            session.endTime || null,
            session.plannedDuration,
            session.actualDuration,
            session.distractionTime || null,
            session.wasSuccessful ? 1 : 0,
            session.breakDuration,
        ]
    );
    return result.lastInsertRowId;
}

export async function getRecentPomodoroSessions(count: number): Promise<PomodoroSession[]> {
    const rows = await getDB().getAllAsync<any>(
        `SELECT * FROM pomodoro_sessions ORDER BY start_time DESC LIMIT ?`,
        [count]
    );
    return rows.map(rowToPomodoroSession);
}

export async function getCompletedSessionsToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await getDB().getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM pomodoro_sessions WHERE start_time >= ? AND was_successful = 1`,
        [startOfDay.getTime()]
    );
    return result?.count || 0;
}

// ── Cognitive Training Results ───────────────────────────────────────────────

export async function insertCognitiveResult(result: CognitiveTrainingResult): Promise<number> {
    const res = await getDB().runAsync(
        `INSERT INTO cognitive_results (type, timestamp, level, accuracy, reaction_time_ms, duration, correct_responses, total_trials)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            result.type,
            result.timestamp,
            result.level,
            result.accuracy,
            result.reactionTimeMs,
            result.duration,
            result.correctResponses,
            result.totalTrials,
        ]
    );
    return res.lastInsertRowId;
}

export async function getCognitiveHistory(type?: string, limit: number = 20): Promise<CognitiveTrainingResult[]> {
    let rows;
    if (type) {
        rows = await getDB().getAllAsync<any>(
            `SELECT * FROM cognitive_results WHERE type = ? ORDER BY timestamp DESC LIMIT ?`,
            [type, limit]
        );
    } else {
        rows = await getDB().getAllAsync<any>(
            `SELECT * FROM cognitive_results ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );
    }
    return rows.map(rowToCognitiveResult);
}

// ── Nudge Log ────────────────────────────────────────────────────────────────

export async function insertNudge(nudge: NudgeRecord): Promise<number> {
    const res = await getDB().runAsync(
        `INSERT INTO nudge_log (timestamp, type, level, target_app, goal_id, was_accepted, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            nudge.timestamp,
            nudge.type,
            nudge.level,
            nudge.targetApp,
            nudge.goalId || null,
            nudge.wasAccepted ? 1 : 0,
            nudge.message,
        ]
    );
    return res.lastInsertRowId;
}

export async function getNudgeStats(): Promise<{ totalAttempts: number; totalAccepted: number }> {
    const result = await getDB().getFirstAsync<{ totalAttempts: number, totalAccepted: number }>(
        `SELECT COUNT(*) as totalAttempts, SUM(was_accepted) as totalAccepted FROM nudge_log`
    );
    return result || { totalAttempts: 0, totalAccepted: 0 };
}

// ── Health Signals ───────────────────────────────────────────────────────────

export async function insertHealthSignals(signals: HealthSignals): Promise<number> {
    const res = await getDB().runAsync(
        `INSERT INTO health_signals (sleep_duration, sleep_quality, hrv, hrv_normalized, steps, activity_level, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            signals.sleepDuration,
            signals.sleepQuality,
            signals.hrv,
            signals.hrvNormalized,
            signals.steps,
            signals.activityLevel,
            signals.timestamp,
        ]
    );
    return res.lastInsertRowId;
}

export async function getLatestHealthSignals(): Promise<HealthSignals | null> {
    const row = await getDB().getFirstAsync<any>(
        `SELECT * FROM health_signals ORDER BY timestamp DESC LIMIT 1`
    );
    if (!row) return null;
    return rowToHealthSignals(row);
}

export async function getHistoricalHealthSignals(limitDays: number = 7): Promise<HealthSignals[]> {
    const cutoff = Date.now() - (limitDays * 24 * 60 * 60 * 1000);
    const rows = await getDB().getAllAsync<any>(
        `SELECT * FROM health_signals WHERE timestamp >= ? ORDER BY timestamp ASC`,
        [cutoff]
    );
    return rows.map(rowToHealthSignals);
}

// ── Focus Goals ──────────────────────────────────────────────────────────────

export async function upsertGoal(goal: FocusGoal): Promise<void> {
    const dbInstance = getDB();
    await dbInstance.runAsync(`DELETE FROM focus_goals`);

    await dbInstance.runAsync(
        `INSERT INTO focus_goals (id, title, importance, scheduled_start, scheduled_end, associated_apps, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            goal.id,
            goal.title,
            goal.importance,
            goal.scheduledStart || null,
            goal.scheduledEnd || null,
            JSON.stringify(goal.associatedApps),
            goal.isActive ? 1 : 0,
        ]
    );
}

export async function getActiveGoal(): Promise<FocusGoal | null> {
    const row = await getDB().getFirstAsync<any>(
        `SELECT * FROM focus_goals WHERE is_active = 1 LIMIT 1`
    );
    if (!row) return null;
    return rowToGoal(row);
}

// ── Personalization Events ───────────────────────────────────────────────────

export async function insertComplianceEvent(event: ComplianceEvent): Promise<void> {
    await getDB().runAsync(
        `INSERT INTO personalization_events (timestamp, intervention_type, was_successful, was_override, app_package, session_duration)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            event.timestamp,
            event.interventionType,
            event.wasSuccessful ? 1 : 0,
            event.wasOverride ? 1 : 0,
            event.appPackage ?? null,
            event.sessionDuration ?? null,
        ]
    );
}

// ── Meditation Sessions ──────────────────────────────────────────────────────

export async function insertMeditationSession(session: any): Promise<void> {
    await getDB().runAsync(
        `INSERT INTO meditation_sessions (id, date, type, intent, duration_seconds, completed, rating, pre_hrv, post_hrv, efficacy_marked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            session.id,
            session.date,
            session.type,
            session.intent,
            session.duration_seconds,
            session.completed ? 1 : 0,
            session.rating,
            session.pre_hrv ?? null,
            session.post_hrv ?? null,
            session.efficacy_marked ? 1 : 0,
        ]
    );
}

export async function getRecentComplianceEvents(sinceDaysAgo: number = 7): Promise<ComplianceEvent[]> {
    const cutoff = Date.now() - sinceDaysAgo * 24 * 3600 * 1000;
    const rows = await getDB().getAllAsync<any>(
        `SELECT * FROM personalization_events WHERE timestamp >= ? ORDER BY timestamp DESC`,
        [cutoff]
    );
    return rows.map((r) => ({
        timestamp: r.timestamp,
        interventionType: r.intervention_type as InterventionType,
        wasSuccessful: r.was_successful === 1,
        wasOverride: r.was_override === 1,
        appPackage: r.app_package,
        sessionDuration: r.session_duration,
    }));
}

// ── Row Mappers ──────────────────────────────────────────────────────────────

function rowToUsageSession(row: any): AppUsageSession {
    return {
        id: row.id,
        appName: row.app_name,
        packageName: row.package_name,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        switchCount: row.switch_count,
        unlockCount: row.unlock_count,
        timeOfDay: row.time_of_day as AppUsageSession['timeOfDay'],
        dayOfWeek: row.day_of_week,
    };
}

function rowToPomodoroSession(row: any): PomodoroSession {
    return {
        id: row.id,
        goalId: row.goal_id || undefined,
        startTime: row.start_time,
        endTime: row.end_time || undefined,
        plannedDuration: row.planned_duration,
        actualDuration: row.actual_duration,
        distractionTime: row.distraction_time || undefined,
        wasSuccessful: row.was_successful === 1,
        breakDuration: row.break_duration,
    };
}

function rowToCognitiveResult(row: any): CognitiveTrainingResult {
    return {
        id: row.id,
        type: row.type as CognitiveTrainingResult['type'],
        timestamp: row.timestamp,
        level: row.level,
        accuracy: row.accuracy,
        reactionTimeMs: row.reaction_time_ms,
        duration: row.duration,
        correctResponses: row.correct_responses,
        totalTrials: row.total_trials,
    };
}

function rowToHealthSignals(row: any): HealthSignals {
    return {
        sleepDuration: row.sleep_duration,
        sleepQuality: row.sleep_quality,
        hrv: row.hrv,
        hrvNormalized: row.hrv_normalized,
        steps: row.steps,
        activityLevel: row.activity_level,
        timestamp: row.timestamp,
    };
}

function rowToGoal(row: any): FocusGoal {
    return {
        id: row.id,
        title: row.title,
        importance: row.importance,
        scheduledStart: row.scheduled_start || undefined,
        scheduledEnd: row.scheduled_end || undefined,
        associatedApps: JSON.parse(row.associated_apps),
        isActive: row.is_active === 1,
    };
}
