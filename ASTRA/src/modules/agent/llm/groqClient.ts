// ─────────────────────────────────────────────────────────────────────────────
// Groq LLM Client — ASTRA Behavioral Orchestrator
// MANDATORY integration: Rules + LLM hybrid system.
// Generates edgy, personal, taunting messages using Groq (llama-3.3-70b).
// ─────────────────────────────────────────────────────────────────────────────

import type { UserState, ContextState, BehavioralGapScore } from '../types/orchestratorTypes';
import type { AgentContext } from '../engine/contextCollector';

// ═══════════════════════════════════════════════════════════════════════════════
// System Prompt — ASTRA's Edgy Taunting Personality
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are ASTRA — a brutally honest, witty, no-BS personal coach AI living inside a cognitive optimization app. You're not a therapist. You're not gentle. You're the voice in the user's head that says what they need to hear, not what they want to hear.

Your personality is:
- Like a savage best friend who roasts you but actually wants you to win
- Uses SHORT, PUNCHY, memorable one-liners (think viral tweet energy)
- References the user's PERSONAL GOALS — career, relationships, fitness, dating — to hit where it stings
- Never generic. Always specific. Always personal. Always citing their actual data.
- Mixes humor with brutal truth

# THE USER'S PERSONAL CONTEXT
The user has shared personal goals during onboarding. You MUST weave these into your taunts:
- Their RELATIONSHIP GOAL (e.g., wanting a girlfriend, becoming more confident socially)
- Their CAREER GOAL (e.g., landing an internship, cracking DSA)
- Their IDEAL FUTURE SELF
- Their SELF-IDENTIFIED WEAKNESS

Use these to create deeply personal, motivating taunts. Examples of the tone:

EXERCISE TAUNTS:
- "Do your workout. That's how you level up — and maybe get the girl too."
- "Hit the gym first. Confidence doesn't download itself."
- "You want a girlfriend? Start with push-ups."
- "3 sets now. Attraction later."

DSA / CAREER:
- "Finish today's DSA problem. That internship won't apply itself."
- "Solve one problem now. Future you at Google will thank you."
- "No practice, no offer letter. Simple math."

FOCUS:
- "You say you want success, but you're still scrolling."
- "Discipline now. Flex later."
- "Future CEO or professional procrastinator? Choose."
- "Five minutes of focus > five hours of regret."

MEDITATION:
- "Mind's chaotic? 3 minutes of breathing. Prove you're in control."
- "Can't sit still for 2 minutes? That's exactly why you need this."
- "Calm mind. Sharp brain. Attractive energy."

HEALTH:
- "5 hours of sleep? Your brain is running on fumes. No wonder you can't focus."
- "Skipping water again? Your brain cells are literally shrinking."

# TONE RULES BY BEHAVIORAL GAP
- gap LOW: Still edgy but encouraging. "Not bad. But 'not bad' isn't 'great'. Push."
- gap MODERATE: Provocative. "Your compliance is [X]%. That's mediocre. You settling for mediocre?"
- gap HIGH: Savage. "Distraction rate [X]%. Streak broken. You're speedrunning failure."  
- gap CRITICAL: Brutal wake-up call. "You set a goal and then did the exact opposite. What's even the point of having this app?"

# PERSONALITY CALIBRATION
- HIGH impulsivity: Extra direct. Short sentences. No room for excuses.
- HIGH authority resistance: Use reverse psychology. "I mean, you COULD just keep scrolling..."
- HIGH self-efficacy: Challenge their ego. "You think you're disciplined? Prove it."
- LOW self-efficacy: Tough love with a lifeline. "Yeah it's hard. Do it anyway. Start with 5 minutes."
- HIGH neuroticism: Still edgy but provide structure. "Stressed? Good. Channel it into 10 minutes of deep work."

# OUTPUT FORMAT
You MUST respond with valid JSON containing messages for EVERY module:
{
  "nudgeTitle": "Short punchy title (2-5 words, roast energy)",
  "nudgeMessage": "The main popup taunt (1-2 sentences, brutally personal, references their data)",
  "dashboardMessage": "Dashboard overview taunt (1 sentence, references their overall state + personal goals)",
  "focusMessage": "Focus module taunt (1 sentence, references their distraction rate/compliance/streak)",
  "meditationMessage": "Meditation taunt (1 sentence, references their stress/sessions/lack of practice)",
  "healthMessage": "Health module taunt (1 sentence, references their sleep/stress/exercise data)",
  "meditationSuggestion": "breathing|mindfulness|body-scan|yoga-nidra",
  "focusRecommendation": "What focus session to do and why (1 sentence)",
  "rationale": "Your strategy in 1 sentence"
}

CRITICAL RULES:
1. Each message MUST cite at least 1 specific data point (compliance %, sleep hours, streak, distraction rate)
2. Each message MUST reference their personal goals (career, relationship, fitness, future self)
3. Keep messages SHORT and PUNCHY — viral tweet length, NOT paragraph length
4. Be the coach they need, not the one they want
5. Do NOT include anything outside the JSON object.`;

// ═══════════════════════════════════════════════════════════════════════════════
// Groq API Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 15000;  // increased for longer response

// ═══════════════════════════════════════════════════════════════════════════════
// Main Query Function
// ═══════════════════════════════════════════════════════════════════════════════

export interface GroqResponse {
    nudgeTitle?: string;
    nudgeMessage?: string;
    dashboardMessage?: string;
    focusMessage?: string;
    meditationMessage?: string;
    healthMessage?: string;
    meditationSuggestion?: string;
    focusRecommendation?: string;
    rationale?: string;
}

export async function queryGroq(
    userState: UserState,
    context: ContextState,
    gap: BehavioralGapScore,
    agentCtx?: AgentContext,
): Promise<GroqResponse | null> {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
        console.warn('[Groq] No API key — LLM enhancement unavailable');
        return null;
    }

    const userPrompt = buildUserPrompt(userState, context, gap, agentCtx);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        console.log('[Groq] Sending request to Groq API...');

        const response = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.85,  // higher creativity for edgy taunts
                max_tokens: 500,    // more room for 4 module messages
                response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'unknown');
            console.warn(`[Groq] API error ${response.status}: ${errorText}`);
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.warn('[Groq] Empty response from API');
            return null;
        }

        console.log('[Groq] 🔥 Taunting response received:', content.substring(0, 120) + '...');

        const parsed = JSON.parse(content);
        return {
            nudgeTitle: parsed.nudgeTitle || undefined,
            nudgeMessage: parsed.nudgeMessage || undefined,
            dashboardMessage: parsed.dashboardMessage || undefined,
            focusMessage: parsed.focusMessage || undefined,
            meditationMessage: parsed.meditationMessage || undefined,
            healthMessage: parsed.healthMessage || undefined,
            meditationSuggestion: parsed.meditationSuggestion || undefined,
            focusRecommendation: parsed.focusRecommendation || undefined,
            rationale: parsed.rationale || undefined,
        };
    } catch (err) {
        if ((err as any)?.name === 'AbortError') {
            console.warn('[Groq] Request timed out after 15s');
        } else {
            console.warn('[Groq] Request failed:', err);
        }
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Prompt Builder — Feeds the LLM the user's full personal context
// ═══════════════════════════════════════════════════════════════════════════════

function buildUserPrompt(
    state: UserState,
    context: ContextState,
    gap: BehavioralGapScore,
    agentCtx?: AgentContext,
): string {
    // Personal goals from onboarding
    const coreGoal = agentCtx?.profile?.goalText || 'Not specified';
    const relationshipGoal = agentCtx?.profile?.relationshipGoal || 'Not specified';
    const idealSelf = agentCtx?.profile?.idealFutureSelf || 'Not specified';
    const weakness = agentCtx?.profile?.rawAnswers?.selfIdentifiedWeakness || 'Not specified';
    const futureDistraction = agentCtx?.profile?.rawAnswers?.primaryDistraction || 'Not specified';

    // Real-time data
    const goalSection = agentCtx?.activeGoalName
        ? `Active Focus Goal: "${agentCtx.activeGoalName}"`
        : 'No active focus goal (they haven\'t even set one)';

    const distractiveSection = agentCtx?.distractiveAppNames?.length
        ? `Most Distractive Apps: ${agentCtx.distractiveAppNames.join(', ')}`
        : 'No distractive apps tracked';

    const healthFlagSection = agentCtx?.healthFlags?.length
        ? `Health Flags: ${agentCtx.healthFlags.join(', ')}`
        : 'No health flags';

    const focusSection = agentCtx
        ? `Focus Sessions Today: ${agentCtx.completedSessionsToday}\nIn Focus Session Right Now: ${agentCtx.isInFocusSession ? 'YES' : 'NO'}`
        : 'Focus data unavailable';

    const meditationSection = agentCtx
        ? `Total Meditation Sessions Ever: ${agentCtx.meditationSessionCount}\nTotal Minutes Meditated: ${agentCtx.meditationTotalMinutes}\nAvg Session Rating: ${agentCtx.meditationAvgRating.toFixed(1)}/5${agentCtx.lastMeditationType ? `\nLast Type: ${agentCtx.lastMeditationType}` : ''}`
        : 'Meditation data unavailable';

    return `Generate EDGY, PERSONAL, TAUNTING messages for this user. Reference their PERSONAL GOALS and REAL METRICS.

=== WHO THIS USER IS (from onboarding) ===
Core Life Goal: "${coreGoal}"
Relationship/Personal Goal: "${relationshipGoal}"
Ideal Future Self: "${idealSelf}"
Self-Identified Weakness: "${weakness}"
Primary Distraction: "${futureDistraction}"
Goal Category: ${state.static.goalCategory}
Motivation Type: ${state.static.motivationType}

=== CURRENT CONTEXT ===
Mode: ${context.mode} (confidence: ${(context.confidence * 100).toFixed(0)}%)
Signals: ${context.signals.join(', ')}

=== BEHAVIORAL GAP ===
Level: ${gap.level} (score: ${gap.overall.toFixed(2)})
Primary tension: ${gap.primaryTension}
Breakdown:
  - Goal vs Focus: ${(gap.breakdown.goalVsFocus * 100).toFixed(0)}%
  - Distraction Deviation: ${(gap.breakdown.distractionDeviation * 100).toFixed(0)}%
  - Compliance Gap: ${(gap.breakdown.complianceGap * 100).toFixed(0)}%
  - Session Skip Rate: ${(gap.breakdown.sessionSkipRate * 100).toFixed(0)}%

=== PERSONALITY ===
- Conscientiousness: ${state.static.conscientiousness}/7
- Neuroticism: ${state.static.neuroticism}/7
- Impulsivity: ${(state.static.impulsivityIndex * 100).toFixed(0)}%
- Authority Resistance: ${(state.static.authorityResistance * 100).toFixed(0)}%
- Self-Efficacy: ${(state.static.selfEfficacy * 100).toFixed(0)}%
- Emotional Reactivity: ${(state.static.emotionalReactivity * 100).toFixed(0)}%
- Nudge Tone: ${state.static.nudgeTone}

=== HEALTH ===
- Sleep: ${state.dynamic.sleepHours}h (Quality: ${state.dynamic.sleepQuality}/5)
- Stress: ${state.dynamic.stressLevel}/5
- Fatigue: ${state.dynamic.fatigueLevel}/5
- Cognitive Readiness: ${(state.dynamic.cognitiveReadiness * 100).toFixed(0)}%
- ${healthFlagSection}

=== FOCUS ===
- ${goalSection}
- Compliance: ${(state.behavioral.complianceRate * 100).toFixed(0)}%
- Distraction Rate: ${(state.behavioral.distractionRate * 100).toFixed(0)}%
- Habit Streak: ${state.semiDynamic.habitStreak} days
- Days Since Last Focus: ${state.behavioral.daysSinceLastFocus}
- Session Survival: ${(state.behavioral.sessionSurvivalRate * 100).toFixed(0)}%
- Weekly Focus: ${state.semiDynamic.weeklyFocusMinutes} min
- ${focusSection}
- ${distractiveSection}

=== MEDITATION ===
- ${meditationSection}

=== TIME ===
- ${state.dynamic.timeOfDay} (${state.dynamic.hourOfDay}:00)

REMEMBER: 
1. Reference their relationship/personal goal in at least one message
2. Reference their career/core goal in at least one message  
3. Cite EXACT numbers (compliance %, sleep hours, streak count, session count)
4. Be SHORT and PUNCHY — one-liner energy
5. Make them feel called out, but motivated to prove you wrong`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Key Access
// ═══════════════════════════════════════════════════════════════════════════════

function getGroqApiKey(): string | null {
    try {
        // Expo public env vars are inlined at build time
        const key = (process.env as any).EXPO_PUBLIC_GROQ_API_KEY
            || (process.env as any).GROQ_API_KEY
            || null;
        return key;
    } catch {
        return null;
    }
}
