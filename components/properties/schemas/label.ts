import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Label-specific property definitions
 */
const labelProperties: PropertyMetadata[] = [
  {
    id: 'text',
    label: 'Text',
    type: 'expression',
    defaultValue: 'New Label',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LABEL],
    tooltip: 'Label text content',
    placeholder: 'e.g. Enter your name...',
  },
  {
    id: 'fontSize',
    label: 'Font Size',
    type: 'number',
    defaultValue: 16,
    group: 'Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LABEL],
    tooltip: 'Font size in pixels',
  },
  {
    id: 'fontWeight',
    label: 'Font Weight',
    type: 'dropdown',
    defaultValue: 'normal',
    group: 'Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LABEL],
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
    ],
    tooltip: 'Font weight',
  },
  {
    id: 'color',
    label: 'Text Color',
    type: 'color',
    defaultValue: '#111827',
    supportsExpression: true,
    group: 'Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.LABEL],
    tooltip: 'Text color',
  },
  {
    id: 'textAlign',
    label: 'Text Align',
    type: 'dropdown',
    defaultValue: 'left',
    group: 'Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 3,
    applicableTo: [ComponentType.LABEL],
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    tooltip: 'Text alignment',
  },
  {
    id: 'fontFamily',
    label: 'Font Family',
    type: 'expression',
    defaultValue: 'sans-serif',
    supportsExpression: true,
    group: 'Typography',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 4,
    applicableTo: [ComponentType.LABEL],
    tooltip: 'Font family',
    placeholder: 'e.g. Arial, sans-serif',
  },
  {
    id: 'backgroundColor',
    label: 'Background Color',
    type: 'color',
    defaultValue: 'transparent',
    supportsExpression: true,
    group: 'Styling',
    tab: 'Styles',
    tabOrder: 1,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LABEL],
    tooltip: 'Background color',
  },
  {
    id: 'textRenderer',
    label: 'Text Renderer',
    type: 'dropdown',
    defaultValue: 'javascript',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LABEL],
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'markdown', label: 'Markdown' },
      { value: 'literal', label: 'Literal' },
    ],
    tooltip: 'How to render the text content',
  },
];

/**
 * Label-specific groups
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const labelGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Typography', label: 'Typography', tab: 'Styles', collapsible: true, defaultCollapsed: false },
];

/**
 * Label property schema
 */
export const labelSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.LABEL,
  labelProperties,
  commonTabs,
  [...commonGroups, ...labelGroups]
);

