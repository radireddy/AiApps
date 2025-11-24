

import React from 'react';
import { ComponentType, LabelProps, ComponentPlugin } from '../../types';
import { InlineTextEditor, buildSpacingStyles } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { propertyRendererRegistry } from '../../property-renderers/registry';
import { BasePropertiesRenderer, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const LabelRenderer: React.FC<{
  component: { props: LabelProps };
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, isEditingInline, onCommitInlineEdit, evaluationScope }) => {
  const p = component.props;

  // Call all renderer hooks at the top level (React hooks must be called unconditionally)
  // Then select which result to use based on textRenderer prop
  const javascriptContent = propertyRendererRegistry.javascript(p.text, evaluationScope, '');
  const markdownContent = propertyRendererRegistry.markdown(p.text, evaluationScope, '');
  const literalContent = propertyRendererRegistry.literal(p.text, evaluationScope, '');
  
  // Select the appropriate content based on textRenderer
  const textRenderer = p.textRenderer || 'javascript';
  const content = textRenderer === 'markdown' 
    ? markdownContent 
    : textRenderer === 'literal' 
    ? literalContent 
    : javascriptContent;
  
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, 'transparent');

  const paddingValue = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
  const marginValue = useJavaScriptRenderer(p.margin, evaluationScope, undefined);
  
  const style: React.CSSProperties = {
    fontSize: `${useJavaScriptRenderer(p.fontSize, evaluationScope, 16)}px`,
    fontWeight: p.fontWeight,
    color: color,
    textAlign: p.textAlign || 'left', // Default to 'left' if not specified
    fontFamily: useJavaScriptRenderer(p.fontFamily, evaluationScope, 'sans-serif'),
    backgroundColor: backgroundColor,
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '0px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '0px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, 'transparent'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
    ...buildSpacingStyles(paddingValue, marginValue),
    padding: paddingValue !== undefined ? undefined : '8px', // Use prop padding if set, otherwise default to 8px
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
      return <div style={{...style, display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  // Use flexbox for vertical centering (alignItems: 'center')
  // For horizontal alignment, use justifyContent based on textAlign
  // Map textAlign to justifyContent: 'left' -> 'flex-start', 'center' -> 'center', 'right' -> 'flex-end'
  const justifyContent = p.textAlign === 'center' ? 'center' : (p.textAlign === 'right' ? 'flex-end' : 'flex-start');
  
  return (
    <div style={{...style, display: 'flex', alignItems: 'center', justifyContent, width: '100%', height: '100%'}}>
      <span style={{ textAlign: p.textAlign || 'left', width: '100%' }}>{String(content)}</span>
    </div>
  );
};

const LabelProperties: React.FC<{
  component: { props: LabelProps, id: string };
  updateProp: (key: keyof LabelProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  // Content properties (textRenderer) moved to basic properties
  // Text is now in basic properties
  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'color-typography', 'styling'],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.LABEL }}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
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