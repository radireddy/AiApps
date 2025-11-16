

import React from 'react';
import { ComponentType, PanelProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropFxInput } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const PanelRenderer: React.FC<{
  component: { props: PanelProps };
  children: React.ReactNode;
  evaluationScope: Record<string, any>;
}> = ({ component, children, evaluationScope }) => {
  const p = component.props;
  const style = {
    backgroundColor: useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff'),
    background: useJavaScriptRenderer(p.backgroundGradient, evaluationScope, '') || useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff'),
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
  };
  return <div style={style} className="w-full h-full relative">{children}</div>;
};

const PanelProperties: React.FC<{
  component: { props: PanelProps };
  updateProp: (key: keyof PanelProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <CollapsibleSection title="Background">
        <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
        <PropFxInput label="Background Gradient" value={p.backgroundGradient} onChange={val => updateProp('backgroundGradient', val)} placeholder="e.g. linear-gradient(...)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal))} />
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};

export const PanelPlugin: ComponentPlugin = {
  type: ComponentType.PANEL,
  isContainer: true,
  paletteConfig: {
    label: 'Panel',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 4H20V20H4V4Z", stroke: "currentColor", strokeWidth: "2", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonStylingProps,
      width: 300,
      height: 200,
      backgroundColor: '{{theme.colors.surface}}',
      backgroundGradient: '',
    },
  },
  renderer: PanelRenderer,
  properties: PanelProperties,
};