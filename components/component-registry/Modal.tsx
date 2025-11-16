

import React from 'react';
import { ComponentType, ModalProps, ComponentPlugin } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropFxInput, StateProps } from './common';
import { PanelPlugin } from './Panel'; // Modals are a type of panel
// FIX: Replaced non-existent `useExpression` with `useJavaScriptRenderer`.
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const ModalRenderer: React.FC<{
  component: { props: ModalProps };
  children: React.ReactNode;
  evaluationScope: Record<string, any>;
}> = ({ component, children, evaluationScope }) => {
  const p = component.props;
  const panelStyle = {
    backgroundColor: useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff'),
    background: useJavaScriptRenderer(p.backgroundGradient, evaluationScope, '') || useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff'),
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
    width: `${p.width}px`,
    height: `${p.height}px`,
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
      <div style={panelStyle} className="relative">
        {children}
      </div>
    </div>
  );
};

const ModalProperties: React.FC<{
  component: { props: ModalProps, id: string };
  updateProp: (key: keyof ModalProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  return (
    <>
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <LayoutProps props={p} updateProp={updateProp} />
       <CollapsibleSection title="Background">
        <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))}/>
        <PropFxInput label="Background Gradient" value={p.backgroundGradient} onChange={val => updateProp('backgroundGradient', val)} placeholder="e.g. linear-gradient(...)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal))}/>
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};

export const ModalPlugin: ComponentPlugin = {
  ...PanelPlugin, // Inherit container logic from Form/Panel
  type: ComponentType.MODAL,
  paletteConfig: {
      ...PanelPlugin.paletteConfig,
      label: 'Modal',
      icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, 
          React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" }),
          React.createElement('path', { d: "M4 8h16", stroke: "currentColor", strokeWidth: "2" })
      ),
      defaultProps: {
          ...PanelPlugin.paletteConfig.defaultProps,
          x: 0, // Modals are centered, x/y are for size
          y: 0,
          backgroundColor: '{{theme.colors.background}}',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          width: 500,
          height: 300,
          hidden: false,
      },
  },
  renderer: ModalRenderer,
  properties: ModalProperties,
};