
import React from 'react';
import { ComponentType, SelectProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, StateProps } from './common';
import { get } from '../../utils/data-helpers';
import { useExpression } from '../../expressions/useExpression';
import { commonStylingProps } from '../../constants';

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
  const isDisabled = !!useExpression(p.disabled, evaluationScope, false);
  const style = {
    borderRadius: useExpression(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useExpression(p.borderWidth, evaluationScope, '1px'),
    borderColor: useExpression(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: isDisabled ? 0.6 : 1,
  };

  return (
    <select
      value={get(dataStore, p.dataStoreKey, '')}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full p-2 bg-white text-gray-900 focus:outline-none ${mode === 'edit' ? 'pointer-events-none' : ''}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
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
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Settings">
        <PropInput label="Placeholder" value={p.placeholder} onChange={val => updateProp('placeholder', val)} />
        <PropInput label="Data Store Key" value={p.dataStoreKey} onChange={val => updateProp('dataStoreKey', val)} placeholder="e.g. selectedRecord.role"/>
        <PropInput label="Options (CSV)" value={p.options} onChange={val => updateProp('options', val)} placeholder="Option 1, Option 2" />
      </CollapsibleSection>
      <CollapsibleSection title="Accessibility">
        <PropInput label="Accessibility Label" value={p.accessibilityLabel} onChange={val => updateProp('accessibilityLabel', val)} placeholder="A descriptive label for screen readers" />
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
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