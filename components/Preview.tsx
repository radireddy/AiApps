


import React, { useMemo, useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableSize, setAvailableSize] = useState({ width: 1000, height: 600 });
  
  const mainPageComponents = components.filter(c => c.pageId === mainPageId);
  const rootComponents = mainPageComponents.filter(c => !c.parentId);

  // Measure available container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Account for padding (p-4 sm:p-8 = 16px on mobile, 32px on desktop)
        const padding = window.innerWidth >= 640 ? 64 : 32; // sm breakpoint
        setAvailableSize({
          width: Math.max(1000, rect.width - padding),
          height: Math.max(600, rect.height - padding),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate raw content bounds (independent of available space)
  const rawContentBounds = useMemo(() => {
    const getAbsolutePosition = (comp: typeof components[0], allComps: typeof components): { x: number; y: number } => {
      let x = comp.props.x as number;
      let y = comp.props.y as number;
      let currentParentId = comp.parentId;
      
      while (currentParentId) {
        const parent = allComps.find(p => p.id === currentParentId);
        if (parent) {
          x += parent.props.x as number;
          y += parent.props.y as number;
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }
      
      return { x, y };
    };

    if (rootComponents.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const allComps = appDefinition.components;
    const processComponent = (comp: typeof components[0]) => {
      const pos = getAbsolutePosition(comp, allComps);
      const width = comp.props.width as number;
      const height = comp.props.height as number;
      
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + width);
      maxY = Math.max(maxY, pos.y + height);
      
      // Process children
      allComps.filter(c => c.parentId === comp.id).forEach(processComponent);
    };

    rootComponents.forEach(processComponent);

    // If no components found, use defaults
    if (minX === Infinity || minY === Infinity) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 600 };
    }

    return { minX, minY, maxX, maxY };
  }, [rootComponents, appDefinition.components]);

  // Calculate final preview container and content bounds
  const { containerSize, contentBounds } = useMemo(() => {
    const padding = 50;
    const contentWidth = rawContentBounds.maxX - rawContentBounds.minX + padding * 2;
    const contentHeight = rawContentBounds.maxY - rawContentBounds.minY + padding * 2;
    
    // Use available space if larger than content (to avoid scroll bars), 
    // otherwise use content size (to show all content)
    // This matches canvas behavior: use available space when possible
    const containerWidth = Math.max(availableSize.width, Math.max(1000, contentWidth));
    const containerHeight = Math.max(availableSize.height, Math.max(600, contentHeight));
    
    return {
      containerSize: {
        width: containerWidth,
        height: containerHeight,
      },
      contentBounds: {
        width: contentWidth,
        height: contentHeight,
        offsetX: rawContentBounds.minX - padding,
        offsetY: rawContentBounds.minY - padding,
      },
    };
  }, [rawContentBounds, availableSize]);

  // Create theme with lowercase aliases for consistency
  const themeWithLowercaseAliases = useMemo(() => {
    const theme = appDefinition.theme;
    return {
      ...theme,
      colors: {
        ...theme.colors,
        // Add lowercase aliases for camelCase properties
        onprimary: theme.colors.onPrimary,
        onsecondary: theme.colors.onSecondary,
      },
    };
  }, [appDefinition.theme]);

  // Re-build evaluation scope for preview mode
  const evaluationScope = useMemo(() => {
    // Combine all sources of state for the expression engine
    const scope = { console, theme: themeWithLowercaseAliases, ...dataStore, ...dataSourceContents, ...variableState };
    
    // Add component states to scope
    components.forEach(c => {
        const props = c.props as any;
        if (props.dataStoreKey) {
            scope[c.id] = {
                value: get(dataStore, props.dataStoreKey),
                ...props // Also expose all props (like placeholder, disabled, etc.)
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
  }, [themeWithLowercaseAliases, dataStore, components, dataSourceContents, variableState]);

  return (
    <div 
      ref={containerRef}
      className="flex-grow flex items-center justify-center bg-gray-200 p-4 sm:p-8 overflow-auto" 
      role="region" 
      aria-label="Application Preview"
    >
      <div
        className="relative shadow-2xl rounded-lg bg-white"
        style={{ 
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: containerSize.width > availableSize.width || containerSize.height > availableSize.height ? 'auto' : 'hidden',
        }}
      >
        <div 
          className="relative" 
          style={{ 
            backgroundColor: evaluationScope.theme?.colors?.background || '#ffffff',
            width: `${contentBounds.width}px`,
            height: `${contentBounds.height}px`,
            minWidth: `${contentBounds.width}px`,
            minHeight: `${contentBounds.height}px`,
            transform: `translate(${-contentBounds.offsetX}px, ${-contentBounds.offsetY}px)`,
          }}
        >
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