import type { Rule, MeditationType } from '@/types';

export const meditationRules: Rule[] = [
    {
        id: 'med-low-sleep-breathing',
        name: 'Breathing for Low Sleep',
        evaluate: (ctx) => {
            if (ctx.health.sleepHours < 6) {
                return {
                    id: 'med-breathing',
                    type: 'meditation',
                    title: 'Try Breathing',
                    description: 'Low sleep detected. A breathing session can help restore calm.',
                    priority: 'high',
                    triggeredBy: 'med-low-sleep-breathing',
                };
            }
            return null;
        },
    },
    {
        id: 'med-low-hrv-yoga-nidra',
        name: 'Yoga Nidra for Low HRV',
        evaluate: (ctx) => {
            if (ctx.health.hrv !== undefined && ctx.health.hrv < 40) {
                return {
                    id: 'med-yoga-nidra',
                    type: 'recovery',
                    title: 'Recovery Session',
                    description: 'HRV is low. Yoga Nidra can help your body recover.',
                    priority: 'high',
                    triggeredBy: 'med-low-hrv-yoga-nidra',
                };
            }
            return null;
        },
    },
    {
        id: 'med-sedentary-mindfulness',
        name: 'Mindfulness After Sedentary',
        evaluate: (ctx) => {
            if (ctx.health.sedentaryMinutes > 120) {
                return {
                    id: 'med-mindfulness',
                    type: 'meditation',
                    title: 'Mindfulness Break',
                    description: 'You\'ve been sitting for a while. A brief mindfulness session can refresh you.',
                    priority: 'medium',
                    triggeredBy: 'med-sedentary-mindfulness',
                };
            }
            return null;
        },
    },
    {
        id: 'med-body-scan-evening',
        name: 'Body Scan in Evening',
        evaluate: (ctx) => {
            const hour = new Date().getHours();
            if (hour >= 20) {
                return {
                    id: 'med-body-scan',
                    type: 'meditation',
                    title: 'Wind Down',
                    description: 'It\'s evening. A body scan can prepare you for restful sleep.',
                    priority: 'low',
                    triggeredBy: 'med-body-scan-evening',
                };
            }
            return null;
        },
    },
];
