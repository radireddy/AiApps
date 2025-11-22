

import React from 'react';
import { ComponentType, TextareaProps, ComponentPlugin } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TextareaRenderer: React.FC<{
  component: { props: TextareaProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
  const p = component.props;
  const isDisabled = !!useJavaScriptRenderer(p.disabled, evaluationScope, false);

  const style = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: isDisabled ? 0.6 : 1,
  };
  const currentValue = get(dataStore, p.dataStoreKey, '');
  return (
    <textarea
      placeholder={p.placeholder}
      {...(onUpdateDataStore ? { defaultValue: currentValue } : { value: currentValue })}
      onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      style={style}
      className={`w-full h-full p-2 bg-white text-gray-900 focus:outline-none resize-none`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={p.accessibilityLabel || p.placeholder}
    />
  );
};

const TextareaProperties: React.FC<{
  component: { id: string, props: TextareaProps };
  updateProp: (key: keyof TextareaProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const settingsGroup: PropertyGroup = {
    id: 'textarea-settings',
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
        placeholder: 'e.g. selectedRecord.bio',
      },
    ],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'textarea-accessibility',
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

export const TextareaPlugin: ComponentPlugin = {
  type: ComponentType.TEXTAREA,
  paletteConfig: {
    label: 'Textarea',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 6H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 10H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 14H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 18H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Enter long text...',
      dataStoreKey: 'newTextarea',
      accessibilityLabel: 'Text area for long text',
      width: 250,
      height: 100,
      disabled: false,
    },
  },
  renderer: TextareaRenderer,
  properties: TextareaProperties,
};