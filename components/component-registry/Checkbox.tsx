

import React from 'react';
import { ComponentType, CheckboxProps, ComponentPlugin, InputActionType } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig, PropertyGroupRendererProps, PropertyRenderer } from '../property-groups';
import { safeEval } from '../../expressions/engine';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const CheckboxRenderer: React.FC<{
  component: { id: string; props: CheckboxProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  // Evaluate disabled property - handle both boolean and string values correctly
  const disabledValue = useJavaScriptRenderer(p.disabled, evaluationScope, false);
  const isDisabled = (() => {
    if (typeof disabledValue === 'string') {
      const lower = disabledValue.toLowerCase().trim();
      return lower === 'true' || lower === '1';
    }
    return !!disabledValue;
  })();
  // In edit mode, allow interaction for selection; in preview mode, disable if needed
  const isDisabledInPreview = mode === 'preview' && isDisabled;
  // Evaluate opacity and boxShadow
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  // Calculate final opacity: use component opacity, but reduce if disabled
  const finalOpacity = isDisabled ? 0.6 : (typeof opacityValue === 'number' ? opacityValue : (typeof opacityValue === 'string' && opacityValue.trim() ? parseFloat(opacityValue) || 1 : 1));
  // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
  const pointerEventsStyle = mode === 'edit' && isDisabled ? { pointerEvents: 'none' as const } : {};
  
  // Helper to evaluate event expressions
  const evaluateEventExpression = (expression: string | undefined, scope: Record<string, any>): void => {
    if (!expression || typeof expression !== 'string') return;
    
    try {
      const expr = expression.startsWith('{{') && expression.endsWith('}}')
        ? expression.substring(2, expression.length - 2).trim()
        : expression;
      if (expr) {
        safeEval(expr, scope);
      }
    } catch (error) {
      console.error('Error executing event expression:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    
    // Update dataStore if dataStoreKey is provided
    if (p.dataStoreKey && onUpdateDataStore) {
      onUpdateDataStore(p.dataStoreKey, newValue);
    }
    
    // Execute onChange action
    if (mode === 'preview') {
      const eventScope = {
        ...evaluationScope,
        event: {
          target: { checked: newValue, value: newValue },
        },
        actions,
      };
      
      // Handle new actionType-based onChange
      if (p.onChangeActionType) {
        switch (p.onChangeActionType) {
          case 'alert':
            if (p.onChangeAlertMessage) {
              try {
                let message = p.onChangeAlertMessage;
                // If it's an expression, evaluate it
                if (message.startsWith('{{') && message.endsWith('}}')) {
                  const expr = message.substring(2, message.length - 2).trim();
                  message = safeEval(expr, eventScope);
                } else if (message.includes('{{')) {
                  // Template literal
                  message = message.replace(/{{\s*(.*?)\s*}}/g, (match, expression) => {
                    const result = safeEval(expression, eventScope);
                    return result !== undefined && result !== null ? String(result) : '';
                  });
                }
                alert(String(message));
              } catch (error) {
                console.error('Error executing onChange alert:', error);
              }
            }
            break;
          case 'executeCode':
            if (p.onChangeCodeToExecute) {
              evaluateEventExpression(p.onChangeCodeToExecute, eventScope);
            }
            break;
          case 'none':
          default:
            // Do nothing
            break;
        }
      }
    }
  };
  
  return (
    <div className="flex items-center w-full h-full" style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}>
      <input
        type="checkbox"
        id={component.id}
        checked={!!get(dataStore, p.dataStoreKey)}
        onChange={mode === 'preview' ? handleChange : (e) => onUpdateDataStore?.(p.dataStoreKey, e.target.checked)}
        className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
        disabled={isDisabledInPreview}
        aria-disabled={isDisabledInPreview}
      />
      <label htmlFor={component.id} className={`text-gray-800 ${isDisabledInPreview ? 'pointer-events-none' : ''} ${isDisabled ? 'opacity-60' : ''}`}>{p.label}</label>
    </div>
  );
};

const CheckboxProperties: React.FC<{
  component: { id: string, props: CheckboxProps };
  updateProp: (key: keyof CheckboxProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const actionOptions: { value: InputActionType, label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'alert', label: 'Alert' },
    { value: 'executeCode', label: 'Execute Code' },
  ];

  // Custom renderer for Events group with dividers
  const EventsGroupRenderer: React.FC<PropertyGroupRendererProps> = ({ rendererProps }) => {
    const { props } = rendererProps;
    const checkboxProps = props as CheckboxProps;

    return (
      <div className="space-y-4">
        {/* On Change Section */}
        <div>
          <h5 className="text-xs font-semibold text-gray-700 mb-2">On Change</h5>
          <div className="space-y-2">
            <PropertyRenderer
              property={{
                key: 'onChangeActionType',
                label: 'Action Type',
                type: 'select',
                options: actionOptions,
              }}
              rendererProps={rendererProps}
            />
            {checkboxProps.onChangeActionType === 'alert' && (
              <PropertyRenderer
                property={{
                  key: 'onChangeAlertMessage',
                  label: 'Alert Message',
                  type: 'expression',
                  placeholder: 'e.g., {{ "Checkbox changed: " + event.target.checked }}',
                }}
                rendererProps={rendererProps}
              />
            )}
            {checkboxProps.onChangeActionType === 'executeCode' && (
              <PropertyRenderer
                property={{
                  key: 'onChangeCodeToExecute',
                  label: 'Code to Execute',
                  type: 'expression',
                  placeholder: 'e.g., {{ (() => { console.log(event.target.checked); })() }}',
                }}
                rendererProps={rendererProps}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const eventsGroup: PropertyGroup = {
    id: 'checkbox-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'input-value'],
    customGroups: [eventsGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.CHECKBOX }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const CheckboxPlugin: ComponentPlugin = {
  type: ComponentType.CHECKBOX,
  paletteConfig: {
    label: 'Checkbox',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M9 12L11 14L15 10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" })),
    defaultProps: {
      label: 'Accept terms',
      dataStoreKey: 'newCheckbox',
      width: 150,
      height: 30,
      opacity: 1,
      boxShadow: '',
      disabled: false,
      onChangeActionType: 'none' as InputActionType,
    },
  },
  renderer: CheckboxRenderer,
  properties: CheckboxProperties,
};