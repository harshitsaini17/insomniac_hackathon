import type { Rule } from '@/types';

export const healthRules: Rule[] = [
    {
        id: 'health-low-sleep',
        name: 'Low Sleep Alert',
        evaluate: (ctx) => {
            if (ctx.health.sleepHours < 6) {
                return {
                    id: 'health-sleep',
                    type: 'sleep',
                    title: 'Improve Sleep',
                    description: `Only ${ctx.health.sleepHours}h of sleep. Aim for 7-8h. Avoid screens before bed.`,
                    priority: 'high',
                    triggeredBy: 'health-low-sleep',
                };
            }
            return null;
        },
    },
    {
        id: 'health-low-hrv',
        name: 'Low HRV Recovery',
        evaluate: (ctx) => {
            if (ctx.health.hrv !== undefined && ctx.health.hrv < 40) {
                return {
                    id: 'health-hrv',
                    type: 'recovery',
                    title: 'Recovery Day',
                    description: 'Your HRV is low. Prioritize rest and light activity today.',
                    priority: 'high',
                    triggeredBy: 'health-low-hrv',
                };
            }
            return null;
        },
    },
    {
        id: 'health-sedentary',
        name: 'Sedentary Warning',
        evaluate: (ctx) => {
            if (ctx.health.sedentaryMinutes > 120) {
                return {
                    id: 'health-move',
                    type: 'exercise',
                    title: 'Time to Move',
                    description: 'You\'ve been sedentary for over 2 hours. A 10-min walk can help.',
                    priority: 'medium',
                    triggeredBy: 'health-sedentary',
                };
            }
            return null;
        },
    },
    {
        id: 'health-low-steps',
        name: 'Low Step Count',
        evaluate: (ctx) => {
            if (ctx.health.steps < 3000) {
                return {
                    id: 'health-steps',
                    type: 'exercise',
                    title: 'Get Walking',
                    description: `Only ${ctx.health.steps} steps today. Try a short walk to boost circulation.`,
                    priority: 'medium',
                    triggeredBy: 'health-low-steps',
                };
            }
            return null;
        },
    },
    {
        id: 'health-hydration',
        name: 'Hydration Reminder',
        evaluate: (ctx) => {
            if (ctx.health.hydrationGlasses < 4) {
                return {
                    id: 'health-water',
                    type: 'hydration',
                    title: 'Drink Water',
                    description: `Only ${ctx.health.hydrationGlasses} glasses today. Aim for at least 8.`,
                    priority: 'low',
                    triggeredBy: 'health-hydration',
                };
            }
            return null;
        },
    },
];
