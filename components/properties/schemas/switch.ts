import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Switch-specific property definitions
 */
const switchProperties: PropertyMetadata[] = [
  {
    id: 'label',
    label: 'Label',
    type: 'expression',
    defaultValue: 'Enable Feature',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.SWITCH],
    tooltip: 'Switch label text',
    placeholder: 'e.g. Enable notifications',
  },
  {
    id: 'dataStoreKey',
    label: 'Value (Data Store Key)',
    type: 'string',
    defaultValue: 'newSwitch',
    group: 'Input Form And Validation',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 2,
    propertyOrder: 0,
    applicableTo: [ComponentType.SWITCH],
    tooltip: 'Key in dataStore where switch value is saved',
    placeholder: 'e.g. user.notificationsEnabled',
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
    applicableTo: [ComponentType.SWITCH],
    tooltip: 'Initial switch state',
  },
];

/**
 * Switch-specific groups
 * Note: Layout, State, and Styling are already in commonGroups, so we don't duplicate them
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const switchGroups: PropertyGroup[] = [
  { id: 'Basic', label: 'Basic', tab: 'General', collapsible: true, defaultCollapsed: false },
  { id: 'Input Form And Validation', label: 'Input Form And Validation', tab: 'General', collapsible: true, defaultCollapsed: false },
];

/**
 * Switch property schema
 */
export const switchSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.SWITCH,
  switchProperties,
  commonTabs,
  [...commonGroups, ...switchGroups]
);

