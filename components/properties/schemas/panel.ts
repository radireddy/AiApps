import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER } from '../registry';
import { ContainerLayoutRenderer } from '../renderers/ContainerLayoutRenderer';

/**
 * Panel-specific property definitions
 */
const panelProperties: PropertyMetadata[] = [
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
    applicableTo: [ComponentType.PANEL],
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
    applicableTo: [ComponentType.PANEL],
    tooltip: 'Expression to determine visibility',
    placeholder: 'e.g. {{!showAlert}}',
  },
  
  // Container Layout
  {
    id: 'direction',
    label: 'Direction',
    type: 'dropdown',
    defaultValue: 'horizontal',
    group: 'Container Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
    options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
    ],
  },
  {
    id: 'justifyContent',
    label: 'Justify Content',
    type: 'dropdown',
    defaultValue: 'start',
    group: 'Container Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
    options: [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
      { value: 'space-between', label: 'Space Between' },
    ],
  },
  {
    id: 'alignItems',
    label: 'Align Items',
    type: 'dropdown',
    defaultValue: 'center',
    group: 'Container Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 2,
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
    options: [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
      { value: 'stretch', label: 'Stretch' },
    ],
  },
  
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
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
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
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
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
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
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
    applicableTo: [ComponentType.PANEL, ComponentType.H_STACK, ComponentType.V_STACK],
    placeholder: 'e.g. 8px or {{theme.spacing.md}}',
  },
  {
    id: 'borderTop',
    label: 'Border Top',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Borders',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: 'all',
  },
  {
    id: 'borderRight',
    label: 'Border Right',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Borders',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 2,
    propertyOrder: 1,
    applicableTo: 'all',
  },
  {
    id: 'borderBottom',
    label: 'Border Bottom',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Borders',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 2,
    propertyOrder: 2,
    applicableTo: 'all',
  },
  {
    id: 'borderLeft',
    label: 'Border Left',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Borders',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 2,
    propertyOrder: 3,
    applicableTo: 'all',
  },
];

/**
 * Panel-specific groups
 */
const panelGroups: PropertyGroup[] = [
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
 * Panel property schema
 * Note: State group is excluded for Panel - state properties are merged into Basic group
 */
const panelSchemaBase = createPropertySchema(
  ComponentType.PANEL,
  panelProperties,
  commonTabs,
  [...commonGroups, ...panelGroups]
);

// Filter out State group and export the final schema
export const panelSchema: ComponentPropertySchema = {
  ...panelSchemaBase,
  groups: panelSchemaBase.groups.filter(g => g.id !== 'State'),
};

