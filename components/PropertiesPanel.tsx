import React, { useMemo } from 'react';
import { AppComponent, ComponentProps, DataSourceInstance, AppVariable } from '../types';
import { componentRegistry } from './component-registry/registry';
import { AlignAction } from '../hooks/useAppData';
import { Tooltip } from './component-registry/common';
import { propertyRegistry } from './properties/registry';
import { PropertyTabs } from './properties/PropertyTabs';
import { PropertyMetadata, PropertyContext } from './properties/metadata';
import { ComponentType } from '../types';
// Import schemas to register them
import './properties/schemas';

interface PropertiesPanelProps {
  components: AppComponent[];
  selectedComponentIds: string[];
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dataSources: DataSourceInstance[];
  variables: AppVariable[];
  evaluationScope: Record<string, any>;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  onAlignAndDistribute: (action: AlignAction) => void;
}

const AlignButton: React.FC<{ action: AlignAction; tooltip: string; onAlign: (action: AlignAction) => void; children: React.ReactNode }> = ({ action, tooltip, onAlign, children }) => {
    return (
        <button
            onClick={() => onAlign(action)}
            className="p-2 w-full h-full flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label={tooltip}
        >
            {children}
        </button>
    );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  components, 
  selectedComponentIds, 
  onUpdate, 
  width, 
  isCollapsed, 
  onToggleCollapse, 
  dataSources, 
  variables, 
  evaluationScope, 
  onOpenExpressionEditor, 
  onAlignAndDistribute 
}) => {
  const isSingleSelection = selectedComponentIds.length === 1;
  const selectedComponents = components.filter(c => selectedComponentIds.includes(c.id));
  const component = isSingleSelection ? selectedComponents[0] : null;
  const plugin = component ? componentRegistry[component.type] : null;
  
  const commonPanelClasses = "bg-white border-l border-gray-200 flex flex-col shrink-0";

  if (isCollapsed) {
    return (
      <aside className={`w-10 items-center py-3 ${commonPanelClasses}`} role="region" aria-label="Properties">
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
            aria-label="Expand Properties"
            aria-expanded="false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    );
  }

  // Get property schema for selected component(s)
  const schema = useMemo(() => {
    if (selectedComponents.length === 0) return null;
    
    // For multi-select, find common schema or use first component's schema
    const componentTypes = selectedComponents.map(c => c.type);
    const uniqueTypes = [...new Set(componentTypes)];
    
    if (uniqueTypes.length === 1) {
      return propertyRegistry[uniqueTypes[0]];
    }
    
    // Multi-type selection - use first component's schema but filter to common properties
    return propertyRegistry[uniqueTypes[0]] || null;
  }, [selectedComponents]);

  // Check if we should use the old properties renderer (for backward compatibility)
  const useLegacyRenderer = useMemo(() => {
    if (!component || !plugin) return false;
    // Use legacy renderer if no schema is registered for this component type
    return !propertyRegistry[component.type] && !!plugin.properties;
  }, [component, plugin]);

  // Filter properties based on selection
  const visibleProperties = useMemo(() => {
    if (!schema) return [];
    
    if (isSingleSelection) {
      // Single selection - show all applicable properties
      return schema.properties.filter(prop => {
        if (prop.applicableTo === 'all') return true;
        if (Array.isArray(prop.applicableTo)) {
          return prop.applicableTo.includes(component!.type);
        }
        return true;
      });
    } else {
      // Multi-selection - only show properties with multiEditSupport !== 'none'
      const componentTypes = selectedComponents.map(c => c.type);
      return schema.properties.filter(prop => {
        // Check if property is common to all selected component types
        if (prop.applicableTo === 'all') {
          return prop.multiEditSupport !== 'none';
        }
        if (Array.isArray(prop.applicableTo)) {
          const isCommon = componentTypes.every(type => prop.applicableTo!.includes(type));
          return isCommon && prop.multiEditSupport !== 'none';
        }
        return false;
      });
    }
  }, [schema, isSingleSelection, selectedComponents, component]);

  // Get property value(s) - returns mixed indicator if values differ
  const getPropertyValue = (propertyId: string): any => {
    if (selectedComponents.length === 0) return undefined;
    
    const values = selectedComponents.map(c => {
      const props = c.props as any;
      return props[propertyId];
    });
    
    // Check if all values are the same
    const firstValue = values[0];
    const allSame = values.every(v => v === firstValue);
    
    return allSame ? firstValue : undefined; // undefined indicates mixed
  };

  // Check if property has mixed values
  const isPropertyMixed = (propertyId: string): boolean => {
    if (selectedComponents.length <= 1) return false;
    
    const values = selectedComponents.map(c => {
      const props = c.props as any;
      return props[propertyId];
    });
    
    const firstValue = values[0];
    return !values.every(v => v === firstValue);
  };

  // Get validation error for a property
  const getPropertyError = (property: PropertyMetadata): string | undefined => {
    // Basic validation - can be extended
    const value = getPropertyValue(property.id);
    
    if (property.validationRules) {
      for (const rule of property.validationRules) {
        if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
          return rule.message || `${property.label} is required`;
        }
        if (rule.type === 'custom' && rule.validator) {
          const result = rule.validator(value);
          if (result !== true) {
            return typeof result === 'string' ? result : rule.message || 'Validation failed';
          }
        }
      }
    }
    
    return undefined;
  };

  // Handle property update
  const handlePropertyUpdate = (propertyId: string, value: any) => {
    if (isSingleSelection && component) {
      onUpdate(component.id, { [propertyId]: value } as Partial<ComponentProps>);
    } else {
      // Update all selected components
      selectedComponents.forEach(comp => {
        onUpdate(comp.id, { [propertyId]: value } as Partial<ComponentProps>);
      });
    }
  };

  // Create context for property inputs
  const propertyContext: PropertyContext = useMemo(() => ({
    component: component ? { id: component.id, type: component.type, props: component.props } : undefined,
    components: selectedComponents.map(c => ({ id: c.id, type: c.type, props: c.props })),
    dataSources,
    variables,
    evaluationScope,
    isMultiSelect: !isSingleSelection,
  }), [component, selectedComponents, dataSources, variables, evaluationScope, isSingleSelection]);

  let content;
  if (selectedComponentIds.length > 1) {
    // Multi-selection UI with align/distribute tools
    content = (
      <div>
        <p className="text-gray-500 text-sm text-center p-4">{selectedComponentIds.length} components selected.</p>
        <div className="border-t border-gray-200 p-2">
          <h4 className="text-xs font-semibold text-gray-600 mb-2 px-1">Align</h4>
          <div className="grid grid-cols-6 gap-1">
            <Tooltip text="Align left edges & stack vertically">
                <AlignButton action="align-left" tooltip="Align left edges & stack vertically" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 2V14" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="3" width="5" height="4" fill="currentColor" fillOpacity="0.5"/><rect x="4" y="9" width="8" height="4" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
             <Tooltip text="Align horizontal centers & stack vertically">
                <AlignButton action="align-center-h" tooltip="Align horizontal centers & stack vertically" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2V14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><rect x="2.5" y="3" width="5" height="4" fill="currentColor" fillOpacity="0.5"/><rect x="4" y="9" width="8" height="4" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
             <Tooltip text="Align right edges & stack vertically">
                <AlignButton action="align-right" tooltip="Align right edges & stack vertically" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 2V14" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="3" width="5" height="4" fill="currentColor" fillOpacity="0.5"/><rect x="4" y="9" width="8" height="4" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
             <Tooltip text="Align top edges & stack horizontally">
                <AlignButton action="align-top" tooltip="Align top edges & stack horizontally" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 1.5H14" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="4" width="4" height="5" fill="currentColor" fillOpacity="0.5"/><rect x="9" y="4" width="4" height="8" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
             <Tooltip text="Align vertical centers & stack horizontally">
                <AlignButton action="align-center-v" tooltip="Align vertical centers & stack horizontally" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><rect x="3" y="2.5" width="4" height="5" fill="currentColor" fillOpacity="0.5"/><rect x="9" y="4" width="4" height="8" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
             <Tooltip text="Align bottom edges & stack horizontally">
                <AlignButton action="align-bottom" tooltip="Align bottom edges & stack horizontally" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 14.5H14" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="7" width="4" height="5" fill="currentColor" fillOpacity="0.5"/><rect x="9" y="4" width="4" height="8" fill="currentColor" fillOpacity="0.5"/></svg>
                </AlignButton>
            </Tooltip>
          </div>
        </div>
        <div className="border-t border-gray-200 p-2">
          <h4 className="text-xs font-semibold text-gray-600 mb-2 px-1">Distribute</h4>
          <div className="grid grid-cols-6 gap-1">
            <Tooltip text="Distribute horizontal spacing">
                <AlignButton action="distribute-h" tooltip="Distribute horizontal spacing" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="4" width="2" height="8" fill="currentColor"/><rect x="1" y="4" width="2" height="8" fill="currentColor"/><rect x="7" y="6" width="2" height="4" fill="currentColor"/></svg>
                </AlignButton>
            </Tooltip>
            <Tooltip text="Distribute vertical spacing">
                <AlignButton action="distribute-v" tooltip="Distribute vertical spacing" onAlign={onAlignAndDistribute}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="1" width="8" height="2" fill="currentColor"/><rect x="4" y="13" width="8" height="2" fill="currentColor"/><rect x="6" y="7" width="4" height="2" fill="currentColor"/></svg>
                </AlignButton>
            </Tooltip>
          </div>
        </div>
        <div className="border-t border-gray-200 p-2">
             <h4 className="text-xs font-semibold text-gray-600 mb-2 px-1">Match Size</h4>
             <div className="grid grid-cols-6 gap-1">
                <Tooltip text="Match width (first selected)">
                    <AlignButton action="match-width" tooltip="Match width (first selected)" onAlign={onAlignAndDistribute}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="12" height="4" fill="currentColor" fillOpacity="0.5"/><rect x="2" y="9" width="12" height="5" fill="currentColor" fillOpacity="0.5"/></svg>
                    </AlignButton>
                </Tooltip>
                <Tooltip text="Match height (first selected)">
                    <AlignButton action="match-height" tooltip="Match height (first selected)" onAlign={onAlignAndDistribute}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="2" width="4" height="12" fill="currentColor" fillOpacity="0.5"/><rect x="9" y="2" width="5" height="12" fill="currentColor" fillOpacity="0.5"/></svg>
                    </AlignButton>
                </Tooltip>
             </div>
        </div>
        
        {/* Show common properties if schema exists */}
        {schema && visibleProperties.length > 0 && (
          <div className="border-t border-gray-200 mt-4">
            <PropertyTabs
              tabs={schema.tabs || []}
              groups={schema.groups || []}
              properties={visibleProperties}
              context={propertyContext}
              onUpdate={handlePropertyUpdate}
              onOpenExpressionEditor={onOpenExpressionEditor}
              getValue={getPropertyValue}
              getError={(id) => {
                const prop = visibleProperties.find(p => p.id === id);
                return prop ? getPropertyError(prop) : undefined;
              }}
              isMixed={isPropertyMixed}
            />
          </div>
        )}
      </div>
    );
  } else if (!component) {
    content = <p className="text-gray-500 text-sm text-center p-4">Select a component to see its properties.</p>;
  } else if (useLegacyRenderer && plugin) {
    // Fallback to legacy properties renderer for components without schemas
    const PropertiesRenderer = plugin.properties;
    content = (
      <PropertiesRenderer 
        component={component}
        updateProp={(key: any, value: any) => onUpdate(component.id, { [key]: value })}
        dataSources={dataSources}
        variables={variables}
        evaluationScope={evaluationScope}
        onOpenExpressionEditor={onOpenExpressionEditor}
      />
    );
  } else if (!schema) {
    content = <p className="text-gray-500 text-sm text-center p-4">Select a component to see its properties.</p>;
  } else {
    // Single selection - show full property schema
    content = (
      <PropertyTabs
        tabs={schema.tabs || []}
        groups={schema.groups || []}
        properties={visibleProperties}
        context={propertyContext}
        onUpdate={handlePropertyUpdate}
        onOpenExpressionEditor={onOpenExpressionEditor}
        getValue={getPropertyValue}
        getError={(id) => {
          const prop = visibleProperties.find(p => p.id === id);
          return prop ? getPropertyError(prop) : undefined;
        }}
        isMixed={isPropertyMixed}
      />
    );
  }

  return (
    <aside style={{ width: `${width}px` }} className={commonPanelClasses} role="region" aria-label="Properties" data-testid="properties-panel">
       <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="px-2 py-2">
            <h3 id="properties-heading" className="text-md font-semibold text-gray-800">
              {component && plugin ? plugin.paletteConfig.label : 'Properties'}
            </h3>
            {component && <p className="text-xs text-gray-400 mt-1 break-words">ID: {component.id}</p>}
            {!isSingleSelection && selectedComponents.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{selectedComponents.length} components selected</p>
            )}
        </div>
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800"
            aria-label="Collapse Properties"
            aria-expanded="true"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
        </button>
       </div>
      <div className="p-2 overflow-y-auto flex-1" aria-labelledby="properties-heading">
        {content}
      </div>
    </aside>
  );
};
