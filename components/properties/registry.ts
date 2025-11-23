import { ComponentType, ComponentProps } from '../../types';
import { ComponentPropertySchema, PropertyTab, PropertyGroup, PropertyMetadata } from './metadata';

/**
 * Common property definitions that can be reused across components
 */
export const commonProperties = {
  // Layout properties
  x: {
    id: 'x',
    label: 'X',
    type: 'number' as const,
    defaultValue: 0,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'X position relative to parent (pixels)',
  },
  y: {
    id: 'y',
    label: 'Y',
    type: 'number' as const,
    defaultValue: 0,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Y position relative to parent (pixels)',
  },
  width: {
    id: 'width',
    label: 'Width',
    type: 'number' as const,
    defaultValue: 100,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: 'all' as const,
    tooltip: 'Width in pixels',
  },
  height: {
    id: 'height',
    label: 'Height',
    type: 'number' as const,
    defaultValue: 100,
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: 'all' as const,
    tooltip: 'Height in pixels',
  },
  // State properties
  disabled: {
    id: 'disabled',
    label: 'Disabled',
    type: 'expression' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'State',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: 'all' as const,
    tooltip: 'Expression to determine if component is disabled',
    placeholder: 'e.g. {{Table1.selectedRecord == null}}',
  },
  hidden: {
    id: 'hidden',
    label: 'Hidden',
    type: 'expression' as const,
    defaultValue: false,
    supportsExpression: true,
    group: 'State',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    tooltip: 'Expression to determine visibility',
    placeholder: 'e.g. {{!showAlert}}',
  },
  // Styling properties
  opacity: {
    id: 'opacity',
    label: 'Opacity',
    type: 'expression' as const,
    defaultValue: 1,
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: 'all' as const,
  },
  boxShadow: {
    id: 'boxShadow',
    label: 'Shadow',
    type: 'expression' as const,
    defaultValue: '',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: 'all' as const,
    placeholder: 'e.g. 2px 2px 5px #ccc',
  },
  borderRadius: {
    id: 'borderRadius',
    label: 'Border Radius',
    type: 'expression' as const,
    defaultValue: '4px',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: 'all' as const,
  },
  borderWidth: {
    id: 'borderWidth',
    label: 'Border Width',
    type: 'expression' as const,
    defaultValue: '1px',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: 'all' as const,
  },
  borderStyle: {
    id: 'borderStyle',
    label: 'Border Style',
    type: 'dropdown' as const,
    defaultValue: 'solid',
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 4,
    applicableTo: 'all' as const,
    options: [
      { value: 'none', label: 'None' },
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
    ],
  },
  borderColor: {
    id: 'borderColor',
    label: 'Border Color',
    type: 'color' as const,
    defaultValue: '#e5e7eb',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 5,
    applicableTo: 'all' as const,
  },
};

/**
 * Common tabs
 */
export const commonTabs: PropertyTab[] = [
  { id: 'General', label: 'General', order: 0 },
  { id: 'Styles', label: 'Styles', order: 1 },
  { id: 'Events', label: 'Events', order: 2 },
];

/**
 * Common groups
 */
export const commonGroups: PropertyGroup[] = [
  { id: 'Layout', label: 'Layout', tab: 'General', order: 0, collapsible: true },
  { id: 'State', label: 'State', tab: 'General', order: 1, collapsible: true },
  { id: 'Styling', label: 'Styling', tab: 'Styles', order: 0, collapsible: true },
];

/**
 * Helper to create a property schema for a component
 */
export function createPropertySchema(
  componentType: ComponentType,
  customProperties: PropertyMetadata[],
  customTabs?: PropertyTab[],
  customGroups?: PropertyGroup[]
): ComponentPropertySchema {
  // Get common properties applicable to this component
  const applicableCommonProps = Object.values(commonProperties).filter((prop) => {
    if (prop.applicableTo === 'all') return true;
    if (Array.isArray(prop.applicableTo)) {
      return prop.applicableTo.includes(componentType);
    }
    return false;
  });

  // Combine common and custom properties
  const allProperties = [...applicableCommonProps, ...customProperties];

  // Use custom tabs/groups or defaults
  const tabs = customTabs || commonTabs;
  const groups = customGroups || commonGroups;

  return {
    componentType,
    tabs,
    groups,
    properties: allProperties,
  };
}

/**
 * Property registry - will be populated by component schemas
 */
export const propertyRegistry: Partial<Record<ComponentType, ComponentPropertySchema>> = {};

/**
 * Register a property schema for a component type
 */
export function registerPropertySchema(schema: ComponentPropertySchema): void {
  propertyRegistry[schema.componentType] = schema;
}

