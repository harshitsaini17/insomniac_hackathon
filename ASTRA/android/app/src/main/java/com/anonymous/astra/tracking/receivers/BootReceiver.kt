package com.anonymous.astra.tracking.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.anonymous.astra.tracking.services.AppTrackingService

/**
 * BootReceiver — Restarts AppTrackingService on device boot.
 * Ensures continuous monitoring even after device restart.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AstraBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {

            Log.d(TAG, "Boot/update detected — restarting tracking service")

            // Check if tracking was enabled
            val prefs = context.getSharedPreferences("astra_tracking_prefs", Context.MODE_PRIVATE)
            val trackingEnabled = prefs.getBoolean("tracking_enabled", false)

            if (trackingEnabled) {
                val serviceIntent = Intent(context, AppTrackingService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.d(TAG, "Tracking service restarted")
            } else {
                Log.d(TAG, "Tracking not enabled, skipping restart")
            }
        }
    }
}
