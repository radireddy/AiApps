/**
 * List Component Property Schema
 * 
 * Defines all properties for the List component including:
 * - Data binding
 * - Template settings
 * - Layout
 * - Styles
 * - Events
 * - Advanced options
 */

import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup, PropertyTab } from '../metadata';
import { createBaseContainerSchema, createBaseContainerProperties } from './base-container';
import { commonTabs } from '../registry';

/**
 * List-specific property definitions
 */
const listProperties: PropertyMetadata[] = [
  // General Tab - Data group
  {
    id: 'data',
    label: 'Data',
    type: 'expression',
    defaultValue: '[]',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Array or expression that returns an array (e.g., {{Users.data}} or {{[{id:1,name:"A"}]}})',
    placeholder: 'e.g. {{Users.data}}',
  },
  {
    id: 'itemKey',
    label: 'Item Key',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Unique key for each item (defaults to index). Supports expression like {{currentItem.id}}',
    placeholder: 'e.g. {{currentItem.id}}',
  },
  {
    id: 'emptyState',
    label: 'Empty State',
    type: 'expression',
    defaultValue: 'No records found',
    supportsExpression: true,
    group: 'Data',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Text or expression shown when data is empty',
    placeholder: 'e.g. No records found',
  },

  // General Tab - Template Settings group
  {
    id: 'templateHeight',
    label: 'Template Height',
    type: 'expression',
    defaultValue: 40,
    supportsExpression: true,
    group: 'Template Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Height of each row in pixels. Items will grow automatically to fit their children. Supports expression.',
    placeholder: 'e.g. 40 or {{40}}',
  },
  {
    id: 'templateBackground',
    label: 'Template Background',
    type: 'expression',
    defaultValue: '{{theme.colors.surface}}',
    supportsExpression: true,
    group: 'Template Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Background color for each template item. Use {{theme.colors.background}} or {{theme.colors.surface}} (note: plural "colors", not "color")',
    placeholder: 'e.g. {{theme.colors.surface}} or #ffffff',
  },
  {
    id: 'itemSpacing',
    label: 'Item Spacing',
    type: 'expression',
    defaultValue: 8,
    supportsExpression: true,
    group: 'Template Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 2,
    applicableTo: [ComponentType.LIST],
    tooltip: 'Vertical spacing between items in pixels',
    placeholder: 'e.g. 8',
  },
  {
    id: 'overflow',
    label: 'Overflow',
    type: 'dropdown',
    defaultValue: 'auto',
    supportsExpression: false,
    group: 'Template Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 3,
    applicableTo: [ComponentType.LIST],
    options: [
      { value: 'scroll', label: 'Scroll' },
      { value: 'auto', label: 'Auto' },
      { value: 'hidden', label: 'Hidden' },
    ],
    tooltip: 'Overflow behavior for the list container',
  },
  {
    id: 'scrollbarVisibility',
    label: 'Scrollbar Visibility',
    type: 'dropdown',
    defaultValue: 'auto',
    supportsExpression: false,
    group: 'Template Settings',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 1,
    propertyOrder: 4,
    applicableTo: [ComponentType.LIST],
    options: [
      { value: 'always', label: 'Always' },
      { value: 'auto', label: 'Auto' },
      { value: 'hidden', label: 'Hidden' },
    ],
    tooltip: 'Scrollbar visibility (only applies if overflow is scroll or auto)',
  },

  // Events Tab - Events group
  {
    id: 'onItemClick',
    label: 'onItemClick',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when a list item is clicked. Context: currentItem, index',
    placeholder: 'e.g. {{console.log(currentItem)}}',
  },
  {
    id: 'onItemSelect',
    label: 'onItemSelect',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when a list item is selected. Context: currentItem, index',
    placeholder: 'e.g. {{actions.selectRecord("selectedItem", currentItem)}}',
  },
  {
    id: 'onDataChange',
    label: 'onDataChange',
    type: 'code',
    defaultValue: '',
    supportsExpression: true,
    group: 'Events',
    tab: 'Events',
    tabOrder: 3,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.LIST],
    tooltip: 'JavaScript expression executed when the data array changes',
    placeholder: 'e.g. {{console.log("Data changed")}}',
  },
];

/**
 * List-specific groups
 */
const listGroups: PropertyGroup[] = [
  { id: 'Data', label: 'Data', tab: 'General', order: 10, collapsible: true, defaultCollapsed: false },
  { id: 'Template Settings', label: 'Template Settings', tab: 'General', order: 11, collapsible: true, defaultCollapsed: false },
];

/**
 * List-specific tabs (add Template Settings tab)
 */
const listTabs: PropertyTab[] = [
  { id: 'General', label: 'General', order: 0 },
  { id: 'Template Settings', label: 'Template Settings', order: 1 },
  { id: 'Styles', label: 'Styles', order: 2 },
  { id: 'Events', label: 'Events', order: 3 },
  { id: 'Advanced', label: 'Advanced', order: 4 },
];

/**
 * List property schema
 * Extends base container properties with list-specific properties
 */
export const listSchema: ComponentPropertySchema = createBaseContainerSchema(
  ComponentType.LIST,
  listProperties,
  listTabs,
  listGroups
);

