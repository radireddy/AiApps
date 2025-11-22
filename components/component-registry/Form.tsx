

import React from 'react';
import { ComponentType, FormProps, ComponentPlugin } from '../../types';
import { PanelRenderer, PanelProperties } from './Panel';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const FormRenderer: React.FC<{
  component: { props: FormProps };
  children: React.ReactNode;
  evaluationScope: Record<string, any>;
}> = ({ component, children, evaluationScope }) => {
  // Form uses the same renderer as Panel since FormProps extends PanelProps
  return (
    <PanelRenderer
      component={component as any}
      children={children}
      evaluationScope={evaluationScope}
    />
  );
};

const FormProperties: React.FC<{
  component: { id?: string; props: FormProps };
  updateProp: (key: keyof FormProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  arrangeChildren?: (panelId: string | undefined, opts: { direction?: string; justifyContent?: string; alignItems?: string }) => void;
}> = ({ component, updateProp, onOpenExpressionEditor, arrangeChildren }) => {
  // Form uses the same properties as Panel since FormProps extends PanelProps
  // All groups will be collapsible through PanelProperties
  return (
    <PanelProperties
      component={component as any}
      updateProp={updateProp as any}
      onOpenExpressionEditor={onOpenExpressionEditor}
      arrangeChildren={arrangeChildren}
    />
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