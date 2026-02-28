package com.anonymous.astra.tracking.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log

import com.anonymous.astra.MainActivity
import com.anonymous.astra.tracking.database.TrackingDatabase
import com.anonymous.astra.tracking.intervention.InterventionManager
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * AppTrackingService — Android ForegroundService for real-time app usage monitoring.
 *
 * Capabilities:
 * - Polls UsageStatsManager every 2 seconds for foreground app changes
 * - Tracks individual app sessions (start/end/duration)
 * - Maintains rolling 3-minute window for switch rate detection
 * - Detects FragmentedAttention (switchRate > 6/min)
 * - Detects BingeDetected (distractive app > 15 min continuous)
 * - Detects SpiralDetected (rapid switching between distractive apps)
 * - Emits events to React Native
 */
class AppTrackingService : Service() {

    companion object {
        const val TAG = "AstraTracking"
        const val CHANNEL_ID = "astra_tracking_channel"
        const val NOTIFICATION_ID = 1001
        const val POLL_INTERVAL_MS = 2000L

        // Detection thresholds
        const val FRAGMENTATION_SWITCH_RATE = 6.0   // switches per minute
        const val BINGE_THRESHOLD_MS = 15 * 60 * 1000L  // 15 minutes
        const val SPIRAL_WINDOW_MS = 3 * 60 * 1000L     // 3-minute window
        const val SPIRAL_MIN_SWITCHES = 5                // min switches in window

        // AFI weights
        const val AFI_ALPHA = 0.4  // switchRate weight
        const val AFI_BETA = 0.3   // 1/avgSessionDuration weight
        const val AFI_GAMMA = 0.3  // distractiveTimeRatio weight
    }

    private lateinit var db: TrackingDatabase
    private lateinit var interventionManager: InterventionManager
    private val handler = Handler(Looper.getMainLooper())
    private var isTracking = false

    // ── Current session state ────────────────────────────────────────────
    private var currentApp: String? = null
    private var sessionStartTime: Long = 0L

    // ── Rolling window for switch detection ──────────────────────────────
    private val switchTimestamps = mutableListOf<Long>()
    private val recentApps = mutableListOf<String>()

    // ── Daily accumulators ────────────────────────────────────────────────
    private var totalScreenTimeMs = 0L
    private var totalDistractiveTimeMs = 0L
    private var switchCount = 0
    private var longestFocusSessionMs = 0L
    private var sessionDurations = mutableListOf<Long>()

    // ── Distractive app list ─────────────────────────────────────────────
    private var distractiveApps = setOf(
        "com.instagram.android",
        "com.twitter.android",
        "com.zhiliaoapp.musically", // TikTok
        "com.snapchat.android",
        "com.reddit.frontpage",
        "com.google.android.youtube",
        "com.whatsapp",
        "com.facebook.katana",
        "com.discord",
        "com.pinterest"
    )

    // ── Service Lifecycle ────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        db = TrackingDatabase(this)
        interventionManager = InterventionManager(this)
        createNotificationChannel()
        Log.d(TAG, "AppTrackingService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "AppTrackingService starting...")

        // Load distractive apps from preferences if available
        loadDistractiveApps()

        // Start as foreground service
        startForeground(NOTIFICATION_ID, buildNotification())

        // Begin polling
        if (!isTracking) {
            isTracking = true
            handler.post(pollRunnable)
            Log.d(TAG, "Tracking started")
        }

        return START_STICKY // Restart if killed
    }

    override fun onDestroy() {
        isTracking = false
        handler.removeCallbacks(pollRunnable)

        // End current session
        endCurrentSession()

        Log.d(TAG, "AppTrackingService destroyed")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Polling Loop ─────────────────────────────────────────────────────

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (!isTracking) return

            try {
                checkForegroundApp()
            } catch (e: Exception) {
                Log.e(TAG, "Error polling foreground app", e)
            }

            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    private fun checkForegroundApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return

        val now = System.currentTimeMillis()
        val usageEvents = usageStatsManager.queryEvents(now - 5000, now)
        val event = UsageEvents.Event()

        var latestForegroundApp: String? = null
        var latestTimestamp = 0L

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND && event.timeStamp > latestTimestamp) {
                latestForegroundApp = event.packageName
                latestTimestamp = event.timeStamp
            }
        }

        if (latestForegroundApp != null && latestForegroundApp != currentApp) {
            onAppChanged(latestForegroundApp, now)
        }

        // Check for binge (continuous distractive use)
        if (currentApp != null && isDistractive(currentApp!!)) {
            val sessionDuration = now - sessionStartTime
            if (sessionDuration >= BINGE_THRESHOLD_MS) {
                onBingeDetected(currentApp!!, sessionDuration)
            }
        }
    }

    // ── App Change Handling ──────────────────────────────────────────────

    private fun onAppChanged(newApp: String, timestamp: Long) {
        val previousApp = currentApp

        // End previous session
        if (previousApp != null && sessionStartTime > 0) {
            val duration = timestamp - sessionStartTime
            recordSession(previousApp, sessionStartTime, timestamp, duration)
        }

        // Start new session
        currentApp = newApp
        sessionStartTime = timestamp

        // Track switches
        switchCount++
        switchTimestamps.add(timestamp)
        recentApps.add(newApp)

        // Clean rolling window (keep last 3 minutes)
        val cutoff = timestamp - SPIRAL_WINDOW_MS
        switchTimestamps.removeAll { it < cutoff }
        if (recentApps.size > 30) recentApps.removeAt(0)

        // Check for fragmentation / spiral
        checkFragmentation(timestamp)
        checkSpiral(timestamp)

        Log.d(TAG, "App changed: $previousApp → $newApp (switches: $switchCount)")
    }

    private fun endCurrentSession() {
        if (currentApp != null && sessionStartTime > 0) {
            val now = System.currentTimeMillis()
            val duration = now - sessionStartTime
            recordSession(currentApp!!, sessionStartTime, now, duration)
            currentApp = null
            sessionStartTime = 0
        }
    }

    private fun recordSession(packageName: String, start: Long, end: Long, duration: Long) {
        val isDistractive = isDistractive(packageName)

        // Save to SQLite
        db.insertSession(
            packageName = packageName,
            appName = getAppLabel(packageName),
            startTime = start,
            endTime = end,
            duration = duration,
            isDistractive = isDistractive
        )

        // Update accumulators
        totalScreenTimeMs += duration
        if (isDistractive) totalDistractiveTimeMs += duration
        if (!isDistractive && duration > longestFocusSessionMs) longestFocusSessionMs = duration
        sessionDurations.add(duration)

        // Update daily metrics
        val afiScore = computeAFI()
        db.updateDailyMetrics(
            totalScreenTime = totalScreenTimeMs,
            totalDistractiveTime = totalDistractiveTimeMs,
            switchCount = switchCount,
            longestFocusSession = longestFocusSessionMs,
            afiScore = afiScore
        )

        // Emit session ended event to JS
        emitEvent("appSessionEnded", Arguments.createMap().apply {
            putString("packageName", packageName)
            putDouble("duration", duration.toDouble())
            putBoolean("isDistractive", isDistractive)
            putDouble("afiScore", afiScore)
        })
    }

    // ── Detection Logic ──────────────────────────────────────────────────

    private fun checkFragmentation(now: Long) {
        val windowStart = now - SPIRAL_WINDOW_MS
        val recentSwitches = switchTimestamps.count { it >= windowStart }
        val windowMinutes = SPIRAL_WINDOW_MS / 60000.0
        val switchRate = recentSwitches / windowMinutes

        if (switchRate > FRAGMENTATION_SWITCH_RATE) {
            Log.w(TAG, "FRAGMENTED ATTENTION detected: $switchRate switches/min")
            db.insertBehaviorFlag("FRAGMENTATION", switchRate, currentApp, null)

            emitEvent("fragmentedAttention", Arguments.createMap().apply {
                putDouble("switchRate", switchRate)
                putString("currentApp", currentApp)
            })
        }
    }

    private fun checkSpiral(now: Long) {
        val windowStart = now - SPIRAL_WINDOW_MS
        val recentSwitches = switchTimestamps.count { it >= windowStart }

        // Spiral = rapid switching between distractive apps
        val recentDistractiveCount = recentApps.takeLast(SPIRAL_MIN_SWITCHES)
            .count { isDistractive(it) }

        if (recentSwitches >= SPIRAL_MIN_SWITCHES && recentDistractiveCount >= SPIRAL_MIN_SWITCHES - 1) {
            Log.w(TAG, "SPIRAL DETECTED: $recentSwitches switches, $recentDistractiveCount distractive")

            val intervention = interventionManager.generateIntervention("SPIRAL", currentApp)
            if (intervention != null) {
                emitEvent("spiralDetected", Arguments.createMap().apply {
                    putString("message", intervention.getString("message"))
                    putString("tone", intervention.getString("tone"))
                    putString("triggerApp", intervention.optString("triggerApp", "unknown"))
                    putInt("remainingToday", intervention.getInt("remainingToday"))
                })
            }
        }
    }

    private fun onBingeDetected(app: String, duration: Long) {
        Log.w(TAG, "BINGE DETECTED: $app for ${duration / 60000}min")

        val intervention = interventionManager.generateIntervention("BINGE", app)
        if (intervention != null) {
            emitEvent("bingeDetected", Arguments.createMap().apply {
                putString("message", intervention.getString("message"))
                putString("tone", intervention.getString("tone"))
                putString("triggerApp", app)
                putDouble("durationMinutes", duration / 60000.0)
                putInt("remainingToday", intervention.getInt("remainingToday"))
            })
        }
    }

    // ── AFI Computation ──────────────────────────────────────────────────

    fun computeAFI(): Double {
        if (sessionDurations.isEmpty()) return 0.0

        val avgSessionDurationMin = sessionDurations.average() / 60000.0
        val switchRate = if (totalScreenTimeMs > 0) {
            switchCount.toDouble() / (totalScreenTimeMs / 60000.0)
        } else 0.0
        val distractiveRatio = if (totalScreenTimeMs > 0) {
            totalDistractiveTimeMs.toDouble() / totalScreenTimeMs
        } else 0.0

        // Normalize components to 0-1 range
        val normalizedSwitchRate = (switchRate / 10.0).coerceIn(0.0, 1.0)
        val normalizedInvDuration = if (avgSessionDurationMin > 0) {
            (1.0 / avgSessionDurationMin / 2.0).coerceIn(0.0, 1.0)
        } else 1.0

        val afi = AFI_ALPHA * normalizedSwitchRate +
                AFI_BETA * normalizedInvDuration +
                AFI_GAMMA * distractiveRatio

        return afi.coerceIn(0.0, 1.0)
    }

    // ── Event Emission ───────────────────────────────────────────────────

    private fun emitEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
        try {
            val reactApp = application as? ReactApplication ?: return
            val reactContext = reactApp.reactNativeHost.reactInstanceManager.currentReactContext ?: return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit event: $eventName", e)
        }
    }

    // ── Notification ─────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ASTRA Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background attention monitoring"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("ASTRA")
                .setContentText("Monitoring attention patterns")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("ASTRA")
                .setContentText("Monitoring attention patterns")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private fun isDistractive(packageName: String): Boolean {
        return distractiveApps.contains(packageName)
    }

    private fun getAppLabel(packageName: String): String {
        return try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName.substringAfterLast(".")
        }
    }

    private fun loadDistractiveApps() {
        try {
            val prefs = getSharedPreferences("astra_distractive_apps", Context.MODE_PRIVATE)
            val apps = prefs.getStringSet("distractive_list", null)
            if (apps != null && apps.isNotEmpty()) {
                distractiveApps = apps
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load distractive apps", e)
        }
    }

    // ── Public accessors (for AstraTrackingModule) ───────────────────────

    fun getCurrentApp(): String? = currentApp
    fun getSwitchCount(): Int = switchCount
    fun getDistractionState(): String {
        val now = System.currentTimeMillis()
        if (currentApp != null && isDistractive(currentApp!!)) {
            val duration = now - sessionStartTime
            if (duration >= BINGE_THRESHOLD_MS) return "BINGE"
        }
        val recentSwitches = switchTimestamps.count { it >= now - SPIRAL_WINDOW_MS }
        val recentDistractiveCount = recentApps.takeLast(SPIRAL_MIN_SWITCHES)
            .count { isDistractive(it) }
        if (recentSwitches >= SPIRAL_MIN_SWITCHES && recentDistractiveCount >= SPIRAL_MIN_SWITCHES - 1) {
            return "SPIRAL"
        }
        val windowMinutes = SPIRAL_WINDOW_MS / 60000.0
        val switchRate = recentSwitches / windowMinutes
        if (switchRate > FRAGMENTATION_SWITCH_RATE) return "FRAGMENTED"
        return "NORMAL"
    }
}
