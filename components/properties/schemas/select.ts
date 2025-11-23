import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Select-specific property definitions
 */
const selectProperties: PropertyMetadata[] = [
  {
    id: 'placeholder',
    label: 'Placeholder',
    type: 'expression',
    defaultValue: 'Select an option',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.SELECT],
    tooltip: 'Placeholder text shown when no option is selected',
    placeholder: 'e.g. Choose an option...',
  },
  {
    id: 'options',
    label: 'Options',
    type: 'string',
    defaultValue: 'Option 1,Option 2,Option 3',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.SELECT],
    tooltip: 'Comma-separated list of options',
    placeholder: 'e.g. Option 1,Option 2,Option 3',
  },
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newSelect',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 1,
    applicableTo: [ComponentType.SELECT],
    tooltip: 'Key in dataStore where selected value is saved',
    placeholder: 'e.g. user.country',
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
    propertyOrder: 2,
    applicableTo: [ComponentType.SELECT],
    tooltip: 'Initial selected value',
  },
  {
    id: 'accessibilityLabel',
    label: 'Accessibility Label',
    type: 'string',
    defaultValue: 'Dropdown select',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 3,
    propertyOrder: 0,
    applicableTo: [ComponentType.SELECT],
    tooltip: 'A descriptive label for screen readers',
    placeholder: 'A descriptive label for screen readers',
  },
];

/**
 * Select-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const selectGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', collapsible: true, defaultCollapsed: false },
];

/**
 * Select property schema
 */
export const selectSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.SELECT,
  selectProperties,
  commonTabs,
  [...commonGroups, ...selectGroups]
);

