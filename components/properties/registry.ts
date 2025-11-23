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
    layoutHint: {
      maxWidth: '100px',
    },
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
    layoutHint: {
      maxWidth: '100px',
    },
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
    layoutHint: {
      maxWidth: '100px',
    },
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
    layoutHint: {
      maxWidth: '100px',
    },
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
 * Default group order for consistent ordering across all components
 * Groups are ordered by tab first, then by this order within each tab
 */
export const DEFAULT_GROUP_ORDER: Record<string, number> = {
  // General tab groups
  'Basic': 0,
  'Layout': 1,
  'State': 2,
  'Input Form And Validation': 3,
  'Accessibility': 4,
  'Container Layout': 5,
  'Color & Typography': 6,
  'Typography': 7,
  'Spacing': 8,
  'Borders': 9,
  // Styles tab groups
  'Styling': 0,
  // Events tab groups
  'Events': 0,
};

/**
 * Common groups with consistent default ordering
 */
export const commonGroups: PropertyGroup[] = [
  { id: 'Layout', label: 'Layout', tab: 'General', order: DEFAULT_GROUP_ORDER['Layout'], collapsible: true },
  { id: 'State', label: 'State', tab: 'General', order: DEFAULT_GROUP_ORDER['State'], collapsible: true },
  { id: 'Styling', label: 'Styling', tab: 'Styles', order: DEFAULT_GROUP_ORDER['Styling'], collapsible: true },
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
      const applicableTypes = prop.applicableTo as ComponentType[];
      return applicableTypes.includes(componentType);
    }
    return false;
  });

  // Combine common and custom properties
  const allProperties = [...applicableCommonProps, ...customProperties];

  // Use custom tabs/groups or defaults
  const tabs = customTabs || commonTabs;
  
  // Merge common and custom groups, deduplicating by id
  let groups: PropertyGroup[];
  if (customGroups && customGroups.length > 0) {
    const groupMap = new Map<string, PropertyGroup>();
    // First add common groups
    commonGroups.forEach(group => {
      groupMap.set(group.id, group);
    });
    // Then add/override with custom groups (custom groups take precedence)
    customGroups.forEach(group => {
      // If custom group doesn't have an order, use default order
      if (group.order === undefined) {
        group.order = DEFAULT_GROUP_ORDER[group.id] ?? 999;
      }
      groupMap.set(group.id, group);
    });
    groups = Array.from(groupMap.values());
  } else {
    groups = commonGroups;
  }
  
  // Sort groups: first by tab, then by order within tab
  groups.sort((a, b) => {
    // First sort by tab order
    const tabA = tabs.find(t => t.id === a.tab);
    const tabB = tabs.find(t => t.id === b.tab);
    const tabOrderA = tabA?.order ?? 999;
    const tabOrderB = tabB?.order ?? 999;
    if (tabOrderA !== tabOrderB) {
      return tabOrderA - tabOrderB;
    }
    
    // Within the same tab, sort by order
    // Use orderOverride if provided, otherwise use order, otherwise use default order
    const orderA = a.orderOverride ?? a.order ?? DEFAULT_GROUP_ORDER[a.id] ?? 999;
    const orderB = b.orderOverride ?? b.order ?? DEFAULT_GROUP_ORDER[b.id] ?? 999;
    return orderA - orderB;
  });

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

