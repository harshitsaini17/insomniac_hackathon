// ─────────────────────────────────────────────────────────────────────────────
// Habit Engine — Streak Tracking, Suggestions, & Recovery Protocols
// ─────────────────────────────────────────────────────────────────────────────

import {
    HabitState,
    HabitSuggestion,
    RecoveryRecommendation,
} from '../models/personalizationTypes';
import { DistractionCategory } from '../../onboarding/models/onboardingTypes';
import { HABIT_SUGGESTIONS, RECOVERY_PROTOCOLS } from '../models/personalizationConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// Streak Tracking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record a focus day and update streak.
 * Must be called at least once per day when user completes a focus session.
 */
export function recordFocusDay(
    state: HabitState,
    todayDate: string,   // YYYY-MM-DD
    focusMinutes: number,
): HabitState {
    if (state.lastFocusDate === todayDate) {
        // Same day — update minutes only
        const updated = [...state.weeklyFocusMinutes];
        updated[updated.length - 1] = (updated[updated.length - 1] || 0) + focusMinutes;
        return {
            ...state,
            weeklyFocusMinutes: updated,
        };
    }

    // Check if yesterday was the last focus day (streak continues)
    const yesterday = getYesterday(todayDate);
    const isConsecutive = state.lastFocusDate === yesterday;

    const newStreak = isConsecutive ? state.currentStreak + 1 : 1;
    const longestStreak = Math.max(state.longestStreak, newStreak);

    // Shift weekly minutes
    const dayGap = dateDiffDays(state.lastFocusDate, todayDate);
    const shifted = shiftWeeklyMinutes(state.weeklyFocusMinutes, dayGap);
    shifted[shifted.length - 1] = focusMinutes;

    return {
        currentStreak: newStreak,
        longestStreak,
        lastFocusDate: todayDate,
        totalFocusDays: state.totalFocusDays + 1,
        weeklyFocusMinutes: shifted,
    };
}

/**
 * Check if streak was broken (no focus session today when day ends).
 */
export function checkStreakBroken(state: HabitState, todayDate: string): HabitState {
    if (state.lastFocusDate === todayDate) return state; // not broken

    const yesterday = getYesterday(todayDate);
    if (state.lastFocusDate === yesterday) return state; // grace period

    // Streak is broken
    return {
        ...state,
        currentStreak: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Personalized Habit Suggestions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate habit suggestions based on user's distraction type and CRS.
 *
 * Returns top 3 suggestions ranked by relevance.
 */
export function getHabitSuggestions(
    primaryDistraction: DistractionCategory,
    crs: number,
    currentStreak: number,
): HabitSuggestion[] {
    const suggestions: HabitSuggestion[] = [];
    const category = crs < 0.4 ? 'recovery' :
        currentStreak === 0 ? 'pre_focus' :
            'during_focus';

    // Always include category-specific suggestions
    const categorySuggestions = HABIT_SUGGESTIONS[category];
    for (const s of categorySuggestions) {
        suggestions.push({
            id: s.id,
            title: s.title,
            description: s.description,
            category,
            priority: s.priority,
        });
    }

    // Add distraction-specific boost
    if (primaryDistraction === 'social_media') {
        // Boost "Phone Away" suggestion
        const phoneAway = suggestions.find(s => s.id === 'hb_phone');
        if (phoneAway) phoneAway.priority = Math.min(1, phoneAway.priority + 0.15);
    }

    if (primaryDistraction === 'mental_rumination') {
        // Boost breathing/meditation
        const breathe = suggestions.find(s => s.id === 'hb_breathe');
        if (breathe) breathe.priority = Math.min(1, breathe.priority + 0.15);
    }

    // Sort by priority descending and take top 3
    return suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Recovery Protocol Selection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Select recovery protocol based on binge type and emotional sensitivity.
 */
export function selectRecoveryProtocol(
    bingeType: 'long-session' | 'switch-burst' | 'none',
    emotionalSensitivity: number,
    cognitiveReadiness: number,
): RecoveryRecommendation {
    // No binge → light recovery
    if (bingeType === 'none') {
        return cognitiveReadiness < 0.3
            ? RECOVERY_PROTOCOLS.meditation
            : RECOVERY_PROTOCOLS.reflection;
    }

    // Long session binge
    if (bingeType === 'long-session') {
        if (emotionalSensitivity > 0.6) {
            return RECOVERY_PROTOCOLS.breathing; // gentle for high ESS
        }
        return RECOVERY_PROTOCOLS.walk; // action for low ESS
    }

    // Switch burst
    if (emotionalSensitivity > 0.5) {
        return RECOVERY_PROTOCOLS.breathing;
    }
    return RECOVERY_PROTOCOLS.cold_exposure;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Streak Message
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate streak-based motivational message.
 */
export function getStreakMessage(streak: number): string {
    if (streak === 0) return 'Start your focus streak today!';
    if (streak === 1) return 'Day 1 done! Let\'s keep it going.';
    if (streak < 3) return `${streak}-day streak. Building momentum!`;
    if (streak < 7) return `${streak} days strong! You\'re forming a habit.`;
    if (streak < 14) return `${streak}-day streak! Your brain is rewiring itself.`;
    if (streak < 30) return `${streak} days of focus! This is becoming second nature.`;
    return `${streak}-day streak! You\'re a focus machine. 🔥`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Date Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function getYesterday(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
}

function dateDiffDays(from: string, to: string): number {
    if (!from || !to) return 7;
    const d1 = new Date(from + 'T00:00:00Z').getTime();
    const d2 = new Date(to + 'T00:00:00Z').getTime();
    return Math.max(0, Math.round((d2 - d1) / (24 * 3600 * 1000)));
}

function shiftWeeklyMinutes(minutes: number[], daysGap: number): number[] {
    if (daysGap >= 7) return [0, 0, 0, 0, 0, 0, 0];
    const shifted = [...minutes];
    for (let i = 0; i < daysGap; i++) {
        shifted.shift();
        shifted.push(0);
    }
    return shifted.slice(-7);
}
