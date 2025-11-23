

import React from 'react';
import { ComponentType, SwitchProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, StateProps } from './common';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { evaluateDisabled } from '../../utils/disabled-helper';

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
  const isDisabled = evaluateDisabled(p.disabled, evaluationScope);
  const isDisabledInEdit = mode === 'edit' || isDisabled;

  return (
    <div className={`flex items-center w-full h-full ${isDisabled ? 'opacity-60' : ''}`}>
      <label id={`${component.id}-label`} className={`text-gray-800 mr-3 flex-shrink-0 ${isDisabledInEdit ? 'pointer-events-none' : ''}`}>{p.label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={`${component.id}-label`}
        aria-disabled={isDisabledInEdit}
        onClick={() => onUpdateDataStore?.(p.dataStoreKey, !isChecked)}
        className={`${isChecked ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDisabledInEdit ? 'pointer-events-none' : ''}`}
        disabled={isDisabledInEdit}
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
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Settings">
        <PropInput label="Label" value={p.label} onChange={val => updateProp('label', val)} />
        <PropInput label="Data Store Key" value={p.dataStoreKey} onChange={val => updateProp('dataStoreKey', val)} placeholder="e.g. selectedRecord.active"/>
      </CollapsibleSection>
    </>
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