/**
 * Base Container Property Definitions
 * 
 * This module provides reusable property definitions for container-based components.
 * Any component that extends Container will automatically get all these properties.
 * 
 * Usage:
 * ```tsx
 * import { createBaseContainerProperties, createBaseContainerSchema } from './base-container';
 * 
 * // Get base container properties
 * const baseProperties = createBaseContainerProperties(ComponentType.MY_CONTAINER);
 * 
 * // Add custom properties
 * const customProperties: PropertyMetadata[] = [
 *   // ... your custom properties
 * ];
 * 
 * // Create schema with base + custom properties
 * const myContainerSchema = createBaseContainerSchema(
 *   ComponentType.MY_CONTAINER,
 *   [...baseProperties, ...customProperties],
 *   customTabs,
 *   customGroups
 * );
 * ```
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER } from '../registry';

/**
 * Options for customizing base container properties
 */
export interface BaseContainerPropertyOptions {
  /**
   * Component types that these properties apply to
   */
  applicableTo: ComponentType[];
  
  /**
   * Optional property overrides (properties with same id will override base properties)
   */
  propertyOverrides?: Partial<PropertyMetadata>[];
  
  /**
   * Optional additional properties to add
   */
  additionalProperties?: PropertyMetadata[];
}

/**
 * Creates base container property definitions that can be extended
 * 
 * These properties include:
 * - Basic: hidden, disabled, tooltip
 * - Layout: x, y, width, height, minWidth, maxWidth, minHeight, maxHeight
 * - Advanced: zIndex, className, customAttributes
 * - Styles: backgroundColor, backgroundImage, padding
 * - Events: onClick
 */
export function createBaseContainerProperties(
  applicableTo: ComponentType | ComponentType[],
  options: Partial<BaseContainerPropertyOptions> = {}
): PropertyMetadata[] {
  const types = Array.isArray(applicableTo) ? applicableTo : [applicableTo];
  const { propertyOverrides = [], additionalProperties = [] } = options;
  
  // Create a map of overrides by id
  const overrideMap = new Map<string, Partial<PropertyMetadata>>();
  propertyOverrides.forEach(override => {
    if (override.id) {
      overrideMap.set(override.id, override);
    }
  });
  
  // Base container properties
  const baseProperties: PropertyMetadata[] = [
    // General Tab - Basic group
    {
      id: 'hidden',
      label: 'Visibility',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Expression to determine visibility (true = hidden, false = visible)',
      placeholder: 'e.g. {{!showContainer}}',
    },
    {
      id: 'disabled',
      label: 'Disabled',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Expression to determine if component is disabled',
      placeholder: 'e.g. {{table1.selectedRecord == null}}',
    },
    {
      id: 'tooltip',
      label: 'Tooltip',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Basic',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 0,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Tooltip text shown on hover',
      placeholder: 'e.g. {{"Container tooltip"}}',
    },
    
    // General Tab - Layout group
    {
      id: 'x',
      label: 'X',
      type: 'expression',
      defaultValue: 0,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'X position relative to parent (pixels)',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'y',
      label: 'Y',
      type: 'expression',
      defaultValue: 0,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Y position relative to parent (pixels)',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'width',
      label: 'Width',
      type: 'expression',
      defaultValue: 400,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Width in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'height',
      label: 'Height',
      type: 'expression',
      defaultValue: 300,
      supportsExpression: true,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 3,
      applicableTo: types,
      tooltip: 'Height in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'minWidth',
      label: 'Min Width',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 4,
      applicableTo: types,
      tooltip: 'Minimum width in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'maxWidth',
      label: 'Max Width',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 5,
      applicableTo: types,
      tooltip: 'Maximum width in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'minHeight',
      label: 'Min Height',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 6,
      applicableTo: types,
      tooltip: 'Minimum height in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    {
      id: 'maxHeight',
      label: 'Max Height',
      type: 'number',
      defaultValue: undefined,
      group: 'Layout',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 1,
      propertyOrder: 7,
      applicableTo: types,
      tooltip: 'Maximum height in pixels',
      layoutHint: {
        maxWidth: '100px',
      },
    },
    
    // General Tab - Advanced group
    {
      id: 'zIndex',
      label: 'Z-Index',
      type: 'number',
      defaultValue: undefined,
      supportsExpression: true,
      group: 'Advanced',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 2,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Z-index for layering (higher values appear on top)',
    },
    {
      id: 'className',
      label: 'Custom Class Names',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Advanced',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 2,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Custom CSS class names (space-separated)',
      placeholder: 'e.g. my-custom-class another-class',
    },
    {
      id: 'customAttributes',
      label: 'Custom Attributes',
      type: 'json',
      defaultValue: '',
      group: 'Advanced',
      tab: 'General',
      tabOrder: 0,
      groupOrder: 2,
      propertyOrder: 2,
      applicableTo: types,
      tooltip: 'Custom HTML attributes as JSON object (e.g., {"data-testid": "my-container"})',
      placeholder: '{"data-testid": "my-container"}',
    },
    
    // Styles Tab - Color & Typography group
    {
      id: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '{{theme.colors.surface}}',
      supportsExpression: true,
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Background color',
    },
    {
      id: 'backgroundImage',
      label: 'Background Image',
      type: 'expression',
      defaultValue: '',
      supportsExpression: true,
      group: 'Color & Typography',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 0,
      propertyOrder: 1,
      applicableTo: types,
      tooltip: 'Background image URL',
      placeholder: 'e.g. {{"/images/bg.png"}}',
    },
    
    // Styles Tab - Spacing group
    {
      id: 'padding',
      label: 'Padding',
      type: 'expression',
      defaultValue: '{{theme.spacing.sm}}',
      supportsExpression: true,
      group: 'Spacing',
      tab: 'Styles',
      tabOrder: 2,
      groupOrder: 1,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'Padding (top/right/bottom/left)',
      placeholder: 'e.g. 8px or {{theme.spacing.md}}',
    },
    
    // Events Tab - Events group
    {
      id: 'onClick',
      label: 'onClick',
      type: 'code',
      defaultValue: '',
      supportsExpression: true,
      group: 'Events',
      tab: 'Events',
      tabOrder: 4,
      groupOrder: 0,
      propertyOrder: 0,
      applicableTo: types,
      tooltip: 'JavaScript expression to execute on click',
      placeholder: 'e.g. {{actions.updateVariable("count", count + 1)}}',
    },
  ];
  
  // Apply overrides
  const propertiesWithOverrides = baseProperties.map(prop => {
    const override = overrideMap.get(prop.id);
    if (override) {
      return { ...prop, ...override };
    }
    return prop;
  });
  
  // Add additional properties
  return [...propertiesWithOverrides, ...additionalProperties];
}

/**
 * Creates base container tabs
 */
export function createBaseContainerTabs(customTabs: PropertyTab[] = []): PropertyTab[] {
  const baseTabs: PropertyTab[] = [
    { id: 'General', label: 'General', order: 0 },
    { id: 'Styles', label: 'Styles', order: 1 },
    { id: 'Events', label: 'Events', order: 2 },
  ];
  
  // Merge with custom tabs (custom tabs override base tabs by id)
  const tabMap = new Map<string, PropertyTab>();
  baseTabs.forEach(tab => tabMap.set(tab.id, tab));
  customTabs.forEach(tab => tabMap.set(tab.id, tab));
  
  return Array.from(tabMap.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Creates base container groups
 */
export function createBaseContainerGroups(customGroups: PropertyGroup[] = []): PropertyGroup[] {
  const baseGroups: PropertyGroup[] = [
    { 
      id: 'Basic', 
      label: 'Basic', 
      tab: 'General', 
      order: DEFAULT_GROUP_ORDER['Basic'] ?? 0, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Layout', 
      label: 'Layout', 
      tab: 'General', 
      order: DEFAULT_GROUP_ORDER['Layout'] ?? 1, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Color & Typography', 
      label: 'Color & Typography', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Color & Typography'] ?? 0, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Spacing', 
      label: 'Spacing', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Spacing'] ?? 1, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Borders', 
      label: 'Borders', 
      tab: 'Styles', 
      order: DEFAULT_GROUP_ORDER['Borders'] ?? 2, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Advanced', 
      label: 'Advanced', 
      tab: 'General', 
      order: 2, 
      collapsible: true, 
      defaultCollapsed: false 
    },
    { 
      id: 'Events', 
      label: 'Events', 
      tab: 'Events', 
      order: 0, 
      collapsible: true, 
      defaultCollapsed: false 
    },
  ];
  
  // Merge with custom groups (custom groups override base groups by id)
  const groupMap = new Map<string, PropertyGroup>();
  baseGroups.forEach(group => groupMap.set(group.id, group));
  customGroups.forEach(group => groupMap.set(group.id, group));
  
  return Array.from(groupMap.values());
}

/**
 * Creates a complete container property schema with base properties + custom properties
 */
export function createBaseContainerSchema(
  componentType: ComponentType,
  customProperties: PropertyMetadata[] = [],
  customTabs: PropertyTab[] = [],
  customGroups: PropertyGroup[] = []
): ComponentPropertySchema {
  // Get base container properties
  const baseProperties = createBaseContainerProperties(componentType);
  
  // Combine base and custom properties (custom properties override base by id)
  const allPropertiesMap = new Map<string, PropertyMetadata>();
  baseProperties.forEach(prop => allPropertiesMap.set(prop.id, prop));
  customProperties.forEach(prop => allPropertiesMap.set(prop.id, prop));
  const allProperties = Array.from(allPropertiesMap.values());
  
  // Get base tabs and groups
  const tabs = createBaseContainerTabs(customTabs);
  const groups = createBaseContainerGroups(customGroups);
  
  // Merge with common groups for Styles tab
  const allGroups = [...commonGroups.filter(g => g.tab === 'Styles'), ...groups];
  
  // Create schema
  return createPropertySchema(
    componentType,
    allProperties,
    tabs,
    allGroups
  );
}

