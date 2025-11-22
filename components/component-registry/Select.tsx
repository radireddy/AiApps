

import React from 'react';
import { ComponentType, SelectProps, ComponentPlugin } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SelectRenderer: React.FC<{
  component: { props: SelectProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
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
  
  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };

  return (
    <select
      value={get(dataStore, p.dataStoreKey, '')}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full p-2 bg-white text-gray-900 focus:outline-none ${mode === 'edit' ? 'pointer-events-none' : ''}`}
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
      aria-label={p.accessibilityLabel || p.placeholder}
    >
      <option value="" disabled>{p.placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
};

const SelectProperties: React.FC<{
  component: { id: string, props: SelectProps };
  updateProp: (key: keyof SelectProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const settingsGroup: PropertyGroup = {
    id: 'select-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'text',
      },
      {
        key: 'dataStoreKey',
        label: 'Data Store Key',
        type: 'text',
        placeholder: 'e.g. selectedRecord.role',
      },
      {
        key: 'options',
        label: 'Options (CSV)',
        type: 'text',
        placeholder: 'Option 1, Option 2',
      },
    ],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'select-accessibility',
    title: 'Accessibility',
    order: 4,
    collapsible: true,
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
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border', 'styling'],
    customGroups: [settingsGroup, accessibilityGroup],
  };

  return (
    <BasePropertiesRenderer
      component={component}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const SelectPlugin: ComponentPlugin = {
  type: ComponentType.SELECT,
  paletteConfig: {
    label: 'Select',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 9H20", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M7 14L10 17L13 14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Select an option',
      dataStoreKey: 'newSelect',
      options: 'Option 1,Option 2,Option 3',
      accessibilityLabel: 'Dropdown select',
      width: 200,
      height: 40,
      disabled: false,
    },
  },
  renderer: SelectRenderer,
  properties: SelectProperties,
};