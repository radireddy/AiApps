
import { AppDefinition, AppComponent, AppVariable } from '../../../types';
import { toPascalCase } from './stringUtils';

/**
 * Defines the context in which an expression is being translated.
 * - 'jsx-attr': Inside a JSX attribute (e.g. `width={...}`).
 * - 'raw-js': Inside a JavaScript object or logic block (e.g. `style={{...}}`).
 * - 'jsx-children': As a child of a JSX element (e.g. `<div>{...}</div>`).
 * - 'code-block': Inside an executable code block (e.g. button click handler).
 */
export type ExpressionContext = 'jsx-attr' | 'raw-js' | 'jsx-children' | 'code-block';

const JS_RESERVED_WORDS = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'enum', 'await', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'arguments', 'eval'
]);

/**
 * Translates a low-code expression (using {{ }}) into valid React/JavaScript code.
 * 
 * It handles:
 * - Converting data store access (e.g. `Input1.value` -> `get(dataStore, 'Input1.value')`).
 * - Handling variable references.
 * - Preserving literals and identifiers.
 * - Transforming `actions.updateVariable` calls in code blocks into `setVariable` hooks.
 * 
 * @param value The value to translate (string expression or literal).
 * @param appDef The application definition (context).
 * @param context The context where the result will be used.
 * @returns A string of valid JavaScript/JSX code.
 */
export const translateExpression = (value: any, appDef: AppDefinition, context: ExpressionContext = 'jsx-attr'): string => {
    const isRaw = context === 'raw-js' || context === 'code-block';
    const allVariables = appDef.variables;
    const allComponents = appDef.components;

    if (value === undefined) {
        return isRaw ? 'undefined' : '{undefined}';
    }

    if (typeof value === 'boolean' || typeof value === 'number' || value === null) {
        return isRaw ? String(value) : `{${String(value)}}`;
    }

    if (typeof value !== 'string') {
        const stringified = JSON.stringify(value);
        return isRaw ? (stringified || 'undefined') : `{${stringified || 'undefined'}}`;
    }

    const varNames = new Set(allVariables.map(v => v.name));
    const componentMap = new Map(allComponents.map(c => [c.id, c]));
    const keywords = new Set([
        'theme', 'console', 'true', 'false', 'null', 'undefined', 
        'get', 'set', 'updateDataStore', 'dataStore', 'actions',
        'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'window', 'alert',
        ...JS_RESERVED_WORDS
    ]);

    const transformExpression = (expr: string): string => {
        // Tokenizer regex: 1. Strings, 2. Component.value, 3. Identifiers
        const tokenizer = /("(?:\\[\s\S]|[^"])*"|'(?:\\[\s\S]|[^'])*')|(\b[a-zA-Z_]\w*\.value\b)|(?<![\.\w])([a-zA-Z_]\w*)\b/g;

        let transformed = expr.replace(tokenizer, (match, stringLiteral, componentAccess, identifier) => {
            if (stringLiteral) return stringLiteral;

            if (componentAccess) {
                const [compId] = componentAccess.split('.');
                const component = componentMap.get(compId);
                const dataStoreKey = (component?.props as any)?.dataStoreKey;
                if (dataStoreKey) {
                    return `get(dataStore, '${dataStoreKey}')`;
                }
                return componentAccess;
            }

            if (identifier) {
                if (keywords.has(identifier) || varNames.has(identifier) || componentMap.has(identifier)) {
                    return identifier;
                }
                
                if (context === 'code-block') {
                    return identifier; // Assume local variable
                }

                return `get(dataStore, '${identifier}')`;
            }

            return match;
        });

        if (context === 'code-block') {
            transformed = transformed.replace(/actions\.updateVariable\s*\(\s*(['"])(.*?)\1\s*,\s*/g, (match, quote, varName) => {
                return `set${toPascalCase(varName)}(`;
            });
        }

        return transformed;
    };

    // If we're in a raw JS/code-block context and have a plain string (not a {{}} expression),
    // treat it as code to transform (e.g. actions.updateVariable -> setXyz).
    if (isRaw) {
        if (value.startsWith('{{') && value.endsWith('}}')) {
            const expression = value.substring(2, value.length - 2).trim();
            const finalExpr = transformExpression(expression);
            return isRaw ? finalExpr : `{${finalExpr}}`;
        }

        // Handle template-style strings containing mustache placeholders like "Hello {{ name }}"
        if (value.includes('{{') && value.includes('}}')) {
            const templateLiteral = value.replace(/{{\s*(.*?)\s*}}/g, (_, expression) => `\${${transformExpression(expression)}}`);
            return `\`${templateLiteral}\``;
        }

        // Heuristic: if the value looks like plain text (no code-like chars), return it as a string literal.
        const seemsLikeCode = /[()\[\].=<>+\-*/%&|?:]/.test(value) || value.includes('.') || value.includes('actions') || value.includes('updateVariable');
        if (!seemsLikeCode) {
            return JSON.stringify(value);
        }

        // Otherwise treat it as code and attempt to transform it.
        return transformExpression(value);
    }

    if (value.startsWith('{{') && value.endsWith('}}')) {
        const expression = value.substring(2, value.length - 2).trim();
        const finalExpr = transformExpression(expression);
        return isRaw ? finalExpr : `{${finalExpr}}`;
    }

    if (value.includes('{{') && value.includes('}}')) {
        const templateLiteral = value.replace(/{{\s*(.*?)\s*}}/g, (_, expression) => `\${${transformExpression(expression)}}`);
        return isRaw ? `\`${templateLiteral}\`` : `{\`${templateLiteral}\`}`;
    }

    if (context === 'jsx-attr') return `"${value}"`;
    if (isRaw) return JSON.stringify(value);
    return value;
};
