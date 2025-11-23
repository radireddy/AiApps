

import React from 'react';
import { ComponentType, RadioGroupProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, StateProps } from './common';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { evaluateDisabled } from '../../utils/disabled-helper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const RadioGroupRenderer: React.FC<{
  component: { id: string; props: RadioGroupProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
  const p = component.props;
  const options = p.options.split(',').map(opt => opt.trim());
  const isDisabled = evaluateDisabled(p.disabled, evaluationScope);
  const isDisabledInEdit = mode === 'edit' || isDisabled;
  const groupLabelId = `${component.id}-group-label`;
  const selectedValue = get(dataStore, p.dataStoreKey);

  return (
    <div 
        className={`w-full h-full flex flex-col justify-center p-2 ${isDisabled ? 'opacity-60' : ''}`}
        role="radiogroup"
        aria-labelledby={groupLabelId}
        aria-disabled={isDisabled}
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
            onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
            className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${isDisabledInEdit ? 'pointer-events-none' : ''}`}
            disabled={isDisabledInEdit}
          />
          <label htmlFor={`${component.id}-${option}`} className={`text-gray-800 ${isDisabledInEdit ? 'pointer-events-none' : ''}`}>{option}</label>
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
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Settings">
        <PropInput label="Data Store Key" value={p.dataStoreKey} onChange={val => updateProp('dataStoreKey', val)} placeholder="e.g. selectedRecord.role"/>
        <PropInput label="Options (CSV)" value={p.options} onChange={val => updateProp('options', val)} placeholder="Option 1, Option 2" />
      </CollapsibleSection>
       <CollapsibleSection title="Accessibility">
        <PropInput label="Group Label" value={p.groupLabel} onChange={val => updateProp('groupLabel', val)} placeholder="A label for the whole group" />
      </CollapsibleSection>
    </>
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
    },
  },
  renderer: RadioGroupRenderer,
  properties: RadioGroupProperties,
};