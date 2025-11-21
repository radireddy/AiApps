// A simple, safe expression evaluation engine.

/**
 * Safely evaluates a JavaScript expression within a given scope.
 * It uses the Function constructor with a `with` block to create a sandboxed function,
 * preventing access to global scope (like `window` or `document`) while
 * making all properties of the scope object available as local variables.
 * 
 * @param expression - The string expression to evaluate (e.g., "a + b.value").
 * @param scope - An object where keys are variable names available to the expression.
 * @returns The result of the expression. Returns undefined if syntax is invalid.
 * 
 * @example
 * const scope = { a: 10, b: 5 };
 * const result = safeEval("a + b", scope); // Returns 15
 */
export function safeEval(expression: string, scope: Record<string, any>): any {
  const trimmedExpression = expression.trim();
  if (!trimmedExpression) {
    return undefined;
  }

  const forbiddenGlobals = /(^|[^.\w])(?:window|document|globalThis|process|require|Function)\b/;
  if (forbiddenGlobals.test(trimmedExpression)) {
    throw new Error('Access to global objects is prohibited');
  }
  // Detect assignments like `x = ...` but avoid matching equality operators (`==`, `===`)
  const assignmentPattern = /^\s*[a-zA-Z_]\w*\s*=(?!=)/;
  if (assignmentPattern.test(trimmedExpression)) {
    throw new Error('Assignment is not allowed in expressions');
  }

  const funcBody = `with(scope) { return ${trimmedExpression} }`;

  try {
    const func = new Function('scope', funcBody);
    return func(scope);
  } catch (error) {
    if (error instanceof ReferenceError) {
        const isSimpleIdentifier = /^[a-zA-Z_]\w*$/.test(trimmedExpression);
        const isKeyword = ['true', 'false', 'null', 'undefined', 'console'].includes(trimmedExpression);
        if (isSimpleIdentifier && !isKeyword) {
            return trimmedExpression;
        }
    }
    const isPartialSyntax = /[!=<>&|?.,]$/.test(trimmedExpression);
    if (error instanceof SyntaxError && isPartialSyntax) {
        return undefined;
    }
    return undefined;
  }
}

export function parseDependencies(expression: string): string[] {
  const dependencies = new Set<string>();
  const regex = /[a-zA-Z_]\w*(?=\s*(\.|\(|\)|\[|\]|\=\=|\!\=|\>|\<|\>\=|\<\=|\&\&|\|\||\?|\:|\+|\-|\*|\/|$))/g;
  const matches = expression.match(regex);
  if (matches) {
    matches.forEach(match => {
      if (!['true', 'false', 'null', 'undefined', 'console', 'return', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'function', '=>'].includes(match)) {
        dependencies.add(match.split('.')[0]);
      }
    });
  }
  return Array.from(dependencies);
}
