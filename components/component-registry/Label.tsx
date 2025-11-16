

import React from 'react';
import { ComponentType, LabelProps, ComponentPlugin, PropertyRendererType } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, PropSelect, StateProps, PropFxInput, InlineTextEditor } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { propertyRendererRegistry } from '../../property-renderers/registry';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const LabelRenderer: React.FC<{
  component: { props: LabelProps };
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, isEditingInline, onCommitInlineEdit, evaluationScope }) => {
  const p = component.props;

  // Dynamically select the renderer based on the textRenderer prop
  const rendererHook = propertyRendererRegistry[p.textRenderer || 'javascript'] || propertyRendererRegistry.literal;
  const content = rendererHook(p.text, evaluationScope, '');
  
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, 'transparent');

  const style: React.CSSProperties = {
    fontSize: `${useJavaScriptRenderer(p.fontSize, evaluationScope, 16)}px`,
    fontWeight: p.fontWeight,
    color: color,
    textAlign: p.textAlign,
    fontFamily: useJavaScriptRenderer(p.fontFamily, evaluationScope, 'sans-serif'),
    backgroundColor: backgroundColor,
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '0px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '0px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, 'transparent'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
    padding: '8px',
    boxSizing: 'border-box'
  };

  if (isEditingInline && onCommitInlineEdit) {
      return (
          <div style={{...style, padding: '0'}}>
              <InlineTextEditor
                value={p.text}
                onCommit={onCommitInlineEdit}
                style={{ 
                    fontSize: style.fontSize, 
                    fontWeight: style.fontWeight,
                    color: style.color,
                    textAlign: style.textAlign,
                    fontFamily: style.fontFamily,
                    padding: '8px',
                }}
              />
          </div>
      )
  }
  
  // For renderers that return a string (like Markdown), we need to render it as HTML
  if (p.textRenderer === 'markdown' && typeof content === 'string') {
      return <div style={{...style, display: 'block'}} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <div style={{...style, display: 'flex', alignItems: 'center'}}>{String(content)}</div>;
};

const LabelProperties: React.FC<{
  component: { props: LabelProps, id: string };
  updateProp: (key: keyof LabelProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const p = component.props;
  const rendererOptions: { value: PropertyRendererType, label: string }[] = [
      { value: 'javascript', label: 'JavaScript Expression' },
      { value: 'markdown', label: 'Markdown' },
      { value: 'literal', label: 'Plain Text' },
  ];

  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <StateProps props={{...p, id: component.id}} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Content">
          <PropSelect label="Text Renderer" value={p.textRenderer} onChange={val => updateProp('textRenderer', val)} options={rendererOptions} />
          <PropFxInput label="Text" value={p.text} onChange={val => updateProp('text', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('text', newVal))} />
      </CollapsibleSection>
      <CollapsibleSection title="Typography">
          <div className="grid grid-cols-2 gap-2">
              <PropFxInput label="Font Size" value={p.fontSize} onChange={val => updateProp('fontSize', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('fontSize', newVal))} />
              <PropFxInput label="Text Color" value={p.color} onChange={val => updateProp('color', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('color', newVal))} />
          </div>
          <PropSelect label="Font Weight" value={p.fontWeight} onChange={val => updateProp('fontWeight', val)} options={[{value: 'normal', label: 'Normal'}, {value: 'bold', label: 'Bold'}]} />
          <PropSelect label="Text Align" value={p.textAlign} onChange={val => updateProp('textAlign', val)} options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
          <PropFxInput label="Font Family" value={p.fontFamily} onChange={val => updateProp('fontFamily', val)} placeholder="Inter, sans-serif" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('fontFamily', newVal))}/>
      </CollapsibleSection>
       <CollapsibleSection title="Background" isOpenDefault={false}>
          <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};

export const LabelPlugin: ComponentPlugin = {
  type: ComponentType.LABEL,
  paletteConfig: {
    label: 'Label',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 7H14", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 12H10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M16 11L18.5 16L21 11", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonStylingProps,
      text: 'New Label',
      width: 150,
      height: 40,
      fontSize: 16,
      fontWeight: 'normal',
      color: '{{theme.colors.text}}',
      textAlign: 'left',
      fontFamily: '{{theme.font.family}}',
      backgroundColor: 'transparent',
      borderStyle: 'none',
      textRenderer: 'javascript',
    },
  },
  renderer: LabelRenderer,
  properties: LabelProperties,
};