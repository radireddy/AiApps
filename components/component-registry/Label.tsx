

import React from 'react';
import { ComponentType, LabelProps, ComponentPlugin, PropertyRendererType } from '../../types';
import { InlineTextEditor } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { propertyRendererRegistry } from '../../property-renderers/registry';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

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
  const rendererOptions: { value: PropertyRendererType, label: string }[] = [
      { value: 'javascript', label: 'JavaScript Expression' },
      { value: 'markdown', label: 'Markdown' },
      { value: 'literal', label: 'Plain Text' },
  ];

  const contentGroup: PropertyGroup = {
    id: 'label-content',
    title: 'Content',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'textRenderer',
        label: 'Text Renderer',
        type: 'select',
        options: rendererOptions,
      },
      {
        key: 'text',
        label: 'Text',
        type: 'expression',
      },
    ],
  };

  const typographyGroup: PropertyGroup = {
    id: 'label-typography',
    title: 'Typography',
    order: 4,
    collapsible: true,
    properties: [
      {
        key: 'fontSize',
        label: 'Font Size',
        type: 'expression',
        inputProps: { type: 'number' },
      },
      {
        key: 'color',
        label: 'Text Color',
        type: 'expression',
        inputProps: { type: 'color' },
      },
      {
        key: 'fontWeight',
        label: 'Font Weight',
        type: 'select',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Bold' },
        ],
      },
      {
        key: 'textAlign',
        label: 'Text Align',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
      {
        key: 'fontFamily',
        label: 'Font Family',
        type: 'expression',
        placeholder: 'Inter, sans-serif',
      },
    ],
  };

  const backgroundGroup: PropertyGroup = {
    id: 'label-background',
    title: 'Background',
    order: 5,
    collapsible: true,
    defaultCollapsed: true,
    properties: [
      {
        key: 'backgroundColor',
        label: 'Background Color',
        type: 'expression',
        inputProps: { type: 'color' },
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border', 'styling'],
    customGroups: [contentGroup, typographyGroup, backgroundGroup],
    groupOrder: ['layout', 'state', 'label-content', 'label-typography', 'label-background', 'border', 'styling'],
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