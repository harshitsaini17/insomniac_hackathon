import type { Rule } from '@/types';

export const focusRules: Rule[] = [
    {
        id: 'focus-progressive-up',
        name: 'Increase Difficulty',
        evaluate: (ctx) => {
            const last3 = ctx.focusSessions.filter((s) => s.completed).slice(-3);
            if (last3.length < 3) return null;
            const avgAcc = last3.reduce((a, s) => a + s.accuracy, 0) / 3;
            if (avgAcc > 80) {
                return {
                    id: 'focus-up',
                    type: 'exercise',
                    title: 'Level Up',
                    description: 'Great performance! Your next session will be harder.',
                    priority: 'low',
                    triggeredBy: 'focus-progressive-up',
                };
            }
            return null;
        },
    },
    {
        id: 'focus-progressive-down',
        name: 'Decrease Difficulty',
        evaluate: (ctx) => {
            const last3 = ctx.focusSessions.filter((s) => s.completed).slice(-3);
            if (last3.length < 3) return null;
            const avgAcc = last3.reduce((a, s) => a + s.accuracy, 0) / 3;
            if (avgAcc < 50) {
                return {
                    id: 'focus-down',
                    type: 'recovery',
                    title: 'Take It Easy',
                    description: 'Difficulty will be lowered to help you build confidence.',
                    priority: 'medium',
                    triggeredBy: 'focus-progressive-down',
                };
            }
            return null;
        },
    },
    {
        id: 'focus-rest-needed',
        name: 'Rest After Low Sleep',
        evaluate: (ctx) => {
            if (ctx.health.sleepHours < 6) {
                return {
                    id: 'focus-rest',
                    type: 'recovery',
                    title: 'Rest Before Training',
                    description: 'Low sleep detected. Try a shorter session or rest first.',
                    priority: 'high',
                    triggeredBy: 'focus-rest-needed',
                };
            }
            return null;
        },
    },
];
