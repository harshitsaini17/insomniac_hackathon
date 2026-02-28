import type { Rule, RuleContext, Recommendation } from '@/types';

/**
 * Evaluates all rules against the given context.
 * Returns recommendations sorted by priority (high → low).
 */
export function evaluateRules(rules: Rule[], ctx: RuleContext): Recommendation[] {
    const results: Recommendation[] = [];
    for (const rule of rules) {
        const rec = rule.evaluate(ctx);
        if (rec) results.push(rec);
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return results.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
