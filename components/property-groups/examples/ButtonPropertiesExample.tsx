/**
 * Example: Button Properties using the new Property System
 * 
 * This demonstrates how to use the new property architecture
 * to define component properties in a declarative, reusable way.
 */

import { PropertyConfig, PropertyGroup } from '../types';
import { ButtonProps, ButtonActionType, DataSourceInstance, AppVariable } from '../../../types';

/**
 * Creates the property configuration for Button component
 * This replaces the manual JSX composition in ButtonProperties
 */
export function createButtonPropertyConfig(
  dataSources: DataSourceInstance[],
  variables: AppVariable[]
): PropertyConfig {
  const actionOptions: { value: ButtonActionType; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'alert', label: 'Show Alert' },
    { value: 'updateData', label: 'Update Data Store' },
    { value: 'updateVariable', label: 'Update Variable' },
    { value: 'executeCode', label: 'Execute Code' },
    { value: 'createRecord', label: 'Create Record' },
    { value: 'updateRecord', label: 'Update Record' },
    { value: 'deleteRecord', label: 'Delete Record' },
    { value: 'navigate', label: 'Navigate' },
  ];

  const dataSourceOptions = dataSources.map(ds => ({ value: ds.id, label: ds.id }));
  const variableOptions = variables.map(v => ({ value: v.name, label: v.name }));

  // Content group
  const contentGroup: PropertyGroup = {
    id: 'button-content',
    title: 'Content',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'text',
        label: 'Text',
        type: 'expression',
      },
      {
        key: 'backgroundColor',
        label: 'Background',
        type: 'expression',
        inputProps: { type: 'color' },
      },
      {
        key: 'textColor',
        label: 'Text Color',
        type: 'expression',
        inputProps: { type: 'color' },
      },
    ],
  };

  // Action group with conditional properties
  const actionGroup: PropertyGroup = {
    id: 'button-action',
    title: 'On Click Action',
    order: 4,
    collapsible: true,
    defaultCollapsed: true,
    properties: [
      {
        key: 'actionType',
        label: 'Action Type',
        type: 'select',
        options: actionOptions,
      },
      // Conditional properties based on actionType
      {
        key: 'actionAlertMessage',
        label: 'Alert Message',
        type: 'expression',
        condition: (props) => (props as ButtonProps).actionType === 'alert',
      },
      {
        key: 'actionUpdateKey',
        label: 'Data Store Key',
        type: 'text',
        placeholder: 'e.g. selectedUser',
        condition: (props) => (props as ButtonProps).actionType === 'updateData',
      },
      {
        key: 'actionUpdateValue',
        label: 'New Value',
        type: 'expression',
        placeholder: 'e.g. {{ { id: 1 } }}',
        condition: (props) => (props as ButtonProps).actionType === 'updateData',
      },
      {
        key: 'actionCodeToExecute',
        label: 'Code to Execute',
        type: 'expression',
        placeholder: '{{ (() => { /* code */ })() }}',
        condition: (props) => (props as ButtonProps).actionType === 'executeCode',
      },
      {
        key: 'actionVariableName',
        label: 'Variable to Update',
        type: 'select',
        options: () => variableOptions,
        condition: (props) => (props as ButtonProps).actionType === 'updateVariable',
      },
      {
        key: 'actionVariableValue',
        label: 'New Value',
        type: 'expression',
        placeholder: 'e.g. {{!isLoading}}',
        condition: (props) => (props as ButtonProps).actionType === 'updateVariable',
      },
      {
        key: 'dataSourceName',
        label: 'Data Source',
        type: 'select',
        options: () => dataSourceOptions,
        condition: (props) => {
          const actionType = (props as ButtonProps).actionType;
          return actionType === 'createRecord' || 
                 actionType === 'updateRecord' || 
                 actionType === 'deleteRecord';
        },
      },
      {
        key: 'newRecordData',
        label: 'New Record Object',
        type: 'expression',
        placeholder: '{{ { name: InputName.value } }}',
        condition: (props) => (props as ButtonProps).actionType === 'createRecord',
      },
      {
        key: 'actionNavigatePageId',
        label: 'Page ID',
        type: 'text',
        condition: (props) => (props as ButtonProps).actionType === 'navigate',
      },
    ],
  };

  return {
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border'],
    customGroups: [contentGroup, actionGroup],
    groupOrder: ['layout', 'state', 'button-content', 'button-action', 'border', 'styling'],
  };
}

/**
 * Usage in Button component:
 * 
 * ```typescript
 * const ButtonProperties: React.FC<ButtonPropertiesProps> = ({ 
 *   component, 
 *   updateProp, 
 *   dataSources, 
 *   variables, 
 *   onOpenExpressionEditor 
 * }) => {
 *   const config = createButtonPropertyConfig(dataSources, variables);
 *   
 *   return (
 *     <BasePropertiesRenderer
 *       component={component}
 *       updateProp={updateProp}
 *       config={config}
 *       onOpenExpressionEditor={onOpenExpressionEditor}
 *       context={{ dataSources, variables }}
 *     />
 *   );
 * };
 * ```
 */

