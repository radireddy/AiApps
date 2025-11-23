import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Textarea-specific property definitions
 */
const textareaProperties: PropertyMetadata[] = [
  {
    id: 'placeholder',
    label: 'Placeholder',
    type: 'expression',
    defaultValue: 'Enter long text...',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'Placeholder text shown when textarea is empty',
    placeholder: 'e.g. Enter your message...',
  },
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newTextarea',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'Key in dataStore where textarea value is saved',
    placeholder: 'e.g. user.message',
    validationRules: [
      {
        type: 'required',
        message: 'Data Store Key is required',
      },
    ],
  },
  {
    id: 'defaultValue',
    label: 'Default Value',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 1,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'Initial value for the textarea',
  },
  {
    id: 'maxLength',
    label: 'Max Length',
    type: 'number',
    defaultValue: 0,
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 2,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'Maximum number of characters allowed',
  },
  {
    id: 'pattern',
    label: 'Pattern (Regex)',
    type: 'string',
    defaultValue: '',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 3,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'Regular expression for input validation',
    placeholder: 'e.g. [A-Za-z]+',
  },
  {
    id: 'accessibilityLabel',
    label: 'Accessibility Label',
    type: 'string',
    defaultValue: 'Text area for long text',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 3,
    propertyOrder: 0,
    applicableTo: [ComponentType.TEXTAREA],
    tooltip: 'A descriptive label for screen readers',
    placeholder: 'A descriptive label for screen readers',
  },
];

/**
 * Textarea-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const textareaGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', collapsible: true, defaultCollapsed: false },
];

/**
 * Textarea property schema
 */
export const textareaSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.TEXTAREA,
  textareaProperties,
  commonTabs,
  [...commonGroups, ...textareaGroups]
);

