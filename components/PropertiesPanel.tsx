
import React from 'react';
import { AppComponent, ComponentProps, DataSourceInstance, AppVariable } from '../types';
import { componentRegistry } from './component-registry/registry';

interface PropertiesPanelProps {
  components: AppComponent[];
  selectedComponentId: string | null;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dataSources: DataSourceInstance[];
  variables: AppVariable[];
  evaluationScope: Record<string, any>;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ components, selectedComponentId, onUpdate, width, isCollapsed, onToggleCollapse, dataSources, variables, evaluationScope, onOpenExpressionEditor }) => {
  const component = components.find(c => c.id === selectedComponentId);
  // FIX: Get component plugin from registry to access its config and properties renderer.
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

  // FIX: Get the correct properties renderer component from the plugin.
  const PropertiesRenderer = plugin?.properties;

  return (
    <aside style={{ width: `${width}px` }} className={`${commonPanelClasses} overflow-hidden`} role="region" aria-label="Properties" data-testid="properties-panel">
       <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="px-2 py-2">
            <h3 id="properties-heading" className="text-md font-semibold text-gray-800">{component && plugin ? plugin.paletteConfig.label : 'Properties'}</h3>
            {component && <p className="text-xs text-gray-400 mt-1 break-words">ID: {component.id}</p>}
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
      <div className="p-2 overflow-y-auto" aria-labelledby="properties-heading">
        {!component || !PropertiesRenderer ? (
             <p className="text-gray-500 text-sm text-center p-4">Select a component to see its properties.</p>
        ) : (
            <PropertiesRenderer 
                component={component}
                updateProp={(key: any, value: any) => onUpdate(component.id, { [key]: value })}
                dataSources={dataSources}
                variables={variables}
                evaluationScope={evaluationScope}
                onOpenExpressionEditor={onOpenExpressionEditor}
            />
        )}
      </div>
    </aside>
  );
};