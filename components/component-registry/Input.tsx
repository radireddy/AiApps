
import React from 'react';
import { ComponentType, InputProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, StateProps, PropFxInput, InlineTextEditor } from './common';
import { get } from '../../utils/data-helpers';
import { useExpression } from '../../expressions/useExpression';
import { commonStylingProps } from '../../constants';

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
  const isDisabled = !!useExpression(p.disabled, evaluationScope, false);
  const placeholder = useExpression(p.placeholder, evaluationScope, '');

  const style: React.CSSProperties = {
    borderRadius: useExpression(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useExpression(p.borderWidth, evaluationScope, '1px'),
    borderColor: useExpression(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: isDisabled ? 0.6 : useExpression(p.opacity, evaluationScope, 1),
    padding: '0.5rem',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#111827',
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

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={get(dataStore, p.dataStoreKey, '')}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full bg-white text-gray-900 focus:outline-none`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={p.accessibilityLabel || p.placeholder}
    />
  );
};

const InputProperties: React.FC<{
  component: { id: string, props: InputProps };
  updateProp: (key: keyof InputProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Settings">
        <PropFxInput label="Placeholder" value={p.placeholder} onChange={val => updateProp('placeholder', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('placeholder', newVal))} />
        <PropInput label="Data Store Key" value={p.dataStoreKey} onChange={val => updateProp('dataStoreKey', val)} placeholder="e.g. selectedRecord.name" />
      </CollapsibleSection>
      <CollapsibleSection title="Accessibility">
        <PropInput label="Accessibility Label" value={p.accessibilityLabel} onChange={val => updateProp('accessibilityLabel', val)} placeholder="A descriptive label for screen readers" />
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
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