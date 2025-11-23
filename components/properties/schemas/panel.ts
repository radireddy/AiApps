import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyTab, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';
import { ContainerLayoutRenderer } from '../renderers/ContainerLayoutRenderer';

/**
 * Panel-specific property definitions
 */
const panelProperties: PropertyMetadata[] = [
  // Basic properties
  {
    id: 'hidden',
    label: 'Hide',
    type: 'expression',
    defaultValue: false,
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.PANEL],
    tooltip: 'Expression to determine visibility. Use ! to invert: false = visible, true = hidden',
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
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
  { id: 'Basic', label: 'Basic', tab: 'General', order: 0, collapsible: true, defaultCollapsed: false },
  { 
    id: 'Container Layout', 
    label: 'Container Layout', 
    tab: 'General', 
    order: 1, 
    collapsible: true, 
    defaultCollapsed: false,
    customGroupRenderer: ContainerLayoutRenderer as any,
  },
  { id: 'Color & Typography', label: 'Color & Typography', tab: 'Styles', order: 0, collapsible: true, defaultCollapsed: false },
  { id: 'Spacing', label: 'Spacing', tab: 'Styles', order: 1, collapsible: true, defaultCollapsed: false },
  { id: 'Borders', label: 'Borders', tab: 'Styles', order: 2, collapsible: true, defaultCollapsed: false },
];

/**
 * Panel property schema
 */
export const panelSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.PANEL,
  panelProperties,
  commonTabs,
  [...commonGroups, ...panelGroups]
);

