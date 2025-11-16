
import React from 'react';
import { ComponentType, FormProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropFxInput } from './common';
import { useExpression } from '../../expressions/useExpression';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const FormRenderer: React.FC<{
  component: { props: FormProps };
  children: React.ReactNode;
  evaluationScope: Record<string, any>;
}> = ({ component, children, evaluationScope }) => {
  const p = component.props;
  const style = {
    backgroundColor: useExpression(p.backgroundColor, evaluationScope, '#ffffff'),
    background: useExpression(p.backgroundGradient, evaluationScope, '') || useExpression(p.backgroundColor, evaluationScope, '#ffffff'),
    borderRadius: useExpression(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useExpression(p.borderWidth, evaluationScope, '1px'),
    borderColor: useExpression(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useExpression(p.opacity, evaluationScope, 1),
    boxShadow: useExpression(p.boxShadow, evaluationScope, ''),
  };
  return <div style={style} className="w-full h-full relative">{children}</div>;
};

const FormProperties: React.FC<{
  component: { props: FormProps };
  updateProp: (key: keyof FormProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <CollapsibleSection title="Background">
        <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
        {/* FIX: Corrected prop name from `onOpenExpressionEditor` to `onOpenEditor` to match the PropFxInput component's definition. */}
        <PropFxInput label="Background Gradient" value={p.backgroundGradient} onChange={val => updateProp('backgroundGradient', val)} placeholder="e.g. linear-gradient(...)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal))} />
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};

export const FormPlugin: ComponentPlugin = {
  type: ComponentType.FORM,
  isContainer: true,
  paletteConfig: {
    label: 'Form',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M9 12H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M9 16H12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" })),
    defaultProps: {
      ...commonStylingProps,
      width: 400,
      height: 300,
      backgroundColor: '{{theme.colors.surface}}',
      backgroundGradient: '',
    },
  },
  renderer: FormRenderer,
  properties: FormProperties,
};
