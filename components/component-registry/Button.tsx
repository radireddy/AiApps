

import React from 'react';
import { ComponentType, ButtonProps, ComponentPlugin, ActionHandlers, ButtonActionType, DataSourceInstance, AppVariable } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, PropSelect, StateProps, PropFxInput, InlineTextEditor } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { commonStylingProps } from '../../constants';
import { evaluateDisabled } from '../../utils/disabled-helper';

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
  const isDisabled = evaluateDisabled(p.disabled, evaluationScope);
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#4f46e5');
  const textColor = useJavaScriptRenderer(p.textColor, evaluationScope, '#FFFFFF');
  
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

  // Always call hooks in the same order - evaluate opacity first
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  
  const style = {
    backgroundColor,
    color: textColor,
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: isDisabled ? 0.6 : opacityValue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <button
      onClick={handleButtonClick}
      style={style}
      className="w-full h-full font-semibold transition-opacity hover:opacity-90"
      disabled={isDisabled}
      aria-disabled={isDisabled}
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
  const p = component.props;
  
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
  
  const dataSourceOptions = dataSources.map(ds => ({ value: ds.id, label: ds.id }));
  const variableOptions = variables.map(v => ({ value: v.name, label: v.name }));

  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Content">
        <PropFxInput label="Text" value={p.text} onChange={val => updateProp('text', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('text', newVal))} />
        <div className="grid grid-cols-2 gap-2">
          <PropFxInput label="Background" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
          <PropFxInput label="Text Color" value={p.textColor} onChange={val => updateProp('textColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('textColor', newVal))} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="On Click Action" isOpenDefault={false}>
        <PropSelect label="Action Type" value={p.actionType} onChange={val => updateProp('actionType', val)} options={actionOptions} />
        
        {p.actionType === 'alert' && <PropFxInput label="Alert Message" value={p.actionAlertMessage} onChange={val => updateProp('actionAlertMessage', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('actionAlertMessage', newVal))} />}
        
        {p.actionType === 'updateData' && (
            <>
                <PropInput label="Data Store Key" value={p.actionUpdateKey} onChange={val => updateProp('actionUpdateKey', val)} placeholder="e.g. selectedUser" />
                <PropFxInput label="New Value" value={p.actionUpdateValue} onChange={val => updateProp('actionUpdateValue', val)} placeholder="e.g. {{ { id: 1 } }}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('actionUpdateValue', newVal))} />
            </>
        )}

        {p.actionType === 'executeCode' && (
            <PropFxInput 
                label="Code to Execute" 
                value={p.actionCodeToExecute} 
                onChange={val => updateProp('actionCodeToExecute', val)} 
                placeholder="{{ (() => { /* code */ })() }}" 
                onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('actionCodeToExecute', newVal))} 
            />
        )}
        
        {p.actionType === 'updateVariable' && (
            <>
                <PropSelect label="Variable to Update" value={p.actionVariableName} onChange={val => updateProp('actionVariableName', val)} options={variableOptions} />
                <PropFxInput label="New Value" value={p.actionVariableValue} onChange={val => updateProp('actionVariableValue', val)} placeholder="e.g. {{!isLoading}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('actionVariableValue', newVal))} />
            </>
        )}

        {(p.actionType === 'createRecord' || p.actionType === 'updateRecord' || p.actionType === 'deleteRecord') && (
            <PropSelect label="Data Source" value={p.dataSourceName} onChange={val => updateProp('dataSourceName', val)} options={dataSourceOptions} />
        )}
        {p.actionType === 'createRecord' && (
            <PropFxInput label="New Record Object" value={p.newRecordData} onChange={val => updateProp('newRecordData', val)} placeholder="{{ { name: InputName.value } }}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('newRecordData', newVal))} />
        )}

      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
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
      textColor: '{{theme.colors.onPrimary}}',
      actionType: 'none',
      borderStyle: 'none',
      disabled: false,
    },
  },
  renderer: ButtonRenderer,
  properties: ButtonProperties,
};