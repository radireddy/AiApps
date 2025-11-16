

import { useMemo } from 'react';
import { safeEval } from '../expressions/engine';

/**
 * A custom hook to evaluate a string value, which might be a literal, a pure JS expression, or a template literal.
 * It intelligently re-evaluates the expression only when its dependencies change.
 * @param value - The raw value from component props (e.g., "Hello" or "{{Input1.value}}" or "Value: {{counter}}").
 * @param scope - The entire evaluation scope containing all app state.
 * @param defaultValue - A fallback value if the expression is invalid or returns undefined.
 * @returns The evaluated result.
 */
export function useJavaScriptRenderer<T>(value: T, scope: Record<string, any>, defaultValue: T): T {
  const result = useMemo(() => {
    if (typeof value !== 'string') {
        return value; // Not a string, return as is.
    }

    const isPureExpression = value.startsWith('{{') && value.endsWith('}}');
    
    // Case 1: Pure Expression like "{{ Input1.value }}"
    if (isPureExpression) {
        const expression = value.substring(2, value.length - 2).trim();
        if (!expression) {
            return defaultValue;
        }
        const evaluated = safeEval(expression, scope);
        return evaluated !== undefined ? evaluated : defaultValue;
    }

    // Case 2: Template Literal like "Hello, {{ name }}"
    if (value.includes('{{') && value.includes('}}')) {
        const processedString = value.replace(/{{\s*(.*?)\s*}}/g, (match, expression) => {
            const result = safeEval(expression, scope);
            return result !== undefined && result !== null ? String(result) : '';
        });
        return processedString as any; // Cast to T, assuming it's a string
    }

    // Case 3: It's just a literal string.
    return value;

  }, [value, scope, defaultValue]);

  return result;
}