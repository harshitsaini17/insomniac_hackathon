package com.anonymous.astra.tracking

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Log

import com.anonymous.astra.tracking.database.TrackingDatabase
import com.anonymous.astra.tracking.services.AppTrackingService
import com.facebook.react.bridge.*

/**
 * AstraTrackingModule — React Native bridge exposing background tracking APIs to JS.
 *
 * Methods:
 * - startTracking() / stopTracking()
 * - getTodaySessions() → Promise<JSON array>
 * - getLiveApp() → Promise<String>
 * - getFragmentationScore() → Promise<Double>
 * - getDistractionState() → Promise<String>
 * - getDailyMetrics() → Promise<JSON>
 * - hasUsagePermission() / requestUsagePermission()
 */
class AstraTrackingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "AstraTrackingModule"
        const val NAME = "AstraTrackingModule"
    }

    private val db: TrackingDatabase by lazy {
        TrackingDatabase(reactApplicationContext)
    }

    override fun getName(): String = NAME

    // ── Tracking Control ─────────────────────────────────────────────────

    @ReactMethod
    fun startTracking(promise: Promise) {
        try {
            val context = reactApplicationContext

            // Save tracking state
            val prefs = context.getSharedPreferences("astra_tracking_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("tracking_enabled", true).apply()

            // Start the foreground service
            val intent = Intent(context, AppTrackingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }

            Log.d(TAG, "Tracking started")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start tracking", e)
            promise.reject("START_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            val context = reactApplicationContext

            // Save tracking state
            val prefs = context.getSharedPreferences("astra_tracking_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("tracking_enabled", false).apply()

            // Stop the foreground service
            val intent = Intent(context, AppTrackingService::class.java)
            context.stopService(intent)

            Log.d(TAG, "Tracking stopped")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop tracking", e)
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isTrackingEnabled(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences(
            "astra_tracking_prefs", Context.MODE_PRIVATE
        )
        promise.resolve(prefs.getBoolean("tracking_enabled", false))
    }

    // ── Data Queries ─────────────────────────────────────────────────────

    @ReactMethod
    fun getTodaySessions(promise: Promise) {
        try {
            val sessions = db.getTodaySessions()
            promise.resolve(sessions.toString())
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getLiveApp(promise: Promise) {
        try {
            // Read from shared state (set by AppTrackingService)
            val prefs = reactApplicationContext.getSharedPreferences(
                "astra_live_state", Context.MODE_PRIVATE
            )
            val app = prefs.getString("current_app", null) ?: "unknown"
            promise.resolve(app)
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getFragmentationScore(promise: Promise) {
        try {
            val metrics = db.getDailyMetrics()
            val afi = metrics?.optDouble("afiScore", 0.0) ?: 0.0
            promise.resolve(afi)
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getDistractionState(promise: Promise) {
        try {
            // Check recent behavior flags
            val todayCount = db.getTodayInterventionCount()
            if (todayCount > 0) {
                // If there have been recent spirals/binges, report that
                promise.resolve("ELEVATED")
            } else {
                promise.resolve("NORMAL")
            }
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getDailyMetrics(promise: Promise) {
        try {
            val metrics = db.getDailyMetrics()
            promise.resolve(metrics?.toString() ?: "{}")
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", e.message, e)
        }
    }

    // ── Permission Management ────────────────────────────────────────────

    @ReactMethod
    fun hasUsagePermission(promise: Promise) {
        try {
            val granted = checkUsageStatsPermission()
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestUsagePermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    // ── Distractive Apps Configuration ───────────────────────────────────

    @ReactMethod
    fun setDistractiveApps(apps: ReadableArray, promise: Promise) {
        try {
            val appSet = mutableSetOf<String>()
            for (i in 0 until apps.size()) {
                apps.getString(i)?.let { appSet.add(it) }
            }

            val prefs = reactApplicationContext.getSharedPreferences(
                "astra_distractive_apps", Context.MODE_PRIVATE
            )
            prefs.edit().putStringSet("distractive_list", appSet).apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONFIG_ERROR", e.message, e)
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────────

    private fun checkUsageStatsPermission(): Boolean {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
