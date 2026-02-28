package com.anonymous.astra.tracking.database

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class TrackingDatabase(context: Context) : SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

    companion object {
        const val DB_NAME = "astra_tracking.db"
        const val DB_VERSION = 1

        // Tables
        const val TABLE_SESSIONS = "bg_app_sessions"
        const val TABLE_DAILY_METRICS = "bg_daily_metrics"
        const val TABLE_BEHAVIOR_FLAGS = "bg_behavior_flags"
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS $TABLE_SESSIONS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                package_name TEXT NOT NULL,
                app_name TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                is_distractive INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
            )
        """)

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS $TABLE_DAILY_METRICS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                total_screen_time INTEGER DEFAULT 0,
                total_distractive_time INTEGER DEFAULT 0,
                switch_count INTEGER DEFAULT 0,
                unlock_count INTEGER DEFAULT 0,
                longest_focus_session INTEGER DEFAULT 0,
                afi_score REAL DEFAULT 0,
                updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
            )
        """)

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS $TABLE_BEHAVIOR_FLAGS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                type TEXT NOT NULL,
                intensity REAL DEFAULT 0,
                trigger_app TEXT,
                details TEXT
            )
        """)

        // Indices
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_bg_sess_time ON $TABLE_SESSIONS(start_time)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_bg_sess_pkg ON $TABLE_SESSIONS(package_name)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_bg_daily_date ON $TABLE_DAILY_METRICS(date)")
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_bg_flags_ts ON $TABLE_BEHAVIOR_FLAGS(timestamp)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Future migrations go here
    }

    // ── Session CRUD ─────────────────────────────────────────────────────

    fun insertSession(
        packageName: String,
        appName: String?,
        startTime: Long,
        endTime: Long,
        duration: Long,
        isDistractive: Boolean
    ): Long {
        val values = ContentValues().apply {
            put("package_name", packageName)
            put("app_name", appName ?: packageName)
            put("start_time", startTime)
            put("end_time", endTime)
            put("duration", duration)
            put("is_distractive", if (isDistractive) 1 else 0)
        }
        return writableDatabase.insert(TABLE_SESSIONS, null, values)
    }

    fun getTodaySessions(): JSONArray {
        val startOfDay = getStartOfDayMs()
        val cursor = readableDatabase.query(
            TABLE_SESSIONS,
            null,
            "start_time >= ?",
            arrayOf(startOfDay.toString()),
            null, null, "start_time ASC"
        )

        val result = JSONArray()
        cursor.use {
            while (it.moveToNext()) {
                val obj = JSONObject()
                obj.put("id", it.getLong(it.getColumnIndexOrThrow("id")))
                obj.put("packageName", it.getString(it.getColumnIndexOrThrow("package_name")))
                obj.put("appName", it.getString(it.getColumnIndexOrThrow("app_name")))
                obj.put("startTime", it.getLong(it.getColumnIndexOrThrow("start_time")))
                obj.put("endTime", it.getLong(it.getColumnIndexOrThrow("end_time")))
                obj.put("duration", it.getLong(it.getColumnIndexOrThrow("duration")))
                obj.put("isDistractive", it.getInt(it.getColumnIndexOrThrow("is_distractive")) == 1)
                result.put(obj)
            }
        }
        return result
    }

    // ── Daily Metrics ────────────────────────────────────────────────────

    fun updateDailyMetrics(
        totalScreenTime: Long,
        totalDistractiveTime: Long,
        switchCount: Int,
        longestFocusSession: Long,
        afiScore: Double
    ) {
        val today = getTodayDateString()
        val values = ContentValues().apply {
            put("date", today)
            put("total_screen_time", totalScreenTime)
            put("total_distractive_time", totalDistractiveTime)
            put("switch_count", switchCount)
            put("longest_focus_session", longestFocusSession)
            put("afi_score", afiScore)
            put("updated_at", System.currentTimeMillis())
        }

        val updated = writableDatabase.update(
            TABLE_DAILY_METRICS, values, "date = ?", arrayOf(today)
        )
        if (updated == 0) {
            writableDatabase.insert(TABLE_DAILY_METRICS, null, values)
        }
    }

    fun getDailyMetrics(): JSONObject? {
        val today = getTodayDateString()
        val cursor = readableDatabase.query(
            TABLE_DAILY_METRICS,
            null,
            "date = ?",
            arrayOf(today),
            null, null, null
        )

        cursor.use {
            if (it.moveToFirst()) {
                return JSONObject().apply {
                    put("date", it.getString(it.getColumnIndexOrThrow("date")))
                    put("totalScreenTime", it.getLong(it.getColumnIndexOrThrow("total_screen_time")))
                    put("totalDistractiveTime", it.getLong(it.getColumnIndexOrThrow("total_distractive_time")))
                    put("switchCount", it.getInt(it.getColumnIndexOrThrow("switch_count")))
                    put("longestFocusSession", it.getLong(it.getColumnIndexOrThrow("longest_focus_session")))
                    put("afiScore", it.getDouble(it.getColumnIndexOrThrow("afi_score")))
                }
            }
        }
        return null
    }

    // ── Behavior Flags ───────────────────────────────────────────────────

    fun insertBehaviorFlag(type: String, intensity: Double, triggerApp: String?, details: String?) {
        val values = ContentValues().apply {
            put("timestamp", System.currentTimeMillis())
            put("type", type)
            put("intensity", intensity)
            put("trigger_app", triggerApp)
            put("details", details)
        }
        writableDatabase.insert(TABLE_BEHAVIOR_FLAGS, null, values)
    }

    fun getTodayInterventionCount(): Int {
        val startOfDay = getStartOfDayMs()
        val cursor = readableDatabase.rawQuery(
            "SELECT COUNT(*) FROM $TABLE_BEHAVIOR_FLAGS WHERE timestamp >= ? AND (type = 'SPIRAL' OR type = 'BINGE')",
            arrayOf(startOfDay.toString())
        )
        cursor.use {
            if (it.moveToFirst()) return it.getInt(0)
        }
        return 0
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private fun getStartOfDayMs(): Long {
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun getTodayDateString(): String {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
        return sdf.format(java.util.Date())
    }
}
