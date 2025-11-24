

import React, { useEffect } from 'react';
import { ComponentType, TextareaProps, ComponentPlugin } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TextareaRenderer: React.FC<{
  component: { props: TextareaProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
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
  
  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    textAlign: p.textAlign || 'left', // Apply textAlign property
    // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };
  // Evaluate defaultValue - always call hook unconditionally (React hooks rule)
  // Supports both static values and expressions
  const evaluatedDefaultValue = useJavaScriptRenderer(p.defaultValue || '', evaluationScope, '');
  
  // Get value from dataStore - try both direct key access and dot notation
  let dataStoreValue = dataStore[p.dataStoreKey];
  if (dataStoreValue === undefined) {
    // Try dot notation for nested paths like 'user.name'
    dataStoreValue = get(dataStore, p.dataStoreKey, undefined);
  }
  
  // Check if dataStore has a value (undefined means key doesn't exist, empty string means user cleared it)
  const hasDataStoreValue = dataStoreValue !== undefined;
  
  // Initialize dataStore with defaultValue if key doesn't exist and defaultValue is provided
  useEffect(() => {
    if (!hasDataStoreValue && p.defaultValue && onUpdateDataStore) {
      // Only initialize if defaultValue evaluates to a non-empty value
      const initValue = evaluatedDefaultValue;
      if (initValue !== undefined && initValue !== null && initValue !== '') {
        onUpdateDataStore(p.dataStoreKey, initValue);
      }
    }
  }, [hasDataStoreValue, p.defaultValue, p.dataStoreKey, evaluatedDefaultValue, onUpdateDataStore]);
  
  // Use dataStore value if key exists (even if empty), otherwise use evaluated defaultValue for display
  // Once dataStore is initialized, it will have the value and we'll use that
  const currentValue = hasDataStoreValue ? (dataStoreValue ?? '') : (p.defaultValue ? evaluatedDefaultValue : '');
  
  return (
    <textarea
      placeholder={p.placeholder}
      {...(onUpdateDataStore ? { defaultValue: currentValue } : { value: currentValue })}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full p-2 bg-white text-gray-900 focus:outline-none resize-none`}
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
      aria-label={p.accessibilityLabel || p.placeholder}
    />
  );
};

const TextareaProperties: React.FC<{
  component: { id: string, props: TextareaProps };
  updateProp: (key: keyof TextareaProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const accessibilityGroup: PropertyGroup = {
    id: 'textarea-accessibility',
    title: 'Accessibility',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    properties: [
      {
        key: 'accessibilityLabel',
        label: 'Accessibility Label',
        type: 'text',
        placeholder: 'A descriptive label for screen readers',
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'color-typography', 'input-value', 'styling'],
    customGroups: [accessibilityGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.TEXTAREA }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const TextareaPlugin: ComponentPlugin = {
  type: ComponentType.TEXTAREA,
  paletteConfig: {
    label: 'Textarea',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 6H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 10H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 14H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 18H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Enter long text...',
      dataStoreKey: 'newTextarea',
      accessibilityLabel: 'Text area for long text',
      width: 250,
      height: 100,
      disabled: false,
    },
  },
  renderer: TextareaRenderer,
  properties: TextareaProperties,
};