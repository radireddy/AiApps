

import React from 'react';
import { ComponentType, DividerProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const DividerRenderer: React.FC<{
  component: { props: DividerProps };
  evaluationScope: Record<string, any>;
}> = ({ component, evaluationScope }) => {
  const p = component.props;
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#d1d5db');
  const opacity = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  const boxShadow = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  return <div style={{ backgroundColor: color, opacity: typeof opacity === 'number' ? opacity : (typeof opacity === 'string' ? parseFloat(opacity) || 1 : 1), boxShadow: boxShadow || undefined }} className="w-full h-full"></div>;
};

const DividerProperties: React.FC<{
  component: { props: DividerProps };
  updateProp: (key: keyof DividerProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const stylingGroup: PropertyGroup = {
    id: 'divider-styling',
    title: 'Styling',
    order: 2,
    collapsible: true,
    properties: [
      {
        key: 'color',
        label: 'Color',
        type: 'expression',
        inputProps: { type: 'color' },
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'layout-position', 'color-typography', 'styling'],
    customGroups: [stylingGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.DIVIDER }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const DividerPlugin: ComponentPlugin = {
  type: ComponentType.DIVIDER,
  paletteConfig: {
    label: 'Divider',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 12H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      width: 300,
      height: 2,
      color: '{{theme.colors.border}}',
      opacity: 1,
      boxShadow: '',
    },
  },
  renderer: DividerRenderer,
  properties: DividerProperties,
};