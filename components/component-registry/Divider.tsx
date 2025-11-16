
import React from 'react';
import { ComponentType, DividerProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropFxInput } from './common';
import { useExpression } from '../../expressions/useExpression';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const DividerRenderer: React.FC<{
  component: { props: DividerProps };
  evaluationScope: Record<string, any>;
}> = ({ component, evaluationScope }) => {
  const p = component.props;
  const color = useExpression(p.color, evaluationScope, '#d1d5db');
  return <div style={{ backgroundColor: color, opacity: p.opacity }} className="w-full h-full"></div>;
};

const DividerProperties: React.FC<{
  component: { props: DividerProps };
  updateProp: (key: keyof DividerProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <CollapsibleSection title="Styling">
        <PropFxInput label="Color" value={p.color} onChange={val => updateProp('color', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('color', newVal))} />
      </CollapsibleSection>
    </>
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