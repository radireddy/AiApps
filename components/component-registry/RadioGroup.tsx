

import React from 'react';
import { ComponentType, RadioGroupProps, ComponentPlugin, InputActionType } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig, PropertyGroupRendererProps, PropertyRenderer } from '../property-groups';
import { safeEval } from '../../expressions/engine';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const RadioGroupRenderer: React.FC<{
  component: { id: string; props: RadioGroupProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const options = p.options.split(',').map(opt => opt.trim());
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
  const groupLabelId = `${component.id}-group-label`;
  const selectedValue = get(dataStore, p.dataStoreKey);

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
    const newValue = e.target.value;
    
    // Update dataStore if dataStoreKey is provided
    if (p.dataStoreKey && onUpdateDataStore) {
      onUpdateDataStore(p.dataStoreKey, newValue);
    }
    
    // Execute onChange action
    if (mode === 'preview') {
      const eventScope = {
        ...evaluationScope,
        event: {
          target: { value: newValue },
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
    <div 
        className="w-full h-full flex flex-col justify-center p-2"
        style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}
        role="radiogroup"
        aria-labelledby={groupLabelId}
        aria-disabled={isDisabledInPreview}
    >
      <span id={groupLabelId} className="sr-only">{p.groupLabel}</span>
      {options.map(option => (
        <div key={option} className="flex items-center mb-2">
            <input
            type="radio"
            id={`${component.id}-${option}`}
            name={component.id}
            value={option}
            checked={selectedValue === option}
            onChange={mode === 'preview' ? handleChange : (e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
            className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
            disabled={isDisabledInPreview}
          />
          <label htmlFor={`${component.id}-${option}`} className={`text-gray-800 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}>{option}</label>
        </div>
      ))}
    </div>
  );
};

const RadioGroupProperties: React.FC<{
  component: { id: string, props: RadioGroupProps };
  updateProp: (key: keyof RadioGroupProps, value: any) => void;
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
    const radioGroupProps = props as RadioGroupProps;

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
            {radioGroupProps.onChangeActionType === 'alert' && (
              <PropertyRenderer
                property={{
                  key: 'onChangeAlertMessage',
                  label: 'Alert Message',
                  type: 'expression',
                  placeholder: 'e.g., {{ "Selected: " + event.target.value }}',
                }}
                rendererProps={rendererProps}
              />
            )}
            {radioGroupProps.onChangeActionType === 'executeCode' && (
              <PropertyRenderer
                property={{
                  key: 'onChangeCodeToExecute',
                  label: 'Code to Execute',
                  type: 'expression',
                  placeholder: 'e.g., {{ (() => { console.log(event.target.value); })() }}',
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
    id: 'radiogroup-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'radiogroup-accessibility',
    title: 'Accessibility',
    order: 5,
    collapsible: true,
    defaultCollapsed: false,
    properties: [
      {
        key: 'groupLabel',
        label: 'Group Label',
        type: 'text',
        placeholder: 'A label for the whole group',
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'input-value', 'data'],
    customGroups: [eventsGroup, accessibilityGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.RADIO_GROUP }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const RadioGroupPlugin: ComponentPlugin = {
  type: ComponentType.RADIO_GROUP,
  paletteConfig: {
    label: 'Radio Group',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg"}, React.createElement('path', {d:"M12 16a4 4 0 100-8 4 4 0 000 8z", stroke:"currentColor", strokeWidth:"2"}), React.createElement('path', {d:"M12 4v2m0 12v2m8-10h-2M6 12H4", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round"})),
    defaultProps: {
      dataStoreKey: 'newRadio',
      options: 'Option 1,Option 2',
      groupLabel: 'Choose an option',
      width: 150,
      height: 80,
      disabled: false,
      onChangeActionType: 'none' as InputActionType,
    },
  },
  renderer: RadioGroupRenderer,
  properties: RadioGroupProperties,
};