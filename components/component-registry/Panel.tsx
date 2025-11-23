
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

  const JustifyOptions = [
    { value: 'start', title: 'Start', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'center', title: 'Center', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'end', title: 'End', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 18h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'space-between', title: 'Space Between', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h4M17 6h4M3 18h4M17 18h4M11 12h2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  ];

  const AlignOptions = [
    { value: 'start', title: 'Start', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3v18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'center', title: 'Center', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'end', title: 'End', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 3v18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { value: 'stretch', title: 'Stretch', icon: (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3v18M18 3v18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  ];

  return (
    <>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Direction</label>
        <div className="flex gap-2">
          <button onClick={() => { updateProp('direction', 'horizontal'); if (arrangeChildren) arrangeChildren(component.id, { direction: 'horizontal' }); }} className={`p-2 rounded-md border ${dir === 'horizontal' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`} title="Horizontal" aria-pressed={dir === 'horizontal'} aria-label="Direction: Horizontal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => { updateProp('direction', 'vertical'); if (arrangeChildren) arrangeChildren(component.id, { direction: 'vertical' }); }} className={`p-2 rounded-md border ${dir === 'vertical' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`} title="Vertical" aria-pressed={dir === 'vertical'} aria-label="Direction: Vertical">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{dir === 'horizontal' ? 'Justify (Horizontal)' : 'Justify (Vertical)'}</label>
        <div className="flex gap-2">
          {JustifyOptions.map(opt => (
            <button key={opt.value} onClick={() => { updateProp('justifyContent', opt.value as any); if (arrangeChildren) arrangeChildren(component.id, { justifyContent: opt.value }); }} className={`p-2 rounded-md border ${justify === opt.value ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`} title={opt.title} aria-pressed={justify === opt.value} aria-label={`Justify: ${opt.title}`}>
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{dir === 'horizontal' ? 'Align (Vertical)' : 'Align (Horizontal)'}</label>
        <div className="flex gap-2">
          {AlignOptions.map(opt => (
            <button key={opt.value} onClick={() => { updateProp('alignItems', opt.value as any); if (arrangeChildren) arrangeChildren(component.id, { alignItems: opt.value }); }} className={`p-2 rounded-md border ${align === opt.value ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`} title={opt.title} aria-pressed={align === opt.value} aria-label={`Align: ${opt.title}`}>
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

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
      direction: 'horizontal',
      justifyContent: 'start',
      alignItems: 'center',
    },
  },
  renderer: PanelRenderer,
  properties: PanelProperties,
};