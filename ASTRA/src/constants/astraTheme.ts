/**
 * ASTRA Design System — Apple-inspired warm neutral palette
 * Derived from astra-focus-system reference UI
 */

export const AstraColors = {
    // ── Core Palette ─────────────────────────────────────────────────────
    background: '#FAF8F5',
    foreground: '#24272C',
    card: '#FFFFFF',
    cardForeground: '#24272C',

    // ── Primary (Sage Green) ─────────────────────────────────────────────
    primary: '#5C8A6C',
    primaryForeground: '#FFFFFF',
    primaryLight: '#E6F0E8',
    primaryMuted: '#9BB8A5',

    // ── Secondary (Muted Blue) ───────────────────────────────────────────
    secondary: '#EBF1F7',
    secondaryForeground: '#3A5070',

    // ── Blue Accent ──────────────────────────────────────────────────────
    blue: '#5B94C8',
    blueLight: '#EBF1F7',
    blueMuted: '#9BB8D0',

    // ── Muted / Warm Gray ────────────────────────────────────────────────
    muted: '#F4F3F1',
    mutedForeground: '#8A8A8A',
    warmGray: '#8C8078',
    warmGrayLight: '#F7F5F3',

    // ── Borders ──────────────────────────────────────────────────────────
    border: '#ECEAE7',
    borderSubtle: 'rgba(220,215,210,0.5)',
    inputBorder: '#E0DDD9',

    // ── Destructive ──────────────────────────────────────────────────────
    destructive: '#CC4444',
    destructiveForeground: '#FFFFFF',

    // ── Semantic: Focus ──────────────────────────────────────────────────
    focusDeep: '#5C8A6C',
    focusLight: '#5B94C8',
    focusRest: '#B8AD9E',

    // ── Semantic: Meditation ─────────────────────────────────────────────
    meditation: '#8B6EA5',
    meditationLight: '#F0ECF4',

    // ── Semantic: Health ─────────────────────────────────────────────────
    healthSleep: '#5B6DB8',
    healthHRV: '#4DAD6D',
    healthActivity: '#D4823A',

    // ── Status ───────────────────────────────────────────────────────────
    success: '#4DAD6D',
    warning: '#D4A23A',
    error: '#CC4444',

    // ── Surfaces ─────────────────────────────────────────────────────────
    surfaceGlass: 'rgba(255,255,255,0.72)',
    surfaceElevated: '#FFFFFF',
    shadowSoft: 'rgba(180,175,168,0.18)',
};

export const AstraShadow = {
    card: {
        shadowColor: '#B4AFA8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    elevated: {
        shadowColor: '#B4AFA8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },
    button: {
        shadowColor: '#5C8A6C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 3,
    },
};

export const AstraRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const AstraSpacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const AstraTypography = {
    display: {
        fontSize: 30,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
        color: AstraColors.foreground,
    },
    title: {
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
        color: AstraColors.foreground,
    },
    headline: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: AstraColors.foreground,
    },
    body: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: AstraColors.foreground,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
        color: AstraColors.mutedForeground,
    },
    label: {
        fontSize: 11,
        fontWeight: '600' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: AstraColors.mutedForeground,
    },
};

/** Reusable card style — replaces all glass-card / dark card patterns */
export const AstraCard = {
    backgroundColor: AstraColors.card,
    borderRadius: AstraRadius.lg,
    borderWidth: 1,
    borderColor: AstraColors.border,
    ...AstraShadow.card,
};

/** Reusable muted pill chip style */
export const AstraChip = {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AstraRadius.full,
    backgroundColor: AstraColors.muted,
};

export const AstraChipActive = {
    backgroundColor: AstraColors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(92,138,108,0.2)',
};
