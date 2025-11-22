

import React from 'react';
import { ComponentType, InputProps, ComponentPlugin } from '../../types';
import { InlineTextEditor } from './common';
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
  const isDisabled = !!useJavaScriptRenderer(p.disabled, evaluationScope, false);
  const placeholder = useJavaScriptRenderer(p.placeholder, evaluationScope, '');

  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: isDisabled ? 0.6 : useJavaScriptRenderer(p.opacity, evaluationScope, 1),
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

  const currentValue = get(dataStore, p.dataStoreKey, '');
  return (
    <input
      type="text"
      placeholder={placeholder}
      {...(onUpdateDataStore ? { defaultValue: currentValue } : { value: currentValue })}
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
  const settingsGroup: PropertyGroup = {
    id: 'input-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'expression',
      },
      {
        key: 'dataStoreKey',
        label: 'Data Store Key',
        type: 'text',
        placeholder: 'e.g. selectedRecord.name',
      },
    ],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'input-accessibility',
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