
/**
 * Converts a string to camelCase.
 * @example toCamelCase("Background Color") -> "backgroundColor"
 */
export const toCamelCase = (str: string) => str.replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => chr ? chr.toUpperCase() : '').replace(/^./, (c) => c.toLowerCase());

/**
 * Converts a string to PascalCase (UpperCamelCase).
 * Used for React component names.
 * @example toPascalCase("my page") -> "MyPage"
 */
export const toPascalCase = (str: string) => toCamelCase(str).replace(/^./, (c) => c.toUpperCase());

/**
 * Removes non-alphanumeric characters from a string.
 * Useful for sanitizing user-provided names for use as identifiers.
 * @example sanitizeName("My App (Final)") -> "MyAppFinal"
 */
export const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '');
