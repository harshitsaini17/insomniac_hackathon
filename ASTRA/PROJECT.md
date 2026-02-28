# ASTRA — Comprehensive Project Documentation

> **ASTRA** = Adaptive System for Thoughtful Response Architecture  
> A privacy-first, on-device cognitive optimization mobile application built with React Native + Expo.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Application Architecture](#4-application-architecture)
5. [Navigation & Screens](#5-navigation--screens)
6. [Module 1: Onboarding & Personality Profiling](#6-module-1-onboarding--personality-profiling)
7. [Module 2: Focus Trainer](#7-module-2-focus-trainer)
8. [Module 3: Meditation Module](#8-module-3-meditation-module)
9. [Module 4: Health Module](#9-module-4-health-module)
10. [Module 5: Personalization Engine](#10-module-5-personalization-engine)
11. [Module 6: Behavioral Orchestrator Agent](#11-module-6-behavioral-orchestrator-agent)
12. [LLM Integration (Groq)](#12-llm-integration-groq)
13. [Rule Engine System](#13-rule-engine-system)
14. [State Management](#14-state-management)
15. [Data Models Reference](#15-data-models-reference)
16. [Environment & Configuration](#16-environment--configuration)

---

## 1. Project Overview

ASTRA is a **cognitive optimization app** that uses personality-aware AI to help users:
- **Train focus** through Pomodoro sessions, cognitive training games, and attention tracking
- **Meditate** with personalized session recommendations based on stress, fatigue, and HRV
- **Monitor health** through daily logging of sleep, exercise, hydration, stress, and HRV
- **Build habits** with adaptive strictness, nudges, and behavioral tracking
- **Receive personalized interventions** via a hybrid rule-based + LLM orchestrator agent

### Core Philosophy
- **Privacy-first**: All data stays on-device. No cloud sync.
- **Personality-aware**: All recommendations adapt to the user's BigFive traits, self-efficacy, impulsivity, and authority resistance.
- **Hybrid AI**: Rule-based engine provides structural recommendations; Groq LLM (llama-3.3-70b) personalizes the voice and tone.
- **Progressive overload**: The system adapts difficulty, strictness, and session length over time based on behavioral patterns.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK |
| Language | TypeScript (strict) |
| State Management | Zustand (6 stores) |
| Persistence | AsyncStorage (via zustand/middleware) |
| Navigation | React Navigation (Bottom Tab Navigator) |
| LLM | Groq API (llama-3.3-70b-versatile) |
| UI | React Native StyleSheet (dark theme, `#0D1117` base) |
| Build | Metro Bundler via Expo |
| Testing | Jest (__tests__/) |

---

## 3. Directory Structure

```
ASTRA/
├── App.js                          # Entry point
├── .env                            # GROQ_API_KEY, EXPO_PUBLIC_GROQ_API_KEY
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Root component (NavigationContainer)
│   │   └── Navigation.tsx          # Bottom tab navigator (6 tabs)
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Main hub: AFI, CRS, Orchestrator card, nudge timer
│   │   ├── FocusSessionScreen.tsx  # Pomodoro focus session runner
│   │   ├── CognitiveTrainingScreen.tsx  # N-Back + Attention Switching games
│   │   ├── HeatmapScreen.tsx       # Focus hour heatmap visualization
│   │   ├── MeditateScreen.tsx      # Meditation session + ASTRA recommendation
│   │   ├── HealthScreen.tsx        # Health dashboard + daily input form
│   │   └── SettingsScreen.tsx      # App settings
│   ├── components/
│   │   ├── NudgeOverlay.tsx        # Animated nudge popup (from orchestrator)
│   │   ├── health/                 # 12 health UI components
│   │   └── meditate/               # 10 meditation UI components
│   ├── modules/
│   │   ├── agent/                  # Behavioral Orchestrator Agent (8 files)
│   │   ├── focusTrainer/           # Focus Trainer module (22 files)
│   │   ├── health/                 # Health module (store + types)
│   │   ├── meditation/             # Meditation module (store + types)
│   │   ├── onboarding/             # Onboarding + personality profiling (9 files)
│   │   ├── personalization/        # Adaptive personalization engine (9 files)
│   │   └── shared/                 # Shared types, storage, user store (6 files)
│   ├── engine/                     # Rule engines (health, meditation, focus)
│   ├── constants/                  # Theme, health constants, meditation constants
│   ├── database/                   # SQLite schema + repository
│   ├── store/                      # Re-export stores
│   └── types/                      # Re-exports shared types
└── __tests__/                      # Jest tests
```

---

## 4. Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  DashboardScreen  FocusSession  Meditate  Health  Settings  │
│  CognitiveTraining  Heatmap   NudgeOverlay                  │
├─────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT (Zustand)                │
│  useOnboardingStore  useFocusStore  useHealthStore           │
│  useMeditationStore  usePersonalizationStore                │
│  useOrchestratorStore                                       │
├─────────────────────────────────────────────────────────────┤
│                  BEHAVIORAL ORCHESTRATOR AGENT               │
│  contextCollector → stateIngestion → contextInference →     │
│  behavioralGap → strategySelector → orchestrator →          │
│  groqClient (Groq LLM)                                     │
├─────────────────────────────────────────────────────────────┤
│                     RULE ENGINES                             │
│  health-rules  meditation-rules  focus-rules  rule-engine   │
├─────────────────────────────────────────────────────────────┤
│                   MATH/COMPUTATION LAYER                     │
│  attentionFragmentation  cognitiveReadiness  distractiveness│
│  complianceProbability  pomodoroSurvival  dopamineDetection │
│  goalConflict  personalityStrictness  normalize             │
├─────────────────────────────────────────────────────────────┤
│                    SERVICES LAYER                            │
│  UsageStatsService  HealthService  ActivityRecognition      │
│  BackgroundTaskService                                      │
├─────────────────────────────────────────────────────────────┤
│                    PERSISTENCE LAYER                         │
│  AsyncStorage (zustand/middleware)  SQLite (database/)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Navigation & Screens

**Bottom Tab Navigator** with 6 tabs:

| Tab | Screen | Icon | Description |
|---|---|---|---|
| Dashboard | `DashboardScreen` | 🏠 | AFI gauge, CRS score, orchestrator card, distractive apps, focus goals, auto-nudge timer |
| Focus | `FocusSessionScreen` | 🎯 | Pomodoro timer, session runner, focus goal tracking |
| Train | `CognitiveTrainingScreen` | 🧠 | Dual N-Back game, Attention Switching game |
| Meditate | `MeditateScreen` | 🧘 | Meditation session launcher, MSS score, ASTRA recommendation |
| Health | `HealthScreen` | ❤️ | Daily health input form, cognitive readiness gauge, health flags, recommendations |
| Settings | `SettingsScreen` | ⚙️ | App configuration |

Additional screens accessible via navigation:
- `HeatmapScreen` — Focus hour heatmap visualization

### NudgeOverlay
- A global modal component (`NudgeOverlay.tsx`) that renders on top of any screen
- Shows personalized nudge popups from the Behavioral Orchestrator
- Animated entrance/exit, adaptive theming based on tone and priority
- Actions: Accept, Snooze (5 min), Dismiss

---

## 6. Module 1: Onboarding & Personality Profiling

**Path**: `src/modules/onboarding/`

### Purpose
Captures the user's personality traits, goals, distractions, and emotional patterns through a 10-step questionnaire. Produces a comprehensive `UserProfile` that drives all downstream personalization.

### Onboarding Flow (10 Steps)
1. **welcome** — Introduction
2. **structured_1** — Conscientiousness (2 items), Neuroticism (2 items) — Likert 1–7
3. **structured_2** — Openness, Agreeableness, Extraversion — Likert 1–7
4. **structured_3** — Authority Resistance (2 items), Strictness Preference, Autonomy Preference — Likert 1–7
5. **open_goal** — "What is your core goal?" (free text)
6. **open_distraction** — "What is your primary distraction?" (free text)
7. **open_emotion** — "How do you feel after getting distracted?" (free text)
8. **open_future_self** — "Describe your ideal future self" (free text)
9. **open_weakness** — "What is your self-identified weakness?" (free text)
10. **summary** — Profile summary and confirmation

### Personality Model (UserProfile)

| Field | Type | Range | Source |
|---|---|---|---|
| `bigFive.conscientiousness` | number | 1–7 | Average of 2 Likert items |
| `bigFive.neuroticism` | number | 1–7 | Average of 2 Likert items |
| `bigFive.openness` | number | 1–7 | Single Likert item |
| `bigFive.agreeableness` | number | 1–7 | Single Likert item |
| `bigFive.extraversion` | number | 1–7 | Single Likert item |
| `impulsivityIndex` | number | 0–1 | Computed from neuroticism + conscientiousness |
| `authorityResistanceScore` | number | 0–1 | Average of 2 resistance items, normalized |
| `selfEfficacyScore` | number | 0–1 | Extracted from NLP analysis of open-ended answers |
| `emotionalReactivityScore` | number | 0–1 | Extracted from emotion valence analysis |
| `motivationType` | enum | intrinsic/extrinsic/mixed | Detected from goal text |
| `goalCategory` | enum | career/academic/health/creative/financial/personal/other | Detected from goal text |
| `goalUrgencyScore` | number | 0–1 | Urgency markers in text |
| `nudgeTone` | enum | supportive/sharp/challenge/confidence_building | Computed from personality traits |
| `distractionTypeVector` | Record | 0–1 per category | Keyword detection in distraction text |
| `predictedResponseMatrix` | object | P(comply\|intervention) | Predicted from personality |
| `baselineFocusEstimate` | number | 0–1 | Personality-based initial focus capacity |
| `idealFutureSelf` | string | — | User's ideal self (used in nudge personalization) |
| `personalizedSummary` | string | — | Human-readable personality summary |

### NLP Analysis
Open-ended answers are analyzed for:
- **Goal keywords** → GoalCategory mapping
- **Distraction keywords** → DistractionCategory mapping
- **Emotion words** → Valence scoring (-1 to 1)
- **Urgency markers** → UrgencyScore (0–1)
- **Self-efficacy indicators** → SelfEfficacyScore (0–1)
- **Motivation type** → intrinsic/extrinsic/mixed

### Nudge Tone Selection Rules
| Condition | Tone |
|---|---|
| High emotional reactivity + high guilt | `supportive` |
| Low emotional reactivity + indifferent | `sharp` |
| High self-efficacy | `challenge` |
| Low self-efficacy | `confidence_building` |

### Store: `useOnboardingStore`
- `answers: Partial<OnboardingAnswers>` — accumulates during flow
- `profile: UserProfile | null` — computed at summary step
- Actions: `goToNextStep()`, `setAnswer()`, `setProfile()`, `markComplete()`

---

## 7. Module 2: Focus Trainer

**Path**: `src/modules/focusTrainer/`

### Purpose
Provides focus session management, attention tracking, cognitive training games, and adaptive blocking/nudging based on the user's behavioral patterns.

### Sub-modules

#### Math Models (10 files)
| File | Purpose | Key Output |
|---|---|---|
| `attentionFragmentation.ts` | Attention Fragmentation Index | AFI score (0–1) |
| `cognitiveReadiness.ts` | Cognitive Readiness Score | CRS (0–1) from health + AFI |
| `distractivenessScore.ts` | Per-app distraction scoring | DS per app (0–1) |
| `complianceProbability.ts` | Bayesian compliance prediction | P(comply\|intervention) |
| `pomodoroSurvival.ts` | Pomodoro session survival rate | Survival probability |
| `dopamineDetection.ts` | Binge usage / dopamine loop detection | BingeDetectionResult |
| `goalConflict.ts` | Goal vs. behavior conflict scoring | Conflict score (0–1) |
| `personalityStrictness.ts` | Personality → strictness mapping | StrictnessResult |
| `attentionForecasting.ts` | Attention capacity prediction | Forecast model |
| `normalize.ts` | Normalization utilities | Helpers |

#### Engine (3 files)
| File | Purpose |
|---|---|
| `AdaptiveBlocker.ts` | Decides whether to block, delay, or allow app access |
| `InterventionEngine.ts` | Computes Intervention Suitability Score |
| `NudgeManager.ts` | Manages nudge state, cooldowns, fatigue tracking |

#### Services (4 files)
| File | Purpose |
|---|---|
| `UsageStatsService.ts` | Reads device app usage statistics |
| `HealthService.ts` | Interfaces with Health Connect |
| `ActivityRecognitionService.ts` | Detects user activity patterns |
| `BackgroundTaskService.ts` | Manages background tasks (periodic checks) |

#### Cognitive Training (2 files)
| File | Purpose |
|---|---|
| `DualNBack.ts` | Dual N-Back working memory game engine |
| `AttentionSwitching.ts` | Attention switching task game engine |

### Key Metrics

#### AFI (Attention Fragmentation Index)
- Measures how fragmented the user's attention is across apps
- Input: App usage sessions (timestamps, durations)
- Output: `AFIResult { score: 0–1, level: string, fragmentCount: number }`
- Higher score = more fragmented (worse)

#### CRS (Cognitive Readiness Score)
- Combines health signals + attention data into readiness estimate
- Input: Health signals (sleep, stress, fatigue, HRV), AFI
- Output: `CRSResult { score: 0–1, level: string, components: {...} }`
- Higher score = more ready for cognitive work

#### Distractiveness Score
- Per-app scoring based on usage patterns
- Input: Daily app usage stats
- Output: `DistractivenessResult { appName, score: 0–1, isDistractive: boolean }`

### Focus Session (Pomodoro)
```typescript
interface PomodoroSession {
    id: string;
    goalId: string | null;
    startedAt: number;
    plannedDuration: number;    // ms
    type: 'deep-work' | 'light-task' | 'training' | 'skip';
}
```

### Store: `useFocusStore`
Key state:
- `currentAFI: AFIResult | null`
- `currentCRS: CRSResult | null`
- `currentStrictness: StrictnessResult | null`
- `isInFocusSession: boolean`
- `activeSession: PomodoroSession | null`
- `completedSessionsToday: number`
- `activeGoal: FocusGoal | null`
- `goals: FocusGoal[]`
- `distractiveApps: DistractivenessResult[]`
- `personality: PersonalityProfile`
- `focusHeatmap: HourBlock[]`
- `nBackGame: NBackGameState | null`
- `switchGame: AttentionSwitchState | null`
- `trainingHistory: CognitiveTrainingResult[]`
- `bingeAlert: BingeDetectionResult | null`

---

## 8. Module 3: Meditation Module

**Path**: `src/modules/meditation/`

### Purpose
Recommends and tracks meditation sessions based on the user's stress, fatigue, mood, experience level, and HRV data. Computes a Meditation Suitability Score (MSS) that drives session type and duration recommendations.

### Meditation Types
| Type | Description |
|---|---|
| `mindfulness` | Present-moment awareness and observation |
| `body-scan` | Progressive body relaxation technique |
| `breathing` | Rhythmic breath regulation exercises |
| `yoga-nidra` | Deep conscious relaxation for recovery |

### Meditation Intents
`focus` | `calm` | `sleep` | `recovery` | `energy`

### Experience Levels
`novice` | `intermediate` | `advanced`

### Key Score: MSS (Meditation Suitability Score)
- Range: 0–100
- Computed from: stress_level, fatigue_level, mood, available_minutes, experience_level, intent, HRV
- Sub-components:
  - `RelaxationReadiness` — readiness for calming techniques
  - `ActivationReadiness` — readiness for energizing techniques
- Output includes: `recommended_type`, `recommended_duration`, `prep_seconds`, `core_seconds`, `attention_boost_est`

### Session Recording
```typescript
interface MeditationSessionRecord {
    id: string;
    date: string;
    type: MeditationType;
    intent: MeditationIntent;
    duration_seconds: number;
    completed: boolean;
    rating: 1 | 2 | 3 | 4 | 5;
    pre_hrv?: number;
    post_hrv?: number;
    efficacy_marked?: boolean;
    mss_at_time?: number;
}
```

### Store: `useMeditationStore`
- `dayRecords: MeditationDayRecord[]`
- `sessionRecords: MeditationSessionRecord[]`
- Key getters: `getSessionCount()`, `getTotalMinutes()`, `getAverageRating()`, `getLatestMeditationOutput()`, `getMeditationSummary(days)`

### UI Components (10)
- `RecommendedSessionCard` — ASTRA-recommended session
- `SessionCard` — Past session display
- `MSSBadge` — MSS score badge
- `MSSChart` — MSS trend chart
- `RatingModal` — Post-session rating modal (1–5)
- `RatingSparkline` — Rating trend sparkline
- `DurationPicker` — Session duration selector
- `IntentPicker` — Meditation intent selector
- `HRVScatter` — Pre/post HRV scatter plot
- `TimeSpentBar` — Time spent bar chart

---

## 9. Module 4: Health Module

**Path**: `src/modules/health/`

### Purpose
Tracks daily health metrics via manual entry, computes a comprehensive Cognitive Readiness score, and surfaces health flags and recommendations via a rule engine.

### Daily Health Input
```typescript
interface DailyHealthInput {
    date: string;               // YYYY-MM-DD
    sleep_hours: number;        // e.g. 7.5
    sleep_quality: number;      // 1–5
    sleep_disturbances: number; // count
    exercise_minutes: number;   // aerobic
    sedentary_hours: number;
    water_ml: number;
    stress_level: number;       // 1–5
    fatigue_level: number;      // 1–5
    hrv_rmssd_ms?: number;      // optional HRV
    weight_kg?: number;         // for hydration targets
    notes?: string;
}
```

### Computed Health Scores
| Score | Range | Description |
|---|---|---|
| `SleepScore` | 0–100 | Sleep hours quality composite |
| `SleepQualityScore` | 0–100 | Subjective sleep quality |
| `HRVScore` | 0–100 | Heart Rate Variability normalized |
| `StressScore` | 0–100 | Inverse stress (higher = less stress) |
| `FatigueScore` | 0–100 | Inverse fatigue |
| `RecoveryScore` | 0–100 | Overall recovery estimate |
| `ExerciseScore` | 0–100 | Exercise adequacy |
| `HydrationScore` | 0–100 | Hydration adequacy |
| `SedentaryScore` | 0–100 | Inverse sedentary (higher = less sedentary) |
| `LifestyleScore` | 0–100 | Overall lifestyle composite |
| `CognitiveReadiness` | 0–100 | **Master score** — determines attention capacity |
| `AttentionCapacity` | object | `{ level: 'high'\|'moderate'\|'light'\|'recovery', minutes: number }` |

### Health Flags
- Type: `urgent` | `warning` | `info`
- Surfaced by the rule engine based on scores and thresholds
- Example: "Sleep deprivation detected", "High stress level", "Chronic fatigue"

### Recommendations
```typescript
interface Recommendation {
    id: string;
    type: 'exercise' | 'sleep' | 'hydration' | 'recovery' | 'meditation' | 'stress';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    triggeredBy: string;   // rule ID
}
```

### Health Trends
- `computeRollingAverage(records, field, days)` — Rolling averages
- `detectTrend(records, field)` — Trend detection (improving/declining/stable)
- `checkChronicLow(records, field, threshold)` — Chronic pattern detection

### Store: `useHealthStore`
- `records: HealthDayRecord[]` (persisted with AsyncStorage)
- Key methods: `addDailyInput()`, `getLatestRecord()`, `getRecordsForDays(n)`, `getLatestHealthOutput()`, `getRollingAvg(field, days)`

### UI Components (12)
- `DailyInputForm` — Manual health data entry
- `CognitiveReadinessGauge` — Main readiness gauge
- `MetricCard` — Individual metric display
- `FlagChips` — Health flag pills
- `RecommendationCard` — Action recommendation
- `SleepChart` — Sleep trend chart
- `HRVChart` — HRV trend chart
- `ExerciseScatter` — Exercise scatter plot
- `HydrationRing` — Ring progress for hydration
- `ReadinessTrendChart` — Readiness over time
- `WeeklySummary` — 7-day health summary
- `AttentionRecommendation` — Attention capacity card

---

## 10. Module 5: Personalization Engine

**Path**: `src/modules/personalization/`

### Purpose
Adaptive personalization layer that evolves with user behavior. Tracks compliance, adjusts strictness, manages intervention fatigue, and maintains habit/attention state over time.

### Personalization State Structure

```typescript
interface PersonalizationState {
    // Layer 1: Baseline (from onboarding, rarely changes)
    baselineStrictness: StrictnessLevel;       // 1–5
    baselineNudgeTone: NudgeTone;
    baselineFocusLength: number;               // ms
    baselineInterventionTolerance: number;     // 0–1
    goalDriveScore: number;                    // 0–1
    authorityResistanceScore: number;          // 0–1
    emotionalSensitivityScore: number;         // 0–1
    impulsivityIndex: number;                  // 0–1

    // Layer 2: Adaptive (evolves with usage)
    complianceMatrix: ComplianceMatrix;        // P(comply) per intervention type
    strictness: AdaptiveStrictnessState;       // Current strictness + adjustments
    fatigue: InterventionFatigueState;         // Nudge fatigue tracking
    nudgeEffectiveness: Record<NudgeTone, number>;  // Tone → effectiveness

    // Attention tracking
    attention: AttentionEvolution;             // Focus time prediction, growth

    // Habit tracking
    habits: HabitState;                        // Streaks, focus days, weekly minutes

    // Meta
    totalInteractions: number;
    daysSinceOnboarding: number;
    lastDailyUpdate: number;
    createdAt: number;
    updatedAt: number;
}
```

### Key Sub-systems

#### Compliance Matrix (Bayesian Tracking)
Tracks `P(comply | intervention_type)` for each intervention type:
- `reflective` — gentle awareness nudge
- `soft_delay` — delayed app access
- `hard_block` — complete app block

Each tracks: `successes`, `attempts`, `probability`, `recentSuccesses`, `recentAttempts`

#### Adaptive Strictness
- Levels 1–5 (minimal → maximum)
- Starts at personality-derived baseline
- Adjusts based on compliance rate, override frequency, session success rate
- Direction: `up` | `down` | `hold`

#### Intervention Fatigue
- Prevents over-nudging
- Tracks: `fatigueScore (0–1)`, `nudgesDeliveredToday`, `dismissalsToday`, `consecutiveDismissals`

#### Attention Evolution
- Tracks `expectedFocusTime` (ms) — predicted sustainable session length
- `successRate` — % of completed sessions
- `trend` — improving/declining/stable
- `growthFactor` — progressive overload multiplier
- `recommendedSessionLength` — adaptive session length

#### Habit State
- `currentStreak` — consecutive focus days
- `longestStreak`
- `weeklyFocusMinutes: number[]` — last 7 days
- `totalFocusDays`

### Store: `usePersonalizationStore`
- Actions: `initialize(profile)`, `computeProfile(context)`, `recordCompliance(event)`, `recordFocusSession(session)`, `dailyUpdate()`

---

## 11. Module 6: Behavioral Orchestrator Agent

**Path**: `src/modules/agent/`

### Purpose
The "decision brain" of ASTRA. A 5-stage agentic pipeline that unifies all module data, infers user context, analyzes behavioral tension, selects intervention strategy, and generates personalized nudges using a hybrid rule-based + LLM approach.

### Architecture / Pipeline

```
Stage 1: State Ingestion
    ↓ (contextCollector.ts → collects from ALL 5 stores)
Stage 2: Context Inference
    ↓ (rules classify the user's current state)
Stage 3: Behavioral Gap Analysis
    ↓ (tension between goals and behavior)
Stage 4: Strategy Selection
    ↓ (maps context + gap to intervention type)
Stage 5: Directive Generation
    ↓ (rules build directive → LLM enhances voice)
Output: PersonalizationDirective + NudgePayload
```

### Files

| File | Purpose |
|---|---|
| `contextCollector.ts` | **Agentic context self-collector** — reads from all 5 Zustand stores using `getState()`, generates module-specific taunting messages |
| `stateIngestion.ts` | Stage 1 — builds unified `UserState` from profile, personalization, health, meditation, and focus data |
| `contextInference.ts` | Stage 2 — classifies the user's current mode using priority-ordered rules |
| `behavioralGap.ts` | Stage 3 — computes tension between stated goals and actual behavior |
| `strategySelector.ts` | Stage 4 — maps context + gap to an `InterventionStrategy` |
| `orchestrator.ts` | Stage 5 — main pipeline, builds directive, calls Groq LLM, merges results |
| `groqClient.ts` | Groq API client with rich personality-aware system prompt |
| `store/orchestratorStore.ts` | Zustand store exposing orchestrator to React components |

### Stage 1: State Ingestion (`UserState`)

The unified snapshot has 4 layers:

#### StaticTraits (from onboarding)
- BigFive scores (×5), impulsivityIndex, authorityResistance, selfEfficacy, emotionalReactivity
- motivationType, goalCategory, nudgeTone

#### SemiDynamicSignals (from personalization + meditation)
- goalUrgency, habitStreak, habitStrength, attentionTrend, complianceTrend
- weeklyFocusMinutes, totalSessionCount, averageMeditationRating

#### DynamicSignals (from health + focus — real-time)
- cognitiveReadiness, meditationSuitability, hrvState, hrvNormalized
- stressLevel, fatigueLevel, sleepHours, sleepQuality
- attentionCapacity, currentAFI, timeOfDay, hourOfDay

#### BehavioralSignals (from personalization)
- distractionRate, complianceRate, overrideFrequency, sessionSurvivalRate
- nudgeDismissRate, consecutiveDismissals, interventionFatigue
- lastSessionWasSuccessful, daysSinceLastFocus

### Stage 2: Context Inference (`ContextState`)

8 possible context modes, inferred via priority-ordered rules:

| Mode | Trigger Conditions |
|---|---|
| `performance-ready` | CRS high, sleep good, low fatigue |
| `maintenance` | Average state, normal day |
| `cognitively-fatigued` | CRS low, high fatigue |
| `emotionally-reactive` | High stress + high neuroticism |
| `overloaded` | Fatigue + stress both high |
| `drifting` | Low compliance + rising distraction |
| `recovering` | Post-session or CRS recovering |
| `opportunity-window` | CRS high + no sessions yet today |

Output: `{ mode, confidence: 0–1, signals: string[], secondaryMode? }`

### Stage 3: Behavioral Gap (`BehavioralGapScore`)

Measures tension between user's stated goals and actual behavior:

| Dimension | What It Measures |
|---|---|
| `goalVsFocus` | Goal urgency vs. actual focus time |
| `distractionDeviation` | Expected vs. actual distraction |
| `complianceGap` | Expected vs. actual compliance |
| `sessionSkipRate` | Missed sessions |
| `recoveryNeglect` | Ignoring recovery signals under stress |

Overall score → Level: `low` | `moderate` | `high` | `critical`

### Stage 4: Strategy Selection (`InterventionStrategy`)

| Field | Options |
|---|---|
| `type` | reflective, supportive, enforcing, recovery-first, opportunity-driven |
| `tone` | supportive, sharp, challenge, confidence_building |
| `strictness` | 1–5 |
| `timing` | immediate, delayed, scheduled |
| `modality` | reflective, soft_delay, hard_block |

### Stage 5: Directive Generation (`PersonalizationDirective`)

Final output structure:
```typescript
interface PersonalizationDirective {
    contextState: ContextState;
    behavioralGap: BehavioralGapScore;
    strategy: InterventionStrategy;
    strictness: StrictnessLevel;
    tone: NudgeTone;
    recommendedFocus: { sessionLength, type, reason };
    recoveryFlag: boolean;
    recoveryAction?: RecoveryStyle;
    meditationType: MeditationType;
    meditationDuration: number;
    plannerAdjustment: 'proceed' | 'delay' | 'reduce-load' | 'reschedule';
    habitFocus: string;
    moduleMessages: {
        dashboard: string;   // taunting overview
        focus: string;       // focus-specific taunt
        meditation: string;  // meditation-specific taunt
        health: string;      // health-specific taunt
    };
    nudge?: NudgePayload;
    rationale: string;
    generatedAt: number;
    source: 'rules' | 'llm' | 'hybrid';
}
```

### Agentic Context Collector (`contextCollector.ts`)

Self-collects from all 5 stores via `Zustand.getState()` (no React hooks needed):

| Store | Data Collected |
|---|---|
| `useOnboardingStore` | profile (BigFive, impulsivity, goals) |
| `usePersonalizationStore` | compliance matrix, habits, attention, fatigue |
| `useHealthStore` | latest record (cognitive readiness, stress, fatigue, sleep, HRV, flags) |
| `useMeditationStore` | session count, total minutes, avg rating, MSS, last type |
| `useFocusStore` | AFI, CRS, active goal name, sessions today, distractive app names |

Also generates **rule-based module messages** (first pass):
- `generateDashboardMessage(ctx)` — streak, compliance, distractive apps
- `generateFocusMessage(ctx)` — sessions, distraction rate, goal status
- `generateMeditationMessage(ctx)` — session count, stress vs. meditation effort
- `generateHealthMessage(ctx)` — sleep, stress, fatigue, cognitive readiness, flags

These are used as fallbacks if LLM fails, or as structural scaffolding that the LLM enhances.

### Module Messages Displayed

| Screen | Message Field | Example |
|---|---|---|
| Dashboard | `moduleMessages.dashboard` | "No streak. Compliance at 30%. Wasting time on: Instagram, TikTok." |
| Dashboard | `moduleMessages.focus` | "Zero focus sessions today. Distraction rate 60%. What's your excuse?" |
| Meditate | `moduleMessages.meditation` | "0 sessions ever. Stress 4/5 and you're doing nothing about it." |
| Health | `moduleMessages.health` | "5h sleep — you're sabotaging yourself. Fatigue 4/5." |

### Auto-Nudge Timer
- On DashboardScreen, the orchestrator re-runs every **60 seconds** automatically
- Each run calls the full pipeline (rules + Groq LLM)
- Cooldown between runs: **10 seconds** (testing mode; 60s in production)

---

## 12. LLM Integration (Groq)

**File**: `src/modules/agent/llm/groqClient.ts`

### Configuration
| Parameter | Value |
|---|---|
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Model | `llama-3.3-70b-versatile` |
| Temperature | 0.7 |
| Max Tokens | 300 |
| Timeout | 10 seconds |
| Response Format | `{ type: 'json_object' }` |
| API Key Source | `EXPO_PUBLIC_GROQ_API_KEY` (env var) |

### System Prompt Rules

The system prompt instructs the LLM on:

**Personality Adaptation:**
- HIGH authority resistance (>0.6): Never commanding, use suggestions
- HIGH emotional reactivity (>0.6): Warm, gentle, validating
- HIGH self-efficacy (>0.6): Challenge and push, use accountability
- LOW self-efficacy (<0.4): Build confidence with small wins
- HIGH impulsivity (>0.6): Direct about consequences
- HIGH conscientiousness (>5): Appeal to standards
- HIGH neuroticism (>5): Provide reassurance

**Context Adaptation:**
- `drifting` mode: **TAUNTING and PROVOCATIVE** — calls user out directly with their data
- `performance-ready`: Energetic, capitalize on readiness
- `overloaded`: Do NOT add more tasks, suggest rest
- Other modes: Calibrated appropriately

**Behavioral Gap Response:**
- `low`: Supportive, maintenance
- `moderate`: Direct and challenging
- `high`: Taunting intervention with exact metrics
- `critical`: Harsh truth, zero sugar-coating

### User Prompt Content
The user prompt sent to Groq includes:
- Full context mode + confidence + signals
- Complete behavioral gap breakdown (5 dimensions)
- All personality scores (7 dimensions)
- Health state (stress, fatigue, readiness, sleep, HRV, flags)
- Focus behavior (goal name, compliance %, distraction %, streak, sessions, distractive apps)
- Meditation data (session count, total minutes, rating, last type)
- Time context
- **Mandate**: Must reference at least 2 specific data points

### LLM Response Format
```json
{
    "nudgeTitle": "Short catchy title (3-6 words)",
    "nudgeMessage": "Personalized message with specific data references",
    "meditationSuggestion": "breathing|mindfulness|body-scan|yoga-nidra",
    "focusRecommendation": "What kind of session and why",
    "rationale": "Brief explanation of strategy choice"
}
```

### Merge Strategy (`mergeWithLLM`)
LLM outputs are merged into the rule-based directive:
- `nudgeTitle` → overwrites rule nudge title
- `nudgeMessage` → overwrites rule nudge message
- `meditationSuggestion` → used if valid meditation type
- `focusRecommendation` → added to focus recommendation reason
- `rationale` → combined with rule rationale
- `source` → set to `'hybrid'`

---

## 13. Rule Engine System

### Health Rules (`engine/health-rules.ts`)
Priority-ordered rules that evaluate health inputs and computed scores:
- Sleep deprivation detection
- Chronic fatigue detection
- HRV anomaly detection
- Exercise deficit/excess
- Hydration warnings
- Stress threshold alerts

Output: `{ recommendation?, flag?, attentionOverride?, readinessBoost? }`

### Meditation Rules (`engine/meditation-rules.ts`)
Priority-ordered rules for meditation recommendations:
- High stress → breathing
- Post-session → yoga-nidra
- HRV-based adjustments
- Experience-level adaptations
- Duration overrides

Output: `{ typeOverride?, durationOverride?, flag?, mssAdjust? }`

### Focus Rules (`engine/focus-rules.ts`)
Rules for focus session recommendations based on health + attention state.

### Rule Context
```typescript
interface RuleContext {
    user: UserProfile;
    health: DailyHealthInput;
    healthRecords: HealthDayRecord[];
    focusSessions: FocusSession[];
    meditationSessions: MeditationSession[];
}
```

---

## 14. State Management

ASTRA uses 6 Zustand stores:

| Store | File | Persisted | Purpose |
|---|---|---|---|
| `useOnboardingStore` | `onboarding/store/onboardingStore.ts` | No | Onboarding flow + profile |
| `useFocusStore` | `focusTrainer/store/focusStore.ts` | No | Focus session state, metrics, training |
| `useHealthStore` | `health/store/health-store.ts` | Yes (AsyncStorage) | Health records + computed scores |
| `useMeditationStore` | `meditation/store/meditation-store.ts` | Yes (AsyncStorage) | Meditation records + sessions |
| `usePersonalizationStore` | `personalization/store/personalizationStore.ts` | No | Adaptive personalization state |
| `useOrchestratorStore` | `agent/store/orchestratorStore.ts` | No | Orchestrator directive + nudge |

### Orchestrator Store Details
```typescript
interface OrchestratorStoreState {
    directive: PersonalizationDirective | null;
    currentNudge: NudgePayload | null;
    contextMode: ContextMode | null;
    isLoading: boolean;
    lastRunAt: number | null;
    nudgeHistory: NudgePayload[];
    error: string | null;

    runOrchestration: (params) => Promise<void>;
    dismissNudge: () => void;
    snoozeNudge: (delayMs?) => void;
    acceptNudge: () => void;
    clearDirective: () => void;
}
```

---

## 15. Data Models Reference

### Nudge Payload
```typescript
interface NudgePayload {
    id: string;
    title: string;
    message: string;
    tone: NudgeTone;
    icon: string;              // emoji
    actions: NudgeAction[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: number;
    contextMode: ContextMode;
}

interface NudgeAction {
    label: string;
    action: 'accept' | 'snooze' | 'dismiss' | 'navigate';
    target?: string;           // screen name
    isPrimary: boolean;
}
```

### Blocking Decision
```typescript
interface BlockingDecision {
    shouldBlock: boolean;
    level: BlockingLevel;      // 'none' | 'nudge' | 'delay' | 'block'
    reason: string;
    appPackage: string;
}
```

### Focus Goal
```typescript
interface FocusGoal {
    id: string;
    title: string;
    description: string;
    targetMinutes: number;
    completedMinutes: number;
    status: 'active' | 'completed' | 'abandoned';
    createdAt: number;
}
```

---

## 16. Environment & Configuration

### `.env` File
```
GROQ_API_KEY=gsk_xxx...
EXPO_PUBLIC_GROQ_API_KEY=gsk_xxx...
```

Both are needed: `GROQ_API_KEY` for server-side and `EXPO_PUBLIC_GROQ_API_KEY` for React Native runtime access (Expo inlines `EXPO_PUBLIC_*` vars at build time).

### Theme Constants (`constants/theme.ts`)
- Background: `#0D1117`
- Card: `#161B22`
- Border: `#21262D`
- Primary: `#58A6FF`
- Text: `#E6EDF3`
- Secondary text: `#8B949E`

### Key Configuration Values
| Key | Value | Location |
|---|---|---|
| Auto-nudge interval | 60 seconds | DashboardScreen.tsx |
| Orchestrator cooldown | 10 seconds (testing) | orchestratorStore.ts |
| Groq timeout | 10 seconds | groqClient.ts |
| LLM model | llama-3.3-70b-versatile | groqClient.ts |
| LLM temperature | 0.7 | groqClient.ts |
| Max nudge history | 20 | orchestratorStore.ts |
| Snooze duration | 5 minutes (300,000ms) | orchestratorStore.ts |

---

*This document provides complete context for the ASTRA project. Every module, type, data flow, and architectural decision is documented above.*
