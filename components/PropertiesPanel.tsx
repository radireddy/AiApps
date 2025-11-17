
import React from 'react';
import { AppComponent, ComponentProps, DataSourceInstance, AppVariable } from '../types';
import { componentRegistry } from './component-registry/registry';
import { AlignAction } from '../hooks/useAppData';
import { Tooltip } from './component-registry/common';

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

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ components, selectedComponentIds, onUpdate, width, isCollapsed, onToggleCollapse, dataSources, variables, evaluationScope, onOpenExpressionEditor, onAlignAndDistribute }) => {
  const isSingleSelection = selectedComponentIds.length === 1;
  const component = isSingleSelection ? components.find(c => c.id === selectedComponentIds[0]) : null;
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

  const PropertiesRenderer = plugin?.properties;
  
  let content;
  if (selectedComponentIds.length > 1) {
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
      </div>
    );
  } else if (!component || !PropertiesRenderer) {
    content = <p className="text-gray-500 text-sm text-center p-4">Select a component to see its properties.</p>;
  } else {
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
  }

  return (
    <aside style={{ width: `${width}px` }} className={commonPanelClasses} role="region" aria-label="Properties" data-testid="properties-panel">
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
        {content}
      </div>
    </aside>
  );
};