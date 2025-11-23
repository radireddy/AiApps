

import React from 'react';
import { ComponentType, ButtonProps, ComponentPlugin, ActionHandlers, ButtonActionType, DataSourceInstance, AppVariable } from '../../types';
import { InlineTextEditor } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

// Common icon style
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

// This utility handles evaluation at the moment of an event (like a click)
const evaluateAndProcess = (valueOrExpr: any, scope: Record<string, any>): any => {
    if (typeof valueOrExpr !== 'string') {
        return valueOrExpr; // It's a literal value, not a string expression
    }

    // Pure expression: "{{ ... }}"
    if (valueOrExpr.startsWith('{{') && valueOrExpr.endsWith('}}')) {
        const expression = valueOrExpr.substring(2, valueOrExpr.length - 2).trim();
        return safeEval(expression, scope);
    }

    // Template literal: "Hello, {{ name }}"
    if (valueOrExpr.includes('{{') && valueOrExpr.includes('}}')) {
         return valueOrExpr.replace(/{{\s*(.*?)\s*}}/g, (match, expression) => {
            const result = safeEval(expression, scope);
            return result !== undefined && result !== null ? String(result) : '';
        });
    }
    
    // It's just a literal string
    return valueOrExpr;
}

const ButtonRenderer: React.FC<{
  component: { props: ButtonProps };
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  onUpdateDataStore?: (key: string, value: any) => void;
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, actions, onUpdateDataStore, isEditingInline, onCommitInlineEdit, evaluationScope }) => {
  const p = component.props;
  
  // Evaluate dynamic properties for rendering
  const text = useJavaScriptRenderer(p.text, evaluationScope, '');
  // Evaluate disabled property - handle both boolean and string values correctly
  const disabledValue = useJavaScriptRenderer(p.disabled, evaluationScope, false);
  const isDisabled = (() => {
    if (typeof disabledValue === 'string') {
      const lower = disabledValue.toLowerCase().trim();
      return lower === 'true' || lower === '1';
    }
    return !!disabledValue;
  })();
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#4f46e5');
  const textColor = useJavaScriptRenderer(p.textColor, evaluationScope, '#FFFFFF');
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  
  const handleButtonClick = () => {
    if (mode === 'preview' && !isDisabled) {
      // Add a reference to actions into the scope for executeCode
      const clickScope = { ...evaluationScope, actions };

      switch(p.actionType) {
        case 'alert':
            if (p.actionAlertMessage) {
                const message = evaluateAndProcess(p.actionAlertMessage, clickScope);
                alert(message);
            }
            break;
        case 'updateData':
            if (p.actionUpdateKey && onUpdateDataStore) {
                const valueToUpdate = evaluateAndProcess(p.actionUpdateValue, clickScope);
                onUpdateDataStore(p.actionUpdateKey, valueToUpdate);
            }
            break;
        case 'updateVariable':
            if (p.actionVariableName && actions) {
                const newValue = evaluateAndProcess(p.actionVariableValue, clickScope);
                actions.updateVariable(p.actionVariableName, newValue);
            }
            break;
        case 'createRecord':
           if (!p.dataSourceName) {
                alert("Button Action Error: No Data Source selected for 'Create Record' action.");
                return;
           }
           if (p.dataSourceName && p.newRecordData && actions) {
                const result = evaluateAndProcess(p.newRecordData, clickScope);
                
                if (typeof result !== 'object' || result === null || Array.isArray(result)) {
                    const errorMessage = `The 'New Record Object' expression for this button is invalid or did not produce an object. Please check the expression syntax and ensure all component IDs are correct (e.g., INPUT_123, not INPUT-123).`;
                    alert(errorMessage);
                    console.error(errorMessage, "Evaluated result:", result);
                    break;
                }
                actions.createRecord(p.dataSourceName, result);
            }
            break;
        case 'updateRecord':
            const selectedRecordForUpdate = evaluateAndProcess('{{selectedRecord}}', clickScope);
            if (p.dataSourceName && selectedRecordForUpdate && actions) {
                actions.updateRecord(p.dataSourceName, selectedRecordForUpdate.id, selectedRecordForUpdate);
            }
            break;
        case 'deleteRecord':
            const selectedRecordForDelete = evaluateAndProcess('{{selectedRecord}}', clickScope);
            if (p.dataSourceName && selectedRecordForDelete && actions) {
                actions.deleteRecord(p.dataSourceName, selectedRecordForDelete.id);
            }
            break;
        case 'executeCode':
            if (p.actionCodeToExecute) {
                evaluateAndProcess(p.actionCodeToExecute, clickScope);
            }
            break;
        default:
          break;
      }
    }
  };

  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  
  // In edit mode, allow interaction for selection; in preview mode, disable if needed
  const isDisabledInPreview = mode === 'preview' && isDisabled;
  
  // Evaluate boxShadow
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  // Calculate final opacity: use component opacity, but reduce if disabled
  const finalOpacity = isDisabled ? 0.6 : (typeof opacityValue === 'number' ? opacityValue : (typeof opacityValue === 'string' && opacityValue.trim() ? parseFloat(opacityValue) || 1 : 1));
  
  const style: React.CSSProperties = {
    backgroundColor,
    color: textColor,
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };
  
  return (
    <button
      onClick={handleButtonClick}
      style={style}
      className="w-full h-full font-semibold transition-opacity hover:opacity-90"
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
    >
      {isEditingInline && onCommitInlineEdit ? (
        <InlineTextEditor
          value={p.text}
          onCommit={onCommitInlineEdit}
          style={{
            color: p.textColor,
            textAlign: 'center',
            fontWeight: '600',
            fontFamily: 'sans-serif'
          }}
        />
      ) : (
        text
      )}
    </button>
  );
};

const ButtonProperties: React.FC<{
  component: { props: ButtonProps, id: string };
  updateProp: (key: keyof ButtonProps, value: any) => void;
  dataSources: DataSourceInstance[];
  variables: AppVariable[];
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, dataSources, variables, onOpenExpressionEditor }) => {
  const actionOptions: { value: ButtonActionType, label: string }[] = [
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

  // Text, backgroundColor, and textColor are now in base groups (text-content and color-typography)
  // No need for contentGroup

  const actionGroup: PropertyGroup = {
    id: 'button-action',
    title: 'On Click Action',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    properties: [
      {
        key: 'actionType',
        label: 'Action Type',
        type: 'select',
        options: actionOptions,
      },
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
        options: () => variables.map(v => ({ value: v.name, label: v.name })),
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
        options: () => dataSources.map(ds => ({ value: ds.id, label: ds.id })),
        condition: (props) => {
          const actionType = (props as ButtonProps).actionType;
          return actionType === 'createRecord' || actionType === 'updateRecord' || actionType === 'deleteRecord';
        },
      },
      {
        key: 'newRecordData',
        label: 'New Record Object',
        type: 'expression',
        placeholder: '{{ { name: inputName.value } }}',
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

  // Rename actionGroup to "Events" to merge with events
  actionGroup.title = 'Events';
  actionGroup.id = 'button-events';
  
  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'color-typography', 'styling'],
    customGroups: [actionGroup], // Event properties merged here
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.BUTTON }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
      context={{ dataSources, variables }}
    />
  );
};

export const ButtonPlugin: ComponentPlugin = {
  type: ComponentType.BUTTON,
  paletteConfig: {
    label: 'Button',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "6", y: "7", width: "12", height: "10", rx: "2", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M12 12H12.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      text: 'Click Me',
      width: 120,
      height: 40,
      backgroundColor: '{{theme.colors.primary}}',
      textColor: '{{theme.colors.onprimary}}',
      actionType: 'none',
      borderStyle: 'none',
      disabled: false,
    },
  },
  renderer: ButtonRenderer,
  properties: ButtonProperties,
};