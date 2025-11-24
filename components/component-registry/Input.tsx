

import React, { useEffect } from 'react';
import { ComponentType, InputProps, ComponentPlugin } from '../../types';
import { InlineTextEditor, buildSpacingStyles } from './common';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const InputRenderer: React.FC<{
  component: { props: InputProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, isEditingInline, onCommitInlineEdit }) => {
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
  const placeholder = useJavaScriptRenderer(p.placeholder, evaluationScope, '');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  // Evaluate boxShadow
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  // Calculate final opacity: use component opacity, but reduce if disabled
  const finalOpacity = isDisabled ? 0.6 : (typeof opacityValue === 'number' ? opacityValue : (typeof opacityValue === 'string' && opacityValue.trim() ? parseFloat(opacityValue) || 1 : 1));

  const paddingValue = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
  const marginValue = useJavaScriptRenderer(p.margin, evaluationScope, undefined);
  
  const style: React.CSSProperties = {
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    ...buildSpacingStyles(paddingValue, marginValue),
    padding: paddingValue !== undefined ? undefined : '0.5rem', // Use prop padding if set, otherwise default to 0.5rem
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#111827',
    // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
    pointerEvents: mode === 'edit' && isDisabled ? 'none' : 'auto',
  };
  
  if (mode === 'edit' && isEditingInline && onCommitInlineEdit) {
      return (
          <div style={style}>
              <InlineTextEditor
                value={p.placeholder}
                onCommit={onCommitInlineEdit}
                style={{
                    color: '#9ca3af', // Match placeholder color
                }}
              />
          </div>
      )
  }

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
    <input
      type="text"
      placeholder={placeholder}
      {...(onUpdateDataStore ? { defaultValue: currentValue } : { value: currentValue })}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full bg-white text-gray-900 focus:outline-none`}
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
      aria-label={p.accessibilityLabel || p.placeholder}
    />
  );
};

const InputProperties: React.FC<{
  component: { id: string, props: InputProps };
  updateProp: (key: keyof InputProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  // Settings group removed - placeholder moved to text-content, dataStoreKey moved to input-value
  const accessibilityGroup: PropertyGroup = {
    id: 'input-accessibility',
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
      component={{ ...component, type: ComponentType.INPUT }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const InputPlugin: ComponentPlugin = {
  type: ComponentType.INPUT,
  paletteConfig: {
    label: 'Input',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "4", y: "8", width: "16", height: "8", rx: "1", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M9 12V12.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Enter text...',
      dataStoreKey: 'newInput',
      accessibilityLabel: 'Text input field',
      width: 200,
      height: 40,
      disabled: false,
    },
  },
  renderer: InputRenderer,
  properties: InputProperties,
};