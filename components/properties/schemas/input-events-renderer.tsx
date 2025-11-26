import React from 'react';
import { InputProps } from '../../../types';
import { PropertyGroup, PropertyMetadata, PropertyContext } from '../metadata';
import { PropFxInput, PropInput, PropSelect } from '../../component-registry/common';

export const EventsGroupRenderer: React.FC<{
  group: PropertyGroup;
  properties: PropertyMetadata[];
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}> = ({ properties, context, onUpdate, onOpenExpressionEditor, getValue, getError, isMixed }) => {
  const component = context.component;
  const inputProps = component?.props as InputProps | undefined;
  const onChangeActionType = inputProps?.onChangeActionType || 'none';

  // Filter and organize properties by event type (excluding legacy onChange)
  const onChangeProps = properties.filter(p => 
    ['onChangeActionType', 'onChangeAlertMessage', 'onChangeCodeToExecute'].includes(p.id)
  );
  const onFocusProps = properties.filter(p => p.id === 'onFocus');
  const onBlurProps = properties.filter(p => p.id === 'onBlur');
  const onEnterKeyPressProps = properties.filter(p => p.id === 'onEnterKeyPress');

  // Sort onChange properties by propertyOrder
  const sortedOnChangeProps = [...onChangeProps].sort((a, b) => (a.propertyOrder ?? 999) - (b.propertyOrder ?? 999));

  // Render property using the same components as General/Styles tabs
  const renderProperty = (prop: PropertyMetadata) => {
    const value = getValue(prop.id);
    const error = getError(prop.id);
    const mixed = isMixed(prop.id);
    const displayValue = mixed ? '— Mixed —' : (value ?? prop.defaultValue ?? '');

    switch (prop.type) {
      case 'string':
      case 'expression':
      case 'code':
        const supportsExpression = prop.supportsExpression ?? (prop.type === 'expression' || prop.type === 'code');
        const isExpression = typeof value === 'string' && value.startsWith('{{');
        
        return (
          <PropFxInput
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type={prop.type === 'expression' || prop.type === 'code' ? 'text' : undefined}
            placeholder={prop.placeholder}
            onOpenEditor={supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = isExpression ? String(value || '') : String(value || '');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            propertyKey={prop.id}
            className="mb-2.5"
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : [];
        
        return (
          <PropSelect
            key={prop.id}
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || ''))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            className="mb-2.5"
          />
        );

      default:
        return null;
    }
  };

  // Render properties in the same style as General tab (no custom headings, just dividers)
  const elements: React.ReactNode[] = [];

  // On Change properties
  sortedOnChangeProps.forEach((prop) => {
    // Only show onChangeCodeToExecute if executeCode is selected
    if (prop.id === 'onChangeCodeToExecute' && onChangeActionType !== 'executeCode') {
      return;
    }
    // Only show onChangeAlertMessage if alert is selected
    if (prop.id === 'onChangeAlertMessage' && onChangeActionType !== 'alert') {
      return;
    }
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Focus
  if (onFocusProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-1" className="border-t border-gray-200 my-2"></div>);
  }

  // On Focus properties
  onFocusProps.forEach(prop => {
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Blur
  if (onBlurProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-2" className="border-t border-gray-200 my-2"></div>);
  }

  // On Blur properties
  onBlurProps.forEach(prop => {
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  // Divider before On Enter Key Press
  if (onEnterKeyPressProps.length > 0 && elements.length > 0) {
    elements.push(<div key="divider-3" className="border-t border-gray-200 my-2"></div>);
  }

  // On Enter Key Press properties
  onEnterKeyPressProps.forEach(prop => {
    const rendered = renderProperty(prop);
    if (rendered) {
      elements.push(rendered);
    }
  });

  return <>{elements}</>;
};

