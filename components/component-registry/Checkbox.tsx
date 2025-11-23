

import React from 'react';
import { ComponentType, CheckboxProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, StateProps, PropFxInput } from './common';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { evaluateDisabled } from '../../utils/disabled-helper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const CheckboxRenderer: React.FC<{
  component: { id: string; props: CheckboxProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
  const p = component.props;
  const isDisabled = evaluateDisabled(p.disabled, evaluationScope);
  const isDisabledInEdit = mode === 'edit' || isDisabled;
  return (
    <div className="flex items-center w-full h-full">
      <input
        type="checkbox"
        id={component.id}
        checked={!!get(dataStore, p.dataStoreKey)}
        onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.checked)}
        className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isDisabledInEdit ? 'pointer-events-none' : ''}`}
        disabled={isDisabledInEdit}
        aria-disabled={isDisabledInEdit}
      />
      <label htmlFor={component.id} className={`text-gray-800 ${isDisabledInEdit ? 'pointer-events-none' : ''} ${isDisabled ? 'opacity-60' : ''}`}>{p.label}</label>
    </div>
  );
};

const CheckboxProperties: React.FC<{
  component: { id: string, props: CheckboxProps };
  updateProp: (key: keyof CheckboxProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Settings">
        <PropInput label="Label" value={p.label} onChange={val => updateProp('label', val)} />
        <PropInput label="Data Store Key" value={p.dataStoreKey} onChange={val => updateProp('dataStoreKey',val)} placeholder="e.g. selectedRecord.active"/>
      </CollapsibleSection>
    </>
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