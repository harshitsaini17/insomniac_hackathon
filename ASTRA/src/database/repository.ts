// ─────────────────────────────────────────────────────────────────────────────
// Database Repository — CRUD Operations
// Query helpers for all Focus Trainer tables
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Database Connection (abstracted for mock/real) ───────────────────────────

// In production, this would use react-native-sqlite-storage
// For development, we use an in-memory store

type Row = Record<string, unknown>;

class InMemoryDB {
    private tables: Record<string, Row[]> = {};
    private autoIds: Record<string, number> = {};

    execute(sql: string, params?: unknown[]): Row[] {
        // Simple mock — stores data in memory
        return [];
    }

    insert(table: string, data: Row): number {
        if (!this.tables[table]) {
            this.tables[table] = [];
            this.autoIds[table] = 0;
        }
        this.autoIds[table]++;
        const row = { ...data, id: this.autoIds[table] };
        this.tables[table].push(row);
        return this.autoIds[table];
    }

    query(table: string, where?: (row: Row) => boolean): Row[] {
        const rows = this.tables[table] || [];
        return where ? rows.filter(where) : rows;
    }

    update(table: string, id: number, data: Partial<Row>): void {
        const rows = this.tables[table] || [];
        const idx = rows.findIndex(r => r.id === id);
        if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...data };
        }
    }

    delete(table: string, id: number): void {
        const rows = this.tables[table] || [];
        this.tables[table] = rows.filter(r => r.id !== id);
    }
}

const db = new InMemoryDB();

// ── Database Initialization ──────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
    // In production:
    // const database = await SQLite.openDatabase({ name: DB_NAME });
    // for (const sql of CREATE_TABLES) { await database.executeSql(sql); }
    // for (const sql of CREATE_INDICES) { await database.executeSql(sql); }
    console.log('[DB] Database initialized (in-memory mock)');
}

// ── Usage Sessions ───────────────────────────────────────────────────────────

export async function insertUsageSession(
    session: AppUsageSession,
): Promise<number> {
    return db.insert('app_usage_sessions', {
        app_name: session.appName,
        package_name: session.packageName,
        start_time: session.startTime,
        end_time: session.endTime,
        duration: session.duration,
        switch_count: session.switchCount,
        unlock_count: session.unlockCount,
        time_of_day: session.timeOfDay,
        day_of_week: session.dayOfWeek,
    });
}

export async function getUsageSessionsInRange(
    startTime: number,
    endTime: number,
): Promise<AppUsageSession[]> {
    const rows = db.query('app_usage_sessions', row =>
        (row.start_time as number) >= startTime &&
        (row.start_time as number) <= endTime,
    );

    return rows.map(rowToUsageSession);
}

export async function getRecentUsageSessions(
    limitMs: number,
): Promise<AppUsageSession[]> {
    const since = Date.now() - limitMs;
    return getUsageSessionsInRange(since, Date.now());
}

// ── Pomodoro Sessions ────────────────────────────────────────────────────────

export async function insertPomodoroSession(
    session: PomodoroSession,
): Promise<number> {
    return db.insert('pomodoro_sessions', {
        goal_id: session.goalId || null,
        start_time: session.startTime,
        end_time: session.endTime || null,
        planned_duration: session.plannedDuration,
        actual_duration: session.actualDuration,
        distraction_time: session.distractionTime || null,
        was_successful: session.wasSuccessful ? 1 : 0,
        break_duration: session.breakDuration,
    });
}

export async function getRecentPomodoroSessions(
    count: number,
): Promise<PomodoroSession[]> {
    const rows = db.query('pomodoro_sessions');
    return rows
        .sort((a, b) => (b.start_time as number) - (a.start_time as number))
        .slice(0, count)
        .map(rowToPomodoroSession);
}

// ── Cognitive Training Results ───────────────────────────────────────────────

export async function insertCognitiveResult(
    result: CognitiveTrainingResult,
): Promise<number> {
    return db.insert('cognitive_results', {
        type: result.type,
        timestamp: result.timestamp,
        level: result.level,
        accuracy: result.accuracy,
        reaction_time_ms: result.reactionTimeMs,
        duration: result.duration,
        correct_responses: result.correctResponses,
        total_trials: result.totalTrials,
    });
}

export async function getCognitiveHistory(
    type?: string,
    limit: number = 20,
): Promise<CognitiveTrainingResult[]> {
    let rows = db.query('cognitive_results');
    if (type) {
        rows = rows.filter(r => r.type === type);
    }
    return rows
        .sort((a, b) => (b.timestamp as number) - (a.timestamp as number))
        .slice(0, limit)
        .map(rowToCognitiveResult);
}

// ── Nudge Log ────────────────────────────────────────────────────────────────

export async function insertNudge(nudge: NudgeRecord): Promise<number> {
    return db.insert('nudge_log', {
        timestamp: nudge.timestamp,
        type: nudge.type,
        level: nudge.level,
        target_app: nudge.targetApp,
        goal_id: nudge.goalId || null,
        was_accepted: nudge.wasAccepted ? 1 : 0,
        message: nudge.message,
    });
}

export async function getNudgeStats(): Promise<{
    totalAttempts: number;
    totalAccepted: number;
}> {
    const rows = db.query('nudge_log');
    return {
        totalAttempts: rows.length,
        totalAccepted: rows.filter(r => r.was_accepted === 1).length,
    };
}

// ── Health Signals ───────────────────────────────────────────────────────────

export async function insertHealthSignals(
    signals: HealthSignals,
): Promise<number> {
    return db.insert('health_signals', {
        sleep_duration: signals.sleepDuration,
        sleep_quality: signals.sleepQuality,
        hrv: signals.hrv,
        hrv_normalized: signals.hrvNormalized,
        steps: signals.steps,
        activity_level: signals.activityLevel,
        timestamp: signals.timestamp,
    });
}

export async function getLatestHealthSignals(): Promise<HealthSignals | null> {
    const rows = db.query('health_signals');
    if (rows.length === 0) return null;
    const latest = rows.sort(
        (a, b) => (b.timestamp as number) - (a.timestamp as number),
    )[0];
    return rowToHealthSignals(latest);
}

// ── Focus Goals ──────────────────────────────────────────────────────────────

export async function upsertGoal(goal: FocusGoal): Promise<void> {
    // Simple upsert via delete + insert
    db.delete('focus_goals', 0); // simplified
    db.insert('focus_goals', {
        id: goal.id,
        title: goal.title,
        importance: goal.importance,
        scheduled_start: goal.scheduledStart || null,
        scheduled_end: goal.scheduledEnd || null,
        associated_apps: JSON.stringify(goal.associatedApps),
        is_active: goal.isActive ? 1 : 0,
    });
}

export async function getActiveGoal(): Promise<FocusGoal | null> {
    const rows = db.query('focus_goals', r => r.is_active === 1);
    if (rows.length === 0) return null;
    return rowToGoal(rows[0]);
}

// ── Row Mappers ──────────────────────────────────────────────────────────────

function rowToUsageSession(row: Row): AppUsageSession {
    return {
        id: row.id as number,
        appName: row.app_name as string,
        packageName: row.package_name as string,
        startTime: row.start_time as number,
        endTime: row.end_time as number,
        duration: row.duration as number,
        switchCount: row.switch_count as number,
        unlockCount: row.unlock_count as number,
        timeOfDay: row.time_of_day as AppUsageSession['timeOfDay'],
        dayOfWeek: row.day_of_week as number,
    };
}

function rowToPomodoroSession(row: Row): PomodoroSession {
    return {
        id: row.id as number,
        goalId: (row.goal_id as string) || undefined,
        startTime: row.start_time as number,
        endTime: (row.end_time as number) || undefined,
        plannedDuration: row.planned_duration as number,
        actualDuration: row.actual_duration as number,
        distractionTime: (row.distraction_time as number) || undefined,
        wasSuccessful: row.was_successful === 1,
        breakDuration: row.break_duration as number,
    };
}

function rowToCognitiveResult(row: Row): CognitiveTrainingResult {
    return {
        id: row.id as number,
        type: row.type as CognitiveTrainingResult['type'],
        timestamp: row.timestamp as number,
        level: row.level as number,
        accuracy: row.accuracy as number,
        reactionTimeMs: row.reaction_time_ms as number,
        duration: row.duration as number,
        correctResponses: row.correct_responses as number,
        totalTrials: row.total_trials as number,
    };
}

function rowToHealthSignals(row: Row): HealthSignals {
    return {
        sleepDuration: row.sleep_duration as number,
        sleepQuality: row.sleep_quality as number,
        hrv: row.hrv as number,
        hrvNormalized: row.hrv_normalized as number,
        steps: row.steps as number,
        activityLevel: row.activity_level as number,
        timestamp: row.timestamp as number,
    };
}

function rowToGoal(row: Row): FocusGoal {
    return {
        id: row.id as string,
        title: row.title as string,
        importance: row.importance as number,
        scheduledStart: (row.scheduled_start as number) || undefined,
        scheduledEnd: (row.scheduled_end as number) || undefined,
        associatedApps: JSON.parse(row.associated_apps as string),
        isActive: row.is_active === 1,
    };
}

// ── User Profile (Onboarding) ────────────────────────────────────────────────

export async function insertUserProfileToDB(
    profile: UserProfile,
): Promise<number> {
    return db.insert('user_profiles', {
        profile_json: JSON.stringify(profile),
        created_at: profile.createdAt,
        updated_at: profile.updatedAt,
    });
}

export async function getUserProfileFromDB(): Promise<UserProfile | null> {
    const rows = db.query('user_profiles');
    if (rows.length === 0) return null;
    const latest = rows.sort(
        (a, b) => (b.updated_at as number) - (a.updated_at as number),
    )[0];
    try {
        return JSON.parse(latest.profile_json as string) as UserProfile;
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Personalization Events
// ═══════════════════════════════════════════════════════════════════════════════

export async function insertComplianceEvent(event: ComplianceEvent): Promise<void> {
    db.insert('personalization_events', {
        timestamp: event.timestamp,
        intervention_type: event.interventionType,
        was_successful: event.wasSuccessful ? 1 : 0,
        was_override: event.wasOverride ? 1 : 0,
        app_package: event.appPackage ?? null,
        session_duration: event.sessionDuration ?? null,
    });
}

export async function getRecentComplianceEvents(
    sinceDaysAgo: number = 7,
): Promise<ComplianceEvent[]> {
    const cutoff = Date.now() - sinceDaysAgo * 24 * 3600 * 1000;
    const rows = db.query('personalization_events');
    return rows
        .filter((r) => (r.timestamp as number) >= cutoff)
        .sort((a, b) => (b.timestamp as number) - (a.timestamp as number))
        .map((r) => ({
            timestamp: r.timestamp as number,
            interventionType: r.intervention_type as InterventionType,
            wasSuccessful: (r.was_successful as number) === 1,
            wasOverride: (r.was_override as number) === 1,
            appPackage: r.app_package as string | undefined,
            sessionDuration: r.session_duration as number | undefined,
        }));
}
