

import React from 'react';
import { ComponentType, CheckboxProps, ComponentPlugin } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const CheckboxRenderer: React.FC<{
  component: { id: string; props: CheckboxProps };
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
  // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
  const pointerEventsStyle = mode === 'edit' && isDisabled ? { pointerEvents: 'none' as const } : {};
  
  return (
    <div className="flex items-center w-full h-full" style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}>
      <input
        type="checkbox"
        id={component.id}
        checked={!!get(dataStore, p.dataStoreKey)}
        onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.checked)}
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
  const settingsGroup: PropertyGroup = {
    id: 'checkbox-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'label',
        label: 'Label',
        type: 'text',
      },
      {
        key: 'dataStoreKey',
        label: 'Data Store Key',
        type: 'text',
        placeholder: 'e.g. selectedRecord.active',
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['layout', 'state'],
    customGroups: [settingsGroup],
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
    },
  },
  renderer: CheckboxRenderer,
  properties: CheckboxProperties,
};