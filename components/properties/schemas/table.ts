import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Table-specific property definitions
 */
const tableProperties: PropertyMetadata[] = [
  // Data properties
  {
    id: 'dataSourceName',
    label: 'Data Source',
    type: 'dropdown',
    defaultValue: '',
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.TABLE],
    options: (context) => {
      // Get data sources from context
      const dataSources = context?.dataSources || [];
      return dataSources.map((ds: { id: string }) => ({
        value: ds.id,
        label: ds.id,
      }));
    },
    tooltip: 'Data source to display in the table',
    placeholder: 'Select a data source',
  },
  {
    id: 'columns',
    label: 'Columns',
    type: 'string',
    defaultValue: 'Name:name,Email:email,Role:role',
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.TABLE],
    tooltip: 'Column definitions in format: Header:key,Header2:key2',
    placeholder: 'e.g. Name:name,Email:email,Role:role',
  },
  // Row selection properties
  {
    id: 'rowSelectAction',
    label: 'Row Select Action',
    type: 'dropdown',
    defaultValue: 'none',
    group: 'On Row Select',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: [ComponentType.TABLE],
    options: [
      { value: 'none', label: 'None' },
      { value: 'updateDataStore', label: 'Update Data Store' },
    ],
    tooltip: 'Action to perform when a row is clicked',
  },
  {
    id: 'selectedRecordKey',
    label: 'Selected Record Key',
    type: 'string',
    defaultValue: 'selectedRecord',
    group: 'On Row Select',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: [ComponentType.TABLE],
    visibleIf: (props) => (props as any).rowSelectAction === 'updateDataStore',
    tooltip: 'Key in dataStore where selected record is saved',
    placeholder: 'e.g. selectedRecord',
  },
];

/**
 * Table-specific groups
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 * These groups come after standard groups (Basic, Layout, State) but before Styling
 */
const tableGroups: PropertyGroup[] = [
  { id: 'Data', label: 'Data', tab: 'General', order: 10, collapsible: true, defaultCollapsed: false },
  { id: 'On Row Select', label: 'On Row Select', tab: 'General', order: 11, collapsible: true, defaultCollapsed: false },
];

/**
 * Table property schema
 */
export const tableSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.TABLE,
  tableProperties,
  commonTabs,
  [...commonGroups, ...tableGroups]
);

