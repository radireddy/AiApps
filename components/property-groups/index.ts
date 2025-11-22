/**
 * Properties Architecture Module
 * 
 * This module provides a flexible, extensible system for managing component properties.
 * 
 * Key Features:
 * - Composition-based property groups
 * - Registry pattern for property management
 * - Factory pattern for creating configurations
 * - Template method pattern for rendering
 * 
 * Usage:
 * ```typescript
 * import { BasePropertiesRenderer, createPropertyConfig } from './property-groups';
 * 
 * const config = createPropertyConfig({
 *   baseGroups: ['layout', 'state', 'styling'],
 *   extendedGroups: ['border'],
 *   customGroups: [/* custom groups *\/]
 * });
 * 
 * <BasePropertiesRenderer
 *   component={component}
 *   updateProp={updateProp}
 *   config={config}
 *   onOpenExpressionEditor={onOpenExpressionEditor}
 * />
 * ```
 */

export * from './types';
export * from './base-groups';
export * from './registry';
export * from './factory';
export * from './BasePropertiesRenderer';
export * from './PropertyGroupRenderer';
export * from './PropertyRenderer';

