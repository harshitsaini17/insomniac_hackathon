package com.anonymous.astra.tracking.intervention

import android.content.Context
import android.content.SharedPreferences
import com.anonymous.astra.tracking.database.TrackingDatabase
import org.json.JSONObject

/**
 * InterventionManager — Generates personalized taunt/intervention messages
 * based on the user's profile (strictness, tone, goal) and rate-limits to
 * max 3 interventions per day.
 */
class InterventionManager(private val context: Context) {

    companion object {
        const val MAX_INTERVENTIONS_PER_DAY = 3
        const val PREFS_NAME = "astra_intervention_prefs"
        const val KEY_INTERVENTION_COUNT = "intervention_count_today"
        const val KEY_LAST_DATE = "intervention_last_date"
    }

    private val prefs: SharedPreferences
        get() = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val db: TrackingDatabase by lazy { TrackingDatabase(context) }

    // ── Tone-based message templates ─────────────────────────────────────

    private val reflectiveMessages = listOf(
        "Is this helping your %GOAL% goal?",
        "You said you wanted to change. This isn't it.",
        "Remember your future self — %FUTURE_SELF%",
        "Your %GOAL% goal doesn't scroll itself.",
        "Pause. Is this aligned with who you want to become?"
    )

    private val supportiveMessages = listOf(
        "You've worked hard today. Let's reset and refocus.",
        "It's okay to slip. What matters is what you do next.",
        "Small steps count. Close this and do one useful thing.",
        "You're stronger than this distraction. Prove it.",
        "Every minute you reclaim is a win."
    )

    private val challengeMessages = listOf(
        "You said 3 months. Clock's ticking.",
        "This is exactly what separates winners from dreamers.",
        "Your competition isn't scrolling right now.",
        "%GOAL%? Not happening if you keep this up.",
        "Talk is cheap. Action costs focus. Pay up."
    )

    private val strictMessages = listOf(
        "Focus mode activated. Close this NOW.",
        "You asked to be held accountable. Here it is.",
        "Every second here is stolen from your %GOAL%.",
        "Discipline beats motivation. Act now.",
        "Stop. Your %GOAL% needs you more than this app does."
    )

    // Personal / relationship taunts
    private val personalTaunts = listOf(
        "Do your workout. That's how you level up — and maybe get the girl too.",
        "Hit the gym first. Confidence doesn't download itself.",
        "Muscles don't build themselves. Neither does your dating life.",
        "You want results? Stop scrolling, start doing.",
        "Discipline now. Flex later."
    )

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Check if we can still send interventions today (max 3/day).
     */
    fun canIntervene(): Boolean {
        resetIfNewDay()
        val count = prefs.getInt(KEY_INTERVENTION_COUNT, 0)
        return count < MAX_INTERVENTIONS_PER_DAY
    }

    /**
     * Generate an intervention message based on behavior flag type.
     * Returns null if rate limit exceeded.
     */
    fun generateIntervention(flagType: String, triggerApp: String?): JSONObject? {
        if (!canIntervene()) return null

        // Read user profile from MMKV (simplified — read from shared prefs fallback)
        val profile = getUserProfile()
        val tone = profile.optString("nudgeTone", "challenge")
        val goal = profile.optString("goalText", "your goals")
        val futureSelf = profile.optString("idealFutureSelf", "your best self")
        val strictness = profile.optDouble("strictnessCompatibility", 0.5)
        val relationshipGoal = profile.optString("relationshipGoal", "")

        // Select message pool based on tone
        val messagePool = when {
            strictness > 0.7 -> strictMessages
            tone == "supportive" -> supportiveMessages
            tone == "challenge" -> challengeMessages
            tone == "sharp" -> strictMessages
            else -> reflectiveMessages
        }

        var message = messagePool.random()
            .replace("%GOAL%", goal)
            .replace("%FUTURE_SELF%", futureSelf)

        // Mix in personal taunts occasionally
        if (relationshipGoal.isNotEmpty() && Math.random() > 0.6) {
            message = personalTaunts.random()
        }

        // Record intervention
        incrementInterventionCount()
        db.insertBehaviorFlag(flagType, 1.0, triggerApp, message)

        return JSONObject().apply {
            put("type", flagType)
            put("message", message)
            put("tone", tone)
            put("triggerApp", triggerApp ?: "unknown")
            put("timestamp", System.currentTimeMillis())
            put("remainingToday", MAX_INTERVENTIONS_PER_DAY - prefs.getInt(KEY_INTERVENTION_COUNT, 0))
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────────

    private fun getUserProfile(): JSONObject {
        try {
            // Try reading from the app's MMKV or SharedPreferences
            val profilePrefs = context.getSharedPreferences("astra_user_profile", Context.MODE_PRIVATE)
            val profileJson = profilePrefs.getString("profile_json", null)
            if (profileJson != null) {
                return JSONObject(profileJson)
            }
        } catch (e: Exception) {
            // Fallback to defaults
        }
        return JSONObject()
    }

    private fun resetIfNewDay() {
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            .format(java.util.Date())
        val lastDate = prefs.getString(KEY_LAST_DATE, "")

        if (lastDate != today) {
            prefs.edit()
                .putInt(KEY_INTERVENTION_COUNT, 0)
                .putString(KEY_LAST_DATE, today)
                .apply()
        }
    }

    private fun incrementInterventionCount() {
        val count = prefs.getInt(KEY_INTERVENTION_COUNT, 0)
        prefs.edit().putInt(KEY_INTERVENTION_COUNT, count + 1).apply()
    }
}
