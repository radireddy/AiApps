
import React from 'react';
import { ComponentType, PanelProps, ComponentPlugin } from '../../types';
import { PropertyGroup, PropFxInput, PropInput, PropSelect, Tooltip, CollapsibleSection } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps, typography } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/**
 * Base Panel Renderer
 * This is the core rendering logic for Panel and all Panel-based components.
 * It can be extended or customized by child components.
 */
export const PanelRenderer: React.FC<{
  component: { props: PanelProps };
  children: React.ReactNode;
  evaluationScope: Record<string, any>;
  /**
   * Optional custom direction override. If provided, this will override the prop direction.
   * Useful for components like H-Stack and V-Stack that have fixed directions.
   */
  directionOverride?: 'horizontal' | 'vertical';
  /**
   * Optional custom style extensions. Allows child components to add additional styles.
   */
  styleExtensions?: React.CSSProperties;
}> = ({ component, children, evaluationScope, directionOverride, styleExtensions = {} }) => {
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
    ...styleExtensions,
  };
  
  // Use directionOverride if provided, otherwise use prop direction
  const direction = directionOverride || useJavaScriptRenderer(p.direction, evaluationScope, 'horizontal');
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

/**
 * Base Panel Properties Component
 * This provides the property editing UI for Panel and can be extended by child components.
 */
export const PanelProperties: React.FC<{
  component: { id?: string; props: PanelProps };
  updateProp: (key: keyof PanelProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  arrangeChildren?: (panelId: string | undefined, opts: { direction?: string; justifyContent?: string; alignItems?: string }) => void;
  /**
   * If true, hides the direction selector (useful for components with fixed direction like H-Stack/V-Stack)
   */
  hideDirectionSelector?: boolean;
  /**
   * Optional custom property groups to add before the default ones
   */
  customPropertyGroups?: React.ReactNode;
  /**
   * Optional custom property groups to add after the default ones
   */
  additionalPropertyGroups?: React.ReactNode;
}> = ({ 
  component, 
  updateProp, 
  onOpenExpressionEditor, 
  arrangeChildren,
  hideDirectionSelector = false,
  customPropertyGroups,
  additionalPropertyGroups,
}) => {
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
      {customPropertyGroups}
      
      {/* (1) Basic */}
      <CollapsibleSection title="Basic" isOpenDefault={true}>
        <PropFxInput label="Hide" value={p.hidden} onChange={val => updateProp('hidden', val)} placeholder="e.g. {{!showAlert}} (use ! to invert: false = visible, true = hidden)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('hidden', newVal))} />
        {/* Disabled not shown for panels */}
      </CollapsibleSection>

      {/* (2) Container Layout Specific */}
      {!hideDirectionSelector && (
        <CollapsibleSection title="Container Layout Specific" isOpenDefault={false}>
          <div className="mb-3">
            <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Direction</label>
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
            <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Justify</label>
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
            <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Align</label>
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
        </CollapsibleSection>
      )}

      {/* (3) Layout And Position */}
      <CollapsibleSection title="Layout And Position" isOpenDefault={true}>
        <div className="grid grid-cols-2 gap-2.5">
          <PropInput label="X" value={p.x} onChange={val => updateProp('x', val)} type="number" />
          <PropInput label="Y" value={p.y} onChange={val => updateProp('y', val)} type="number" />
          <PropInput label="Width" value={p.width} onChange={val => updateProp('width', val)} type="number" />
          <PropInput label="Height" value={p.height} onChange={val => updateProp('height', val)} type="number" />
        </div>
      </CollapsibleSection>

      {/* (4) Color And Typography */}
      <CollapsibleSection title="Color And Typography" isOpenDefault={true}>
        <PropFxInput label="Background Color" value={p.backgroundColor} onChange={val => updateProp('backgroundColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundColor', newVal))} />
        <PropFxInput label="Background Gradient" value={p.backgroundGradient} onChange={val => updateProp('backgroundGradient', val)} placeholder="e.g. linear-gradient(...)" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal))} />
      </CollapsibleSection>

      {/* (5) Styling (includes Border Properties) */}
      {(p.borderStyle !== undefined || p.opacity !== undefined || p.boxShadow !== undefined || p.backgroundGradient !== undefined) && (
        <CollapsibleSection title="Styling" isOpenDefault={false}>
          {/* Border Properties */}
          {(p.borderStyle !== undefined) && (
            <>
              <PropFxInput label="Border Radius" value={p.borderRadius} onChange={val => updateProp('borderRadius', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderRadius', newVal))} />
              <PropFxInput label="Border Width" value={p.borderWidth} onChange={val => updateProp('borderWidth', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderWidth', newVal))} />
              <div className="grid grid-cols-2 gap-2.5">
                <PropFxInput label="Border Color" value={p.borderColor} onChange={val => updateProp('borderColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderColor', newVal))} />
                <PropSelect label="Border Style" value={p.borderStyle} onChange={val => updateProp('borderStyle', val)} options={[{value: 'none', label:'None'}, {value: 'solid', label: 'Solid'}, {value: 'dashed', label: 'Dashed'}, {value: 'dotted', label: 'Dotted'}]} />
              </div>
            </>
          )}
          {/* Styling Properties */}
          <PropFxInput label="Opacity" value={p.opacity} onChange={val => updateProp('opacity', val)} placeholder="e.g. 0.5 or {{theme.opacity}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('opacity', newVal))} />
          <PropFxInput label="Shadow" value={p.boxShadow} onChange={val => updateProp('boxShadow', val)} placeholder="e.g. 2px 2px 5px #ccc" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('boxShadow', newVal))} />
        </CollapsibleSection>
      )}

      {additionalPropertyGroups}
    </div>
  );
};

/**
 * Factory function to create Panel-based component plugins
 * This follows the Factory Pattern for easy extensibility
 * 
 * @param config Configuration for the Panel-based component
 * @returns A ComponentPlugin that extends Panel functionality
 */
export function createPanelPlugin<T extends PanelProps = PanelProps>(config: {
  type: ComponentType;
  label: string;
  icon: React.ReactElement;
  defaultProps: Partial<T>;
  /**
   * Optional fixed direction. If provided, the direction selector will be hidden.
   */
  fixedDirection?: 'horizontal' | 'vertical';
  /**
   * Optional custom renderer. If not provided, uses the base PanelRenderer.
   */
  customRenderer?: ComponentPlugin['renderer'];
  /**
   * Optional custom properties component. If not provided, uses the base PanelProperties.
   */
  customProperties?: ComponentPlugin['properties'];
  /**
   * Optional style extensions for the renderer
   */
  styleExtensions?: React.CSSProperties;
  /**
   * Optional custom property groups
   */
  customPropertyGroups?: React.ReactNode;
  additionalPropertyGroups?: React.ReactNode;
}): ComponentPlugin {
  const {
    type,
    label,
    icon,
    defaultProps,
    fixedDirection,
    customRenderer,
    customProperties,
    styleExtensions,
    customPropertyGroups,
    additionalPropertyGroups,
  } = config;

  // Create renderer - use custom if provided, otherwise use base with direction override
  // The renderer receives: component, mode, dataStore, onUpdateDataStore, actions, isEditingInline, onCommitInlineEdit, evaluationScope, children
  const renderer: ComponentPlugin['renderer'] = customRenderer || ((props: any) => (
    <PanelRenderer
      component={props.component as { props: PanelProps }}
      children={props.children}
      evaluationScope={props.evaluationScope}
      directionOverride={fixedDirection}
      styleExtensions={styleExtensions}
    />
  ));

  // Create properties - use custom if provided, otherwise use base with direction hidden if fixed
  // The properties receives: component, updateProp, dataSources, variables, evaluationScope, onOpenExpressionEditor, arrangeChildren
  const properties: ComponentPlugin['properties'] = customProperties || ((props: any) => (
    <PanelProperties
      component={props.component as { id?: string; props: PanelProps }}
      updateProp={props.updateProp as any}
      onOpenExpressionEditor={props.onOpenExpressionEditor}
      arrangeChildren={props.arrangeChildren}
      hideDirectionSelector={!!fixedDirection}
      customPropertyGroups={customPropertyGroups}
      additionalPropertyGroups={additionalPropertyGroups}
    />
  ));

  return {
    type,
    isContainer: true,
    paletteConfig: {
      label,
      icon,
      defaultProps: {
        ...commonStylingProps,
        ...defaultProps,
        // Set direction if fixed
        ...(fixedDirection && { direction: fixedDirection }),
      } as Partial<T>,
    },
    renderer,
    properties,
  };
}

/**
 * Base Panel Plugin
 * This is the standard Panel component that can be configured with any direction.
 */
export const PanelPlugin: ComponentPlugin = createPanelPlugin({
  type: ComponentType.PANEL,
  label: 'Panel',
  icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 4H20V20H4V4Z", stroke: "currentColor", strokeWidth: "2", strokeLinejoin: "round" })),
  defaultProps: {
    width: 300,
    height: 200,
    backgroundColor: '{{theme.colors.surface}}',
    backgroundGradient: '',
    direction: 'horizontal',
    justifyContent: 'start',
    alignItems: 'center',
  },
});
