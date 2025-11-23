import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Input-specific property definitions
 */
const inputProperties: PropertyMetadata[] = [
  // Basic properties - placeholder is shown in Basic group
  {
    id: 'placeholder',
    label: 'Placeholder',
    type: 'expression',
    defaultValue: 'Enter text...',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 3, // After hidden, disabled, tooltip
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Placeholder text shown when input is empty',
    placeholder: 'e.g. Enter your name...',
  },
  
  // Input Form and Validation properties
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newInput',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Key in dataStore where input value is saved (e.g., user.name)',
    placeholder: 'e.g. user.name',
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
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Default value for the input field',
    placeholder: 'e.g. {{user.name}} or "John"',
  },
  {
    id: 'inputType',
    label: 'Input Type',
    type: 'dropdown',
    defaultValue: 'text',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 2,
    applicableTo: [ComponentType.INPUT],
    options: [
      { value: 'text', label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'email', label: 'Email' },
      { value: 'password', label: 'Password' },
    ],
    tooltip: 'HTML input type',
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
    propertyOrder: 3,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Maximum number of characters allowed',
  },
  {
    id: 'min',
    label: 'Min',
    type: 'number',
    defaultValue: 0,
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 4,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Minimum value (for number input type)',
  },
  {
    id: 'max',
    label: 'Max',
    type: 'number',
    defaultValue: 0,
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 5,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Maximum value (for number input type)',
  },
  {
    id: 'pattern',
    label: 'Pattern / Regex',
    type: 'string',
    defaultValue: '',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 6,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'Regular expression pattern for validation',
    placeholder: 'e.g. [A-Za-z]+',
  },
  
  // Accessibility
  {
    id: 'accessibilityLabel',
    label: 'Accessibility Label',
    type: 'string',
    defaultValue: 'Text input field',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 3,
    propertyOrder: 0,
    applicableTo: [ComponentType.INPUT],
    tooltip: 'A descriptive label for screen readers',
    placeholder: 'A descriptive label for screen readers',
  },
];

/**
 * Input-specific groups
 */
const inputGroups: PropertyGroup[] = [
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', order: 2, collapsible: true, defaultCollapsed: false },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', order: 3, collapsible: true, defaultCollapsed: false },
];

/**
 * Input property schema
 */
export const inputSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.INPUT,
  inputProperties,
  commonTabs,
  [...commonGroups, ...inputGroups]
);

