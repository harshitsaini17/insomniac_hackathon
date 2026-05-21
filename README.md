# Insomniac Hackathon — ASTRA

> **ASTRA** = Adaptive System for Thoughtful Response Architecture

A privacy-first, on-device cognitive optimization mobile application built with **React Native + Expo**. It uses personality-aware AI and a hybrid rule-based + LLM orchestrator to help users train focus, meditate effectively, monitor health, and build habits.

## What It Does

ASTRA is a comprehensive cognitive wellness app that adapts every recommendation to your psychological profile using Big Five personality traits, self-efficacy, impulsivity, and authority resistance scores.

### Core Modules

| Module | Description | Technology |
|--------|-------------|------------|
| **Onboarding & Personality Profiling** | Interactive Big Five assessment + 7-factor psychological model | Custom questionnaire engine |
| **Focus Trainer** | Pomodoro sessions, cognitive training games, attention tracking & analytics | Timers, game logic, scoring engine |
| **Meditation** | Personalized meditation recommendations based on stress, fatigue, and HRV | Rule engine + recommendation engine |
| **Health Monitor** | Daily logging for sleep, exercise, hydration, stress, HRV | Charts, trend analysis, scoring |
| **Behavioral Orchestrator Agent** | Hybrid rule-based + LLM agent that delivers adaptive nudges and interventions | Groq LLM + Rule Engine |

## Core Philosophy

- 🔒 **Privacy-first** — all data stays on-device. No cloud sync.
- 🧠 **Personality-aware** — every recommendation adapts to your psychological profile
- 🤖 **Hybrid AI** — rule-based engine for deterministic logic + LLM for personalization & nuance

## Architecture

```
insomniac-hackathon/
├── mobile-application/          # React Native + Expo app
│   ├── app/                     # App router screens
│   │   ├── (tabs)/              # Main tab navigation
│   │   ├── meditate/            # Meditation session screens
│   │   ├── health/              # Health logging screens
│   │   ├── focus/               # Focus training screens
│   │   └── meditate/            # Meditation screens
│   ├── components/              # Reusable components
│   │   ├── health/              # Health metric cards, charts
│   │   ├── meditate/            # Duration picker, intent picker, MSS charts
│   │   └── NudgeOverlay.tsx     # Behavioral intervention overlay
│   ├── store/                   # Zustand state stores
│   │   ├── user-store.ts        # User profile & personality
│   │   ├── health-store.ts      # Health data
│   │   ├── focus-store.ts       # Focus session state
│   │   └── meditation-store.ts  # Meditation session state
│   ├── engine/                  # Core business logic
│   │   ├── rule-engine.ts       # Hybrid rule-based + LLM orchestrator
│   │   ├── health-rules.ts      # Health scoring rules
│   │   ├── health-scores.ts     # Health metric calculations
│   │   ├── health-normalizers.ts
│   │   ├── health-trends.ts
│   │   ├── focus-rules.ts       # Focus session rules
│   │   ├── meditation-rules.ts  # Meditation recommendation rules
│   │   └── meditation-scores.ts
│   ├── types/                   # TypeScript type definitions
│   └── assets/                  # Icons, images, splash screens
└── ASTRA/                        # Legacy / reference architecture docs
    └── PROJECT.md               # Detailed architecture documentation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile Framework | React Native + Expo SDK |
| Language | TypeScript |
| Navigation | Expo Router |
| State Management | Zustand |
| Charts | Recharts / Victory Native |
| Native Modules | Kotlin (Android) for background tracking services |
| LLM Provider | Groq API (Llama/Mixtral) |
| Health Data | In-app manual logging (privacy-first) |

## Key Features

### Focus Trainer
- 🍅 **Pomodoro sessions** with cognitive readiness assessment pre-session
- 🎮 **Cognitive training games** — attention and reaction time exercises
- 📊 **Attention analytics** — track focus quality over time
- 🔔 **Adaptive strictness** — session rules relax or tighten based on your personality profile

### Meditation Module
- 🧘 **Intent-based sessions** — choose focus, stress relief, sleep preparation
- ❤️ **HRV-guided recommendations** — auto-suggests session type based on heart rate variability
- 📈 **MSS (Meditation Session Score)** — composite score tracking progress
- 🌙 **Stress-fatigue matrix** — 2D scatter plot for session planning

### Health Module
- **Daily input form** — sleep, exercise, hydration, stress, HRV
- **Composite readiness gauge** — cognitive readiness score
- **Trend charts** — weekly summaries and longitudinal tracking
- **Flag system** — automatic flagging of concerning patterns

### Behavioral Orchestrator Agent
The crown jewel: a **hybrid rule-based + LLM orchestrator** that:
- Monitors your data patterns across focus, meditation, and health
- Detects behavioral drift (e.g., declining focus scores)
- Delivers **contextual nudges** via `NudgeOverlay` components
- Adapts nudge **tone and frequency** based on your authority resistance and impulsivity
- Uses Groq LLM for nuanced, personalized messages while rule engine handles deterministic logic

## Getting Started

```bash
# Navigate to the mobile app
cd mobile-application

# Install dependencies
npm install

# Start the Expo dev server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

## Environment

Create `.env` in `mobile-application/`:

```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_PERSONALITY_MODEL=llama-3.3-70b
```

## Tests

```bash
# Unit tests for rule engine
npm test

# Focus engine tests
npm test -- focus-rules

# Meditation engine tests
npm test -- meditation-rules
```

## Data Model Highlights

| Entity | Key Fields |
|--------|-----------|
| User | Big Five scores, self-efficacy, impulsivity, authority resistance |
| Focus Session | duration, interruptions, cognitive score, readiness |
| Meditation Session | type, intent, HRV pre/post, MSS score |
| Health Daily | sleep hrs, exercise mins, hydration, stress (1-10), HRV |
| Nudge | trigger rule, message, delivery time, user response |

## Architecture Decisions

See `ASTRA/PROJECT.md` for 16 sections of detailed architecture documentation including navigation, state management, data models, environment configuration, and the complete rule engine specification.
