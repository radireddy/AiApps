

import React from 'react';
import { ComponentType, ImageProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const ImageRenderer: React.FC<{
  component: { props: ImageProps };
  evaluationScope: Record<string, any>;
}> = ({ component, evaluationScope }) => {
  const p = component.props;
  const style = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    objectFit: p.objectFit,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
  };
  return <img src={p.src} alt={p.alt} style={style} className="w-full h-full" />;
};

const ImageProperties: React.FC<{
  component: { id: string, props: ImageProps };
  updateProp: (key: keyof ImageProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const settingsGroup: PropertyGroup = {
    id: 'image-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'src',
        label: 'Image URL',
        type: 'text',
      },
      {
        key: 'alt',
        label: 'Alt Text',
        type: 'text',
      },
      {
        key: 'objectFit',
        label: 'Object Fit',
        type: 'select',
        options: [
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
          { value: 'none', label: 'None' },
          { value: 'scale-down', label: 'Scale Down' },
        ],
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border', 'styling'],
    customGroups: [settingsGroup],
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

export const ImagePlugin: ComponentPlugin = {
  type: ComponentType.IMAGE,
  paletteConfig: {
    label: 'Image',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" }), React.createElement('circle', { cx: "10", cy: "10", r: "2", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M14 16L12 14L4 20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })),
    defaultProps: {
      ...commonStylingProps,
      src: 'https://picsum.photos/200/200',
      alt: 'Placeholder Image',
      width: 200,
      height: 200,
      objectFit: 'cover'
    },
  },
  renderer: ImageRenderer,
  properties: ImageProperties,
};