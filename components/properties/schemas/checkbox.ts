import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Checkbox-specific property definitions
 */
const checkboxProperties: PropertyMetadata[] = [
  {
    id: 'label',
    label: 'Label',
    type: 'expression',
    defaultValue: 'Accept terms',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.CHECKBOX],
    tooltip: 'Checkbox label text',
    placeholder: 'e.g. I agree to the terms',
  },
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newCheckbox',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.CHECKBOX],
    tooltip: 'Key in dataStore where checkbox value is saved',
    placeholder: 'e.g. user.acceptedTerms',
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
    defaultValue: false,
    supportsExpression: true,
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 1,
    applicableTo: [ComponentType.CHECKBOX],
    tooltip: 'Initial checked state',
  },
];

/**
 * Checkbox-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const checkboxGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
];

/**
 * Checkbox property schema
 */
export const checkboxSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.CHECKBOX,
  checkboxProperties,
  commonTabs,
  [...commonGroups, ...checkboxGroups]
);

