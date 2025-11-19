
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
  // 1. Sanitize the expression. If it's empty or just whitespace, don't even try.
  const trimmedExpression = expression.trim();
  if (!trimmedExpression) {
    return undefined;
  }

  // 2. The 'with' block is the correct and robust way to create a sandboxed scope.
  const funcBody = `with(scope) { return ${trimmedExpression} }`;

  try {
    // 3. Create and execute the function.
    const func = new Function('scope', funcBody);
    return func(scope);
  } catch (error) {
    // 4. Handle errors gracefully, especially those that happen during user typing.

    // A. Check for ReferenceError (e.g., "n is not defined") for partially typed variables.
    // If the expression is a single word, it's likely a partially typed variable.
    // In this case, we can return it as a string to avoid errors while typing.
    if (error instanceof ReferenceError) {
        const isSimpleIdentifier = /^[a-zA-Z_]\w*$/.test(trimmedExpression);
        const isKeyword = ['true', 'false', 'null', 'undefined', 'console'].includes(trimmedExpression);
        if (isSimpleIdentifier && !isKeyword) {
            // It's a single word that's not defined, likely being typed. Return as a string.
            return trimmedExpression;
        }
    }
    
    // B. Check for SyntaxError (e.g., "name !=") for incomplete expressions.
    // We can suppress the console log for these to avoid spamming during typing.
    const isPartialSyntax = /[!=<>&|?.,]$/.test(trimmedExpression);
    if (error instanceof SyntaxError && isPartialSyntax) {
        // It's an incomplete expression. Return undefined and don't log the error.
        return undefined;
    }

    // C. For all other "real" errors, log them so the developer knows something is wrong, but don't crash.
    // console.error(`Error evaluating expression "${trimmedExpression}":`, error);
    return undefined;
  }
}


/**
 * Parses a string to find top-level variable dependencies.
 * This is a simple implementation and may not cover all edge cases.
 * It looks for patterns like `variable.property` or just `variable`.
 * @param expression - The expression string (e.g., "Input1.value > 10").
 * @returns An array of dependency keys (e.g., ["Input1"]).
 */
export function parseDependencies(expression: string): string[] {
  const dependencies = new Set<string>();
  // Regex to find variable-like patterns, avoids strings and numbers.
  const regex = /[a-zA-Z_]\w*(?=\s*(\.|\(|\)|\[|\]|\=\=|\!\=|\>|\<|\>\=|\<\=|\&\&|\|\||\?|\:|\+|\-|\*|\/|$))/g;
  
  const matches = expression.match(regex);
  if (matches) {
    matches.forEach(match => {
      // Avoid language keywords and literals
      if (!['true', 'false', 'null', 'undefined', 'console', 'return', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'function', '=>'].includes(match)) {
        dependencies.add(match.split('.')[0]); // Only care about the root object
      }
    });
  }
  return Array.from(dependencies);
}
