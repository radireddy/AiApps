import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER } from '../registry';
import { ContainerLayoutRenderer } from '../renderers/ContainerLayoutRenderer';

/**
 * V-Stack-specific property definitions
 * V-Stack is a Panel-based component with vertical direction by default
 */
const vStackProperties: PropertyMetadata[] = [
  // Override state properties to move them to Basic group
  {
    id: 'disabled',
    label: 'Disabled',
    type: 'expression',
    defaultValue: false,
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.V_STACK],
    tooltip: 'Expression to determine if component is disabled',
    placeholder: 'e.g. {{Table1.selectedRecord == null}}',
  },
  {
    id: 'hidden',
    label: 'Hidden',
    type: 'expression',
    defaultValue: false,
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.V_STACK],
    tooltip: 'Expression to determine visibility',
    placeholder: 'e.g. {{!showAlert}}',
  },
  
  // Container Layout properties are already defined in panel.ts with applicableTo including V_STACK
  // No need to redefine them here
  
  // Color & Typography
  {
    id: 'backgroundColor',
    label: 'Background Color',
    type: 'color',
    defaultValue: '#ffffff',
    supportsExpression: true,
    group: 'Color & Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.V_STACK],
  },
  {
    id: 'backgroundGradient',
    label: 'Background Gradient',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Color & Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.V_STACK],
    placeholder: 'e.g. linear-gradient(...)',
  },
  
  // Styling (borders, spacing, effects)
  {
    id: 'padding',
    label: 'Padding',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Spacing',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: [ComponentType.V_STACK],
    placeholder: 'e.g. 8px or {{theme.spacing.md}}',
  },
  {
    id: 'margin',
    label: 'Margin',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Spacing',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: [ComponentType.V_STACK],
    placeholder: 'e.g. 8px or {{theme.spacing.md}}',
  },
];

/**
 * V-Stack-specific groups
 */
const vStackGroups: PropertyGroup[] = [
  { 
    id: 'Basic', 
    label: 'Basic', 
    tab: 'General', 
    order: DEFAULT_GROUP_ORDER['Basic'], 
    collapsible: true, 
    defaultCollapsed: false 
  },
  { 
    id: 'Container Layout', 
    label: 'Container Layout', 
    tab: 'General', 
    order: DEFAULT_GROUP_ORDER['Container Layout'], 
    collapsible: true, 
    defaultCollapsed: false,
    customGroupRenderer: ContainerLayoutRenderer as any,
  },
  { 
    id: 'Color & Typography', 
    label: 'Color & Typography', 
    tab: 'Styles', 
    order: DEFAULT_GROUP_ORDER['Color & Typography'], 
    collapsible: true, 
    defaultCollapsed: false 
  },
  { 
    id: 'Spacing', 
    label: 'Spacing', 
    tab: 'Styles', 
    order: DEFAULT_GROUP_ORDER['Spacing'], 
    collapsible: true, 
    defaultCollapsed: false 
  },
  { 
    id: 'Borders', 
    label: 'Borders', 
    tab: 'Styles', 
    order: DEFAULT_GROUP_ORDER['Borders'], 
    collapsible: true, 
    defaultCollapsed: false 
  },
];

/**
 * V-Stack property schema
 * Note: State group is excluded for V-Stack - state properties are merged into Basic group
 */
const vStackSchemaBase = createPropertySchema(
  ComponentType.V_STACK,
  vStackProperties,
  commonTabs,
  [...commonGroups, ...vStackGroups]
);

// Filter out State group and export the final schema
export const vStackSchema: ComponentPropertySchema = {
  ...vStackSchemaBase,
  groups: vStackSchemaBase.groups.filter(g => g.id !== 'State'),
};

