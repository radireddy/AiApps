


import React, { useMemo } from 'react';
import { AppDefinition, DataStore, ActionHandlers, ComponentType, TableProps } from '../types';
import { RenderedComponent } from './RenderedComponent';
import { get } from '../utils/data-helpers';

interface PreviewProps {
  appDefinition: AppDefinition;
  onUpdateDataStore: (key: string, value: any) => void;
  actions: ActionHandlers;
  variableState: Record<string, any>;
  dataSourceContents: Record<string, any[]>;
}

export const Preview: React.FC<PreviewProps> = ({ appDefinition, onUpdateDataStore, actions, variableState, dataSourceContents }) => {
  const { components, dataStore, mainPageId } = appDefinition;
  
  const mainPageComponents = components.filter(c => c.pageId === mainPageId);
  const rootComponents = mainPageComponents.filter(c => !c.parentId);

  // Re-build evaluation scope for preview mode
  const evaluationScope = useMemo(() => {
    // Combine all sources of state for the expression engine
    const scope = { console, theme: appDefinition.theme, ...dataStore, ...dataSourceContents, ...variableState };
    
    // Add component states to scope
    components.forEach(c => {
        const props = c.props as any;
        if (props.dataStoreKey) {
            scope[c.id] = {
                value: get(dataStore, props.dataStoreKey)
            }
        } else {
             scope[c.id] = {
                ...props
            }
        }
    });

    // Add selected record of tables to scope
    components.filter(c => c.type === ComponentType.TABLE).forEach(c => {
        const props = c.props as TableProps;
        if (props.selectedRecordKey) {
            scope[c.id] = {
                 ...scope[c.id],
                selectedRecord: get(dataStore, props.selectedRecordKey)
            }
        }
    });

    return scope;
  }, [appDefinition.theme, dataStore, components, dataSourceContents, variableState]);

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-200 p-4 sm:p-8 overflow-hidden" role="region" aria-label="Application Preview">
      <div
        className="relative w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-white"
        style={{ 
          aspectRatio: '1000 / 600',
          maxWidth: '1000px',
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundColor: evaluationScope.theme.colors.background }}>
            {rootComponents.map(comp => (
              <RenderedComponent
                key={comp.id}
                component={comp}
                allComponents={appDefinition.components}
                // FIX: The prop 'selectedComponentId' does not exist on RenderedComponent. It was renamed to 'selectedComponentIds' and its type changed to string[]. In preview mode, no components are selected, so an empty array is the correct value.
                selectedComponentIds={[]}
                onSelect={() => {}} // No-op in preview
                onUpdate={() => {}} // No-op in preview
                // FIX: The `onUpdateComponents` prop is required by RenderedComponent but was missing. It's a no-op in preview mode.
                onUpdateComponents={() => {}}
                onDelete={() => {}} // No-op in preview
                onDrop={() => {}}   // No-op in preview
                mode="preview"
                dataStore={dataStore}
                onUpdateDataStore={onUpdateDataStore}
                actions={actions}
                evaluationScope={evaluationScope}
                onReparentCheck={() => {}} // FIX: This prop is required but is a no-op in preview mode.
              />
            ))}
        </div>
      </div>
    </div>
  );
};