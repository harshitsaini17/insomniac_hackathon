// ─────────────────────────────────────────────────────────────────────────────
// SQLite Database Schema & Migration
// Tables for all Focus Trainer data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Database schema version. Increment when adding migrations.
 */
export const DB_VERSION = 1;
export const DB_NAME = 'astra_focus.db';

/**
 * All CREATE TABLE statements.
 * Execute in order during first-time setup.
 */
export const CREATE_TABLES: string[] = [
  // ── App Usage Sessions ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS app_usage_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    switch_count INTEGER DEFAULT 0,
    unlock_count INTEGER DEFAULT 0,
    time_of_day TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  )`,

  // ── Daily App Aggregates ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS daily_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    app_name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    total_time INTEGER NOT NULL,
    open_frequency INTEGER NOT NULL,
    avg_session_duration REAL NOT NULL,
    conflict_during_focus REAL DEFAULT 0,
    UNIQUE(date, package_name)
  )`,

  // ── App Classifications ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS app_classifications (
    package_name TEXT PRIMARY KEY,
    app_name TEXT NOT NULL,
    distractiveness_score REAL NOT NULL,
    is_distractive INTEGER NOT NULL,
    last_updated INTEGER NOT NULL
  )`,

  // ── Health Signals ──────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS health_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sleep_duration REAL,
    sleep_quality REAL,
    hrv REAL,
    hrv_normalized REAL,
    steps INTEGER,
    activity_level REAL,
    timestamp INTEGER NOT NULL
  )`,

  // ── Pomodoro Sessions ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id TEXT,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    planned_duration INTEGER NOT NULL,
    actual_duration INTEGER NOT NULL,
    distraction_time INTEGER,
    was_successful INTEGER NOT NULL,
    break_duration INTEGER NOT NULL
  )`,

  // ── Cognitive Training Results ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS cognitive_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    level INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    reaction_time_ms INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    correct_responses INTEGER NOT NULL,
    total_trials INTEGER NOT NULL
  )`,

  // ── Nudge Log ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS nudge_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    type TEXT NOT NULL,
    level INTEGER NOT NULL,
    target_app TEXT NOT NULL,
    goal_id TEXT,
    was_accepted INTEGER NOT NULL,
    message TEXT NOT NULL
  )`,

  // ── Focus Windows (for heatmap) ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS focus_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    hour_of_day INTEGER NOT NULL,
    avg_afi REAL NOT NULL,
    sample_count INTEGER NOT NULL,
    quality_label TEXT NOT NULL,
    last_updated INTEGER NOT NULL,
    UNIQUE(day_of_week, hour_of_day)
  )`,

  // ── Focus Goals ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS focus_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    importance REAL NOT NULL,
    scheduled_start INTEGER,
    scheduled_end INTEGER,
    associated_apps TEXT NOT NULL,
    is_active INTEGER NOT NULL
  )`,

  // ── User Profiles (Onboarding) ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // ── Personalization Events ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS personalization_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    intervention_type TEXT NOT NULL,
    was_successful INTEGER NOT NULL,
    was_override INTEGER NOT NULL,
    app_package TEXT,
    session_duration INTEGER
  )`,

  // ── Meditation Sessions ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS meditation_sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    intent TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    completed INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    pre_hrv REAL,
    post_hrv REAL,
    efficacy_marked INTEGER NOT NULL
  )`,
];

/**
 * Indices for query performance.
 */
export const CREATE_INDICES: string[] = [
  'CREATE INDEX IF NOT EXISTS idx_usage_time ON app_usage_sessions(start_time)',
  'CREATE INDEX IF NOT EXISTS idx_usage_pkg ON app_usage_sessions(package_name)',
  'CREATE INDEX IF NOT EXISTS idx_agg_date ON daily_aggregates(date)',
  'CREATE INDEX IF NOT EXISTS idx_health_ts ON health_signals(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_pomo_time ON pomodoro_sessions(start_time)',
  'CREATE INDEX IF NOT EXISTS idx_cog_ts ON cognitive_results(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_nudge_ts ON nudge_log(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_focus_slot ON focus_windows(day_of_week, hour_of_day)',
  'CREATE INDEX IF NOT EXISTS idx_pers_event_ts ON personalization_events(timestamp)',
];
