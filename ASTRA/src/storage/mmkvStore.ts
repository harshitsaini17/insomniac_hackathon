// ─────────────────────────────────────────────────────────────────────────────
// MMKV Cache Store — Fast key-value storage for hot data
// ─────────────────────────────────────────────────────────────────────────────

// In production: import { MMKV } from 'react-native-mmkv';
// const storage = new MMKV();

import { PersonalityProfile, NudgeType } from '../modules/focusTrainer/models/types';
import { NudgeState } from '../modules/focusTrainer/engine/NudgeManager';
import { UserProfile } from '../modules/onboarding/models/onboardingTypes';
import { PersonalizationState } from '../modules/personalization/models/personalizationTypes';

// ── Mock MMKV (in-memory) ────────────────────────────────────────────────────
const store = new Map<string, string>();

function getString(key: string): string | undefined {
    return store.get(key);
}

function setString(key: string, value: string): void {
    store.set(key, value);
}

function getNumber(key: string): number | undefined {
    const val = store.get(key);
    return val !== undefined ? Number(val) : undefined;
}

function setNumber(key: string, value: number): void {
    store.set(key, String(value));
}

function getBoolean(key: string): boolean | undefined {
    const val = store.get(key);
    return val !== undefined ? val === 'true' : undefined;
}

function setBoolean(key: string, value: boolean): void {
    store.set(key, String(value));
}

function deleteKey(key: string): void {
    store.delete(key);
}

// ── Cache Keys ───────────────────────────────────────────────────────────────

const KEYS = {
    CURRENT_AFI: 'focus.currentAFI',
    CURRENT_AFI_LEVEL: 'focus.currentAFILevel',
    CURRENT_CRS: 'focus.currentCRS',
    ACTIVE_SESSION: 'focus.activeSession',
    NUDGE_STATE: 'focus.nudgeState',
    PERSONALITY: 'focus.personality',
    MODULE_ENABLED: 'focus.moduleEnabled',
    LAST_HEALTH_SYNC: 'focus.lastHealthSync',
    POMODORO_COUNT_TODAY: 'focus.pomodoroCountToday',
    COMPLIANCE_SUCCESSES: 'focus.complianceSuccesses',
    COMPLIANCE_ATTEMPTS: 'focus.complianceAttempts',
    BLOCKING_OVERRIDE: 'focus.blockingOverride',
    ONBOARDING_PROFILE: 'onboarding.userProfile',
    ONBOARDING_COMPLETE: 'onboarding.complete',
    PERSONALIZATION_STATE: 'personalization.state',
    PERSONALIZATION_LAST_DAILY: 'personalization.lastDailyUpdate',
} as const;

// ── AFI Cache ────────────────────────────────────────────────────────────────

export function getCachedAFI(): number {
    return getNumber(KEYS.CURRENT_AFI) ?? 0.5;
}

export function setCachedAFI(score: number, level: string): void {
    setNumber(KEYS.CURRENT_AFI, score);
    setString(KEYS.CURRENT_AFI_LEVEL, level);
}

export function getCachedAFILevel(): string {
    return getString(KEYS.CURRENT_AFI_LEVEL) ?? 'moderate';
}

// ── CRS Cache ────────────────────────────────────────────────────────────────

export function getCachedCRS(): number {
    return getNumber(KEYS.CURRENT_CRS) ?? 0.5;
}

export function setCachedCRS(score: number): void {
    setNumber(KEYS.CURRENT_CRS, score);
}

// ── Personality Profile ──────────────────────────────────────────────────────

export function getPersonalityProfile(): PersonalityProfile {
    const raw = getString(KEYS.PERSONALITY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch { }
    }
    return { conscientiousness: 4, neuroticism: 4 }; // neutral default
}

export function setPersonalityProfile(profile: PersonalityProfile): void {
    setString(KEYS.PERSONALITY, JSON.stringify(profile));
}

// ── Nudge State ──────────────────────────────────────────────────────────────

export function getNudgeState(): NudgeState {
    const raw = getString(KEYS.NUDGE_STATE);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch { }
    }
    return {
        todayCount: 0,
        lastNudgeTime: 0,
        lastDismissTime: 0,
        dailyResetDate: new Date().toISOString().split('T')[0],
    };
}

export function setNudgeState(state: NudgeState): void {
    setString(KEYS.NUDGE_STATE, JSON.stringify(state));
}

// ── Compliance Tracking ──────────────────────────────────────────────────────

export function getComplianceStats(): {
    successes: number;
    attempts: number;
} {
    return {
        successes: getNumber(KEYS.COMPLIANCE_SUCCESSES) ?? 0,
        attempts: getNumber(KEYS.COMPLIANCE_ATTEMPTS) ?? 0,
    };
}

export function setComplianceStats(
    successes: number,
    attempts: number,
): void {
    setNumber(KEYS.COMPLIANCE_SUCCESSES, successes);
    setNumber(KEYS.COMPLIANCE_ATTEMPTS, attempts);
}

// ── Module State ─────────────────────────────────────────────────────────────

export function isModuleEnabled(): boolean {
    return getBoolean(KEYS.MODULE_ENABLED) ?? true;
}

export function setModuleEnabled(enabled: boolean): void {
    setBoolean(KEYS.MODULE_ENABLED, enabled);
}

// ── Blocking Override ────────────────────────────────────────────────────────

export function getBlockingOverride(): number | null {
    const val = getNumber(KEYS.BLOCKING_OVERRIDE);
    return val !== undefined ? val : null;
}

export function setBlockingOverride(level: number | null): void {
    if (level === null) {
        deleteKey(KEYS.BLOCKING_OVERRIDE);
    } else {
        setNumber(KEYS.BLOCKING_OVERRIDE, level);
    }
}

// ── Onboarding Profile ───────────────────────────────────────────────────────

export function getUserProfile(): UserProfile | null {
    const raw = getString(KEYS.ONBOARDING_PROFILE);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch { }
    }
    return null;
}

export function setUserProfile(profile: UserProfile): void {
    setString(KEYS.ONBOARDING_PROFILE, JSON.stringify(profile));
}

export function isOnboardingComplete(): boolean {
    return getBoolean(KEYS.ONBOARDING_COMPLETE) ?? false;
}

export function setOnboardingComplete(complete: boolean): void {
    setBoolean(KEYS.ONBOARDING_COMPLETE, complete);
}

// ── Personalization State ────────────────────────────────────────────────────

export function getPersonalizationState(): PersonalizationState | null {
    const json = getString(KEYS.PERSONALIZATION_STATE);
    if (!json) return null;
    try {
        return JSON.parse(json) as PersonalizationState;
    } catch {
        return null;
    }
}

export function setPersonalizationState(state: PersonalizationState): void {
    setString(KEYS.PERSONALIZATION_STATE, JSON.stringify(state));
}

export function clearPersonalizationState(): void {
    deleteKey(KEYS.PERSONALIZATION_STATE);
    deleteKey(KEYS.PERSONALIZATION_LAST_DAILY);
}

export function getLastDailyUpdate(): number {
    return getNumber(KEYS.PERSONALIZATION_LAST_DAILY) ?? 0;
}

export function setLastDailyUpdate(timestamp: number): void {
    setNumber(KEYS.PERSONALIZATION_LAST_DAILY, timestamp);
}
