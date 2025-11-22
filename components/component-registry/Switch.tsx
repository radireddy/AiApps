

import React from 'react';
import { ComponentType, SwitchProps, ComponentPlugin } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SwitchRenderer: React.FC<{
  component: { id: string; props: SwitchProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
  const p = component.props;
  const isChecked = !!get(dataStore, p.dataStoreKey);
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
      <label id={`${component.id}-label`} className={`text-gray-800 mr-3 flex-shrink-0 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}>{p.label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={`${component.id}-label`}
        aria-disabled={isDisabledInPreview}
        onClick={() => onUpdateDataStore?.(p.dataStoreKey, !isChecked)}
        className={`${isChecked ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
        disabled={isDisabledInPreview}
      >
        <span className={`${isChecked ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} aria-hidden="true"/>
      </button>
    </div>
  );
};

const SwitchProperties: React.FC<{
  component: { id: string, props: SwitchProps };
  updateProp: (key: keyof SwitchProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'input-value'],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.SWITCH }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const SwitchPlugin: ComponentPlugin = {
  type: ComponentType.SWITCH,
  paletteConfig: {
    label: 'Switch',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg"}, React.createElement('rect', {x:"4", y:"9", width:"16", height:"6", rx:"3", stroke:"currentColor", strokeWidth:"2"}), React.createElement('circle', {cx:"10", cy:"12", r:"2", stroke:"currentColor", strokeWidth:"2"})),
    defaultProps: {
      label: 'Enable Feature',
      dataStoreKey: 'newSwitch',
      width: 180,
      height: 30,
      disabled: false,
    },
  },
  renderer: SwitchRenderer,
  properties: SwitchProperties,
};