import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * RadioGroup-specific property definitions
 */
const radioGroupProperties: PropertyMetadata[] = [
  {
    id: 'options',
    label: 'Options',
    type: 'string',
    defaultValue: 'Option 1,Option 2',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Comma-separated list of radio options',
    placeholder: 'e.g. Option 1,Option 2,Option 3',
  },
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newRadio',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 1,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Key in dataStore where selected radio value is saved',
    placeholder: 'e.g. user.gender',
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
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'Initial selected option',
    placeholder: 'e.g. Option 1',
  },
  {
    id: 'groupLabel',
    label: 'Group Label',
    type: 'string',
    defaultValue: '',
    group: 'Accessibility',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 3,
    propertyOrder: 0,
    applicableTo: [ComponentType.RADIO_GROUP],
    tooltip: 'A label for the whole radio group',
    placeholder: 'e.g. Choose an option',
  },
];

/**
 * RadioGroup-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const radioGroupGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Accessibility', label: 'Accessibility', tab: 'General', collapsible: true, defaultCollapsed: false },
];

/**
 * RadioGroup property schema
 */
export const radioGroupSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.RADIO_GROUP,
  radioGroupProperties,
  commonTabs,
  [...commonGroups, ...radioGroupGroups]
);

