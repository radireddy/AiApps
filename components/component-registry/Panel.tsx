
import React from 'react';
import { ComponentType, PanelProps, ComponentPlugin } from '../../types';
import { StylingProps, PropertyGroup, PropFxInput, PropInput, Tooltip } from './common';
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
  const direction = useJavaScriptRenderer(p.direction, evaluationScope, 'horizontal');
  const justify = useJavaScriptRenderer(p.justifyContent, evaluationScope, 'start');
  const align = useJavaScriptRenderer(p.alignItems, evaluationScope, 'center');

  const mapJustify = (j: any) => {
    switch (j) {
      case 'center': return 'center';
      case 'end': return 'flex-end';
      case 'space-between': return 'space-between';
      default: return 'flex-start';
    }
  };

  const mapAlign = (a: any) => {
    switch (a) {
      case 'center': return 'center';
      case 'end': return 'flex-end';
      case 'stretch': return 'stretch';
      default: return 'flex-start';
    }
  };

  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    justifyContent: mapJustify(justify),
    alignItems: mapAlign(align),
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  return <div style={{ ...style, ...layoutStyle }} className="w-full h-full relative">{children}</div>;
};

const PanelProperties: React.FC<{
  component: { id?: string; props: PanelProps };
  updateProp: (key: keyof PanelProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  arrangeChildren?: (panelId: string | undefined, opts: { direction?: string; justifyContent?: string; alignItems?: string }) => void;
}> = ({ component, updateProp, onOpenExpressionEditor, arrangeChildren }) => {
  const p = component.props;
  const dir = p.direction || 'horizontal';
  const justify = p.justifyContent || 'start';
  const align = p.alignItems || 'center';

  // Direction icons - black and white, twice as wide as tall
  const HorizontalDirectionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="17" y="4" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  );

  const VerticalDirectionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
      <rect x="9" y="1" width="14" height="6" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="9" y="9" width="14" height="6" rx="1" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  );

  // Justify options - black and white, twice as wide as tall
  const JustifyOptions = [
    { 
      value: 'start', 
      title: 'Start', 
      description: 'Align items to the start',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="1" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'center', 
      title: 'Center', 
      description: 'Center items',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="13" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="11.5" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'end', 
      title: 'End', 
      description: 'Align items to the end',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="25" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="22" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'space-between', 
      title: 'Space Between', 
      description: 'Distribute with space between',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="13.5" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="26" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
  ];

  // Align options - black and white, twice as wide as tall
  const AlignOptions = [
    { 
      value: 'start', 
      title: 'Start', 
      description: 'Align items to the start',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="1" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="1" width="8" height="6" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'center', 
      title: 'Center', 
      description: 'Center items',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="12" y="6" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="10" y="10" width="12" height="5" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'end', 
      title: 'End', 
      description: 'Align items to the end',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="11" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="9" width="8" height="6" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'stretch', 
      title: 'Stretch', 
      description: 'Stretch items to fill space',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="1" width="8" height="14" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="1" width="8" height="14" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
  ];

  return (
    <div className="py-1">
      <PropertyGroup title="Layout">
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-600 mb-2">Direction</label>
          <div className="flex gap-2">
            <Tooltip text="Arrange horizontally">
              <button 
                onClick={() => { updateProp('direction', 'horizontal'); if (arrangeChildren) arrangeChildren(component.id, { direction: 'horizontal' }); }} 
                className={`p-2 rounded-md border transition-colors ${dir === 'horizontal' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`} 
                aria-pressed={dir === 'horizontal'} 
                aria-label="Set direction to horizontal"
              >
                {HorizontalDirectionIcon}
              </button>
            </Tooltip>
            <Tooltip text="Arrange vertically">
              <button 
                onClick={() => { updateProp('direction', 'vertical'); if (arrangeChildren) arrangeChildren(component.id, { direction: 'vertical' }); }} 
                className={`p-2 rounded-md border transition-colors ${dir === 'vertical' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`} 
                aria-pressed={dir === 'vertical'} 
                aria-label="Set direction to vertical"
              >
                {VerticalDirectionIcon}
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-600 mb-2">{dir === 'horizontal' ? 'Justify' : 'Justify'}</label>
          <div className="flex gap-2">
            {JustifyOptions.map(opt => (
              <Tooltip key={opt.value} text={opt.description || opt.title}>
                <button 
                  onClick={() => { updateProp('justifyContent', opt.value as any); if (arrangeChildren) arrangeChildren(component.id, { justifyContent: opt.value }); }} 
                  className={`p-2 rounded-md border transition-colors ${justify === opt.value ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`} 
                  aria-pressed={justify === opt.value} 
                  aria-label={`Justify content: ${opt.title} - ${opt.description || ''}`}
                >
                  {opt.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="mb-0">
          <label className="block text-[11px] font-medium text-gray-600 mb-2">{dir === 'horizontal' ? 'Align' : 'Align'}</label>
          <div className="flex gap-2">
            {AlignOptions.map(opt => (
              <Tooltip key={opt.value} text={opt.description || opt.title}>
                <button 
                  onClick={() => { updateProp('alignItems', opt.value as any); if (arrangeChildren) arrangeChildren(component.id, { alignItems: opt.value }); }} 
                  className={`p-2 rounded-md border transition-colors ${align === opt.value ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`} 
                  aria-pressed={align === opt.value} 
                  aria-label={`Align items: ${opt.title} - ${opt.description || ''}`}
                >
                  {opt.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Position & Size">
        <div className="grid grid-cols-2 gap-2.5">
          <PropInput label="X" value={p.x} onChange={val => updateProp('x', val)} type="number" />
          <PropInput label="Y" value={p.y} onChange={val => updateProp('y', val)} type="number" />
          <PropInput label="Width" value={p.width} onChange={val => updateProp('width', val)} type="number" />
          <PropInput label="Height" value={p.height} onChange={val => updateProp('height', val)} type="number" />
        </div>
      </PropertyGroup>

      <PropertyGroup title="Background">
        <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
        <PropFxInput label="Background Gradient" value={p.backgroundGradient} onChange={val => updateProp('backgroundGradient', val)} placeholder="e.g. linear-gradient(...)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal))} />
      </PropertyGroup>

      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </div>
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
      direction: 'horizontal',
      justifyContent: 'start',
      alignItems: 'center',
    },
  },
  renderer: PanelRenderer,
  properties: PanelProperties,
};