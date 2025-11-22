import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppDefinition, AppComponent, ComponentType, DataStore, ComponentProps, ActionHandlers, DataSourceInstance, TableProps, AppVariable, Theme, AppPage } from '@/types';
import { componentRegistry } from '@/components/component-registry/registry';
import { dataSourceRegistry } from '@/data-sources/registry';
import { get, set } from '@/utils/data-helpers';

const parseInitialValue = (value: any, type: AppVariable['type']) => {
  try {
    switch(type) {
      case 'string': return String(value);
      case 'number': return Number(value);
      case 'boolean': return value === 'true' || value === true;
      case 'object':
      case 'array': return JSON.parse(value);
      default: return value;
    }
  } catch(e) {
    console.error("Invalid initial value for variable:", e);
    return type === 'object' ? {} : (type === 'array' ? [] : '');
  }
};

export type AlignAction =
  | 'align-left' | 'align-center-h' | 'align-right'
  | 'align-top' | 'align-center-v' | 'align-bottom'
  | 'distribute-h' | 'distribute-v'
  | 'match-width' | 'match-height';


/**
 * The core hook for managing the application state in the Editor.
 * It handles the `AppDefinition`, component CRUD operations, selection state,
 * data binding, and interactions with data sources.
 * 
 * @param initialAppDefinition - The initial state of the app loaded from storage.
 * @param onSave - Callback function triggered when the app state changes (debounced).
 */
export const useAppData = (initialAppDefinition: AppDefinition, onSave: (appDef: AppDefinition) => void) => {
  const [appDefinition, setAppDefinitionState] = useState<AppDefinition>(initialAppDefinition);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>(initialAppDefinition.mainPageId);
  
  const { components, dataStore, dataSources: dataSourceInstances, variables, theme } = appDefinition;

  // --- Data Sources State Management ---
  const [dataSourceContents, setDataSourceContents] = useState<Record<string, any[]>>({});
  // --- App Variables State ---
  const [variableState, setVariableState] = useState<Record<string, any>>({});


  /**
   * Refreshes the data for a specific data source instance.
   * Fetches records from the provider and updates the local state.
   */
  const refreshDataSource = useCallback(async (instanceId: string) => {
  const instance = appDefinition.dataSources.find(ds => ds.id === instanceId);
  if (!instance) return;
  const provider = dataSourceRegistry[instance.providerId];
  if (!provider) return;

  const records = await provider.getRecords(instance);
  setDataSourceContents(prev => ({ ...prev, [instance.id]: records }));
  }, [appDefinition]);
  
  // Refresh all data sources on initial load or when instances change
  useEffect(() => {
  appDefinition.dataSources.forEach(instance => {
    refreshDataSource(instance.id);
  });
  }, [appDefinition.dataSources, refreshDataSource]);
  
  // Initialize variable state when app definition changes
  useEffect(() => {
    const newVarState: Record<string, any> = {};
    appDefinition.variables.forEach(v => {
      newVarState[v.name] = parseInitialValue(v.initialValue, v.type);
    });
    setVariableState(newVarState);
  }, [appDefinition.variables]);

  // Autosave app on any change
  const debounceTimeout = useRef<number | null>(null);
  useEffect(() => {
  if (debounceTimeout.current) {
    clearTimeout(debounceTimeout.current);
  }
  debounceTimeout.current = window.setTimeout(() => {
    onSave(appDefinition);
  }, 1000); // 1 second debounce

  return () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  };
  }, [appDefinition, onSave]);


  const setAppDefinition = useCallback((definition: AppDefinition) => {
  setAppDefinitionState(definition);
  setSelectedComponentIds([]);
  setCurrentPageId(definition.mainPageId);
  }, []);

  // If the parent passes a new initialAppDefinition (e.g. via rerender in tests),
  // update internal state to keep the hook in sync. Tests rely on rerendering
  // with a changed app object.
  useEffect(() => {
    setAppDefinitionState(initialAppDefinition);
    setSelectedComponentIds([]);
    setCurrentPageId(initialAppDefinition.mainPageId);
  }, [initialAppDefinition]);
  
  const addDataSource = useCallback((instance: DataSourceInstance) => {
  setAppDefinitionState(prev => ({
    ...prev,
    dataSources: [...prev.dataSources, instance]
  }));
  }, []);

  const addVariable = useCallback((variable: AppVariable) => {
  if (appDefinition.variables.some(v => v.name === variable.name)) {
    alert('A variable with this name already exists.');
    return;
  }
  setAppDefinitionState(prev => ({
    ...prev,
    variables: [...prev.variables, variable]
  }));
  }, [appDefinition.variables]);
  
  const updateTheme = useCallback((category: keyof Theme, prop: string, value: string) => {
  setAppDefinitionState(prev => {
    const newTheme = JSON.parse(JSON.stringify(prev.theme)); // Deep copy to ensure reactivity
    (newTheme[category] as any)[prop] = value;
    return { ...prev, theme: newTheme };
  });
  }, []);
  
  const applyTheme = useCallback((newTheme: Theme) => {
    setAppDefinitionState(prev => ({
      ...prev,
      theme: newTheme,
    }));
  }, []);

  /**
   * Adds a new component to the canvas.
   * Automatically initializes related data store keys if configured in default props.
   */
  const addComponent = useCallback((type: ComponentType, position: { x: number; y: number }, parentId: string | null = null, pageId: string) => {
    const componentPlugin = componentRegistry[type];
    if (!componentPlugin) return;
      setAppDefinitionState(prev => {
        const newComp: AppComponent = {
          id: `${type}_${Date.now()}`,
          type,
          props: {
            ...componentPlugin.paletteConfig.defaultProps,
            ...position,
          } as ComponentProps,
          parentId,
          pageId,
        };

        let newDataStore = { ...prev.dataStore };
        const props = newComp.props as any;
        if (props.dataStoreKey && !get(newDataStore, props.dataStoreKey)) {
          let defaultValue: any = '';
          if (type === ComponentType.CHECKBOX || type === ComponentType.SWITCH) {
            defaultValue = false;
          }
          newDataStore = set(newDataStore, props.dataStoreKey, defaultValue);
        }

        // Auto-position within parent using the freshest prev state
        if (parentId) {
          const parent = prev.components.find(c => c.id === parentId);
          if (parent) {
            const parentProps: any = parent.props as any;
            const existingChildren = prev.components.filter(c => c.parentId === parentId && c.pageId === pageId);
            const GAP = 10;

            // Build an array including the new component and compute positions for all children
            const allChildren = [...existingChildren, newComp];

            if ((parentProps.direction || 'horizontal') === 'horizontal') {
              // compute positions left-to-right
              let currentX = 0;
              const arranged = allChildren.map((c, idx) => {
                const w = (c.props as any).width || 0;
                const h = (c.props as any).height || 0;
                const y = Math.max(0, Math.floor(((parentProps.height || 0) - h) / 2));
                const x = currentX;
                currentX += w + GAP;
                return { id: c.id, x, y };
              });

              (newComp.props as any).x = arranged.find(a => a.id === newComp.id)!.x;
              (newComp.props as any).y = arranged.find(a => a.id === newComp.id)!.y;

              (newComp as any)._arranged = arranged.reduce((m, a) => { m[a.id] = { x: a.x, y: a.y }; return m; }, {} as Record<string, any>);
            } else {
              // vertical stacking
              let currentY = 0;
              const arranged = allChildren.map((c) => {
                const w = (c.props as any).width || 0;
                const h = (c.props as any).height || 0;
                const x = Math.max(0, Math.floor(((parentProps.width || 0) - w) / 2));
                const y = currentY;
                currentY += h + GAP;
                return { id: c.id, x, y };
              });
              (newComp.props as any).x = arranged.find(a => a.id === newComp.id)!.x;
              (newComp.props as any).y = arranged.find(a => a.id === newComp.id)!.y;
              (newComp as any)._arranged = arranged.reduce((m, a) => { m[a.id] = { x: a.x, y: a.y }; return m; }, {} as Record<string, any>);
            }
          }
        }

        // If we computed arranged positions, apply them to existing children before returning
        let finalComponents = [...prev.components];
        const arrangedMap = (newComp as any)._arranged as Record<string, { x: number; y: number }> | undefined;
        if (arrangedMap) {
          finalComponents = finalComponents.map(c => {
            if (c.parentId === parentId && arrangedMap[c.id]) {
              return { ...c, props: { ...c.props, ...(arrangedMap[c.id]) } };
            }
            return c;
          });
        }

        return {
          ...prev,
          components: [...finalComponents, newComp],
          dataStore: newDataStore,
        };
      });
    }, [dataStore]);

  const updateComponent = useCallback((id: string, newProps: Partial<ComponentProps>) => {
  setAppDefinitionState(prev => ({
    ...prev,
    components: prev.components.map(c =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    )
  }));
  }, []);
  
  const updateComponents = useCallback((updates: Array<{ id: string; props: Partial<ComponentProps> }>) => {
  setAppDefinitionState(prev => {
    const updatesMap = new Map(updates.map(u => [u.id, u.props]));
    return {
      ...prev,
      components: prev.components.map(c => {
        if (updatesMap.has(c.id)) {
          return { ...c, props: { ...c.props, ...updatesMap.get(c.id) } };
        }
        return c;
      }),
    };
  });
  }, []);

  // FIX: Added 'React' import to resolve 'React.MouseEvent' type error.
  const selectComponent = useCallback((id: string, e?: React.MouseEvent) => {
  if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
    setSelectedComponentIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(id)) {
        newIds.delete(id); // Deselect if already selected
      } else {
        newIds.add(id); // Select if not selected
      }
      return Array.from(newIds);
    });
  } else {
    setSelectedComponentIds([id]); // Default behavior: select only this one
  }
  }, []);

  const deselectAllComponents = useCallback(() => {
  setSelectedComponentIds([]);
  }, []);
  
  const deleteComponent = useCallback((id: string) => {
  setAppDefinitionState(prev => {
    const idsToDelete = new Set<string>([id]);
    const findChildren = (parentId: string) => {
      prev.components.forEach(c => {
        if(c.parentId === parentId) {
          idsToDelete.add(c.id);
          findChildren(c.id);
        }
      });
    };
    findChildren(id);
        
    return {
      ...prev,
      components: prev.components.filter(c => !idsToDelete.has(c.id)),
    }
  });
  setSelectedComponentIds(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const deleteSelectedComponents = useCallback(() => {
  if (selectedComponentIds.length === 0) return;
  setAppDefinitionState(prev => {
    const allIdsToDelete = new Set<string>();
    const findChildren = (parentId: string) => {
      prev.components.forEach(c => {
        if(c.parentId === parentId) {
          allIdsToDelete.add(c.id);
          findChildren(c.id);
        }
      });
    };
    selectedComponentIds.forEach(id => {
      allIdsToDelete.add(id);
      findChildren(id);
    });
    return {
      ...prev,
      components: prev.components.filter(c => !allIdsToDelete.has(c.id)),
    }
  });
  setSelectedComponentIds([]);
  }, [selectedComponentIds]);

  const updateDataStore = useCallback((key: string, value: any) => {
  setAppDefinitionState(prev => ({
    ...prev,
    dataStore: set(prev.dataStore, key, value)
    }));
  }, []);

  /**
   * Handles the complex logic of moving a component into or out of a container.
   * It calculates the new relative coordinates based on the component's absolute position
   * and the new parent's position.
   * 
   * @param componentId - The ID of the component being moved.
   */
  const reparentComponent = useCallback((componentId: string) => {
  // Helper to get the absolute position of a component
  const getAbsolutePosition = (cId: string, allComponents: AppComponent[]): { x: number, y: number } => {
    const component = allComponents.find(c => c.id === cId);
    if (!component) return { x: 0, y: 0 };

    let absX = component.props.x;
    let absY = component.props.y;
    let currentParentId = component.parentId;
    while (currentParentId) {
      const parent = allComponents.find(p => p.id === currentParentId);
      if (parent) {
        absX += parent.props.x;
        absY += parent.props.y;
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
    return { x: absX, y: absY };
  };
    
  // Helper to check if a component is a descendant of another
  const isDescendant = (childId: string, parentId: string, allComponents: AppComponent[]): boolean => {
    const child = allComponents.find(c => c.id === childId);
    if (!child || !child.parentId) return false;
    if (child.parentId === parentId) return true;
    return isDescendant(child.parentId, parentId, allComponents);
  };

  setAppDefinitionState(prev => {
    const allComponents = prev.components;
    const componentToReparent = allComponents.find(c => c.id === componentId);
    if (!componentToReparent) return prev;

    const { x: absoluteX, y: absoluteY } = getAbsolutePosition(componentId, allComponents);
    const centerX = absoluteX + componentToReparent.props.width / 2;
    const centerY = absoluteY + componentToReparent.props.height / 2;

    const potentialParents = allComponents.filter(p => {
      const plugin = componentRegistry[p.type];
      // Cannot be its own parent or child, and must be on the same page
      return plugin.isContainer && p.id !== componentId && !isDescendant(p.id, componentId, allComponents) && p.pageId === componentToReparent.pageId;
    });

    let newParent: AppComponent | null = null;
    let smallestArea = Infinity;

    for (const parent of potentialParents) {
      const { x: parentAbsX, y: parentAbsY } = getAbsolutePosition(parent.id, allComponents);
      if (
        centerX >= parentAbsX &&
        centerX <= parentAbsX + parent.props.width &&
        centerY >= parentAbsY &&
        centerY <= parentAbsY + parent.props.height
      ) {
        const area = parent.props.width * parent.props.height;
        if (area < smallestArea) {
          smallestArea = area;
          newParent = parent;
        }
      }
    }
        
    const oldParentId = componentToReparent.parentId || null;
    const newParentId = newParent ? newParent.id : null;

    if (oldParentId === newParentId) {
      return prev; // No change needed
    }

    const newParentAbsPos = newParent ? getAbsolutePosition(newParent.id, allComponents) : { x: 0, y: 0 };
    const newRelativeX = absoluteX - newParentAbsPos.x;
    const newRelativeY = absoluteY - newParentAbsPos.y;

    const updatedComponents = allComponents.map(c => {
      if (c.id === componentId) {
        return {
          ...c,
          parentId: newParentId,
          props: {
            ...c.props,
            x: newRelativeX,
            y: newRelativeY,
          },
        };
      }
      return c;
    });

    return { ...prev, components: updatedComponents };
  });
  }, [setAppDefinitionState]);

    // FIX: Alignment & distribution helper for selected components
    const alignAndDistribute = useCallback((action: AlignAction) => {
    if (selectedComponentIds.length < 2) return;

    const componentsMap = new Map<string, AppComponent>();
    components.forEach(c => componentsMap.set(c.id, c));
    const selectedComponents = selectedComponentIds.map(id => componentsMap.get(id)).filter((c): c is AppComponent => !!c);
    
    if (selectedComponents.length < 2) return;

    const updates: Array<{ id: string; props: Partial<ComponentProps> }> = [];
    const GAP = 10;

    const boundingBox = selectedComponents.reduce((acc, c) => ({
      x1: Math.min(acc.x1, c.props.x),
      y1: Math.min(acc.y1, c.props.y),
      x2: Math.max(acc.x2, c.props.x + c.props.width),
      y2: Math.max(acc.y2, c.props.y + c.props.height)
    }), { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });

    switch (action) {
      case 'align-left': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
        let currentY = boundingBox.y1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: boundingBox.x1, y: currentY } });
          currentY += c.props.height + GAP;
        });
        break;
      }
      case 'align-center-h': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
        const centerX = boundingBox.x1 + (boundingBox.x2 - boundingBox.x1) / 2;
        let currentY = boundingBox.y1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: centerX - c.props.width / 2, y: currentY } });
          currentY += c.props.height + GAP;
        });
        break;
      }
      case 'align-right': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
        let currentY = boundingBox.y1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: boundingBox.x2 - c.props.width, y: currentY } });
          currentY += c.props.height + GAP;
        });
        break;
      }
      case 'align-top': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
        let currentX = boundingBox.x1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: currentX, y: boundingBox.y1 } });
          currentX += c.props.width + GAP;
        });
        break;
      }
      case 'align-center-v': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
        const centerY = boundingBox.y1 + (boundingBox.y2 - boundingBox.y1) / 2;
        let currentX = boundingBox.x1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: currentX, y: centerY - c.props.height / 2 } });
          currentX += c.props.width + GAP;
        });
        break;
      }
      case 'align-bottom': {
        const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
        let currentX = boundingBox.x1;
        sorted.forEach(c => {
          updates.push({ id: c.id, props: { x: currentX, y: boundingBox.y2 - c.props.height } });
          currentX += c.props.width + GAP;
        });
        break;
      }
      case 'distribute-h': {
        if (selectedComponents.length > 2) {
          const sorted = [...selectedComponents].sort((a, b) => a.props.x - b.props.x);
          const totalWidth = sorted.reduce((sum, c) => sum + c.props.width, 0);
          const totalSpace = sorted[sorted.length - 1].props.x + sorted[sorted.length - 1].props.width - sorted[0].props.x;
          const totalGap = totalSpace - totalWidth;
          const gap = totalGap / (selectedComponents.length - 1);

          let currentX = sorted[0].props.x;
          updates.push({ id: sorted[0].id, props: { x: currentX } });
          for (let i = 1; i < sorted.length; i++) {
            currentX += sorted[i - 1].props.width + gap;
            updates.push({ id: sorted[i].id, props: { x: currentX } });
          }
        }
        break;
      }
      case 'distribute-v': {
         if (selectedComponents.length > 2) {
          const sorted = [...selectedComponents].sort((a, b) => a.props.y - b.props.y);
          const totalHeight = sorted.reduce((sum, c) => sum + c.props.height, 0);
          const totalSpace = sorted[sorted.length - 1].props.y + sorted[sorted.length - 1].props.height - sorted[0].props.y;
          const totalGap = totalSpace - totalHeight;
          const gap = totalGap / (selectedComponents.length - 1);

          let currentY = sorted[0].props.y;
          updates.push({ id: sorted[0].id, props: { y: currentY } });
          for (let i = 1; i < sorted.length; i++) {
            currentY += sorted[i - 1].props.height + gap;
            updates.push({ id: sorted[i].id, props: { y: currentY } });
          }
        }
        break;
      }
      case 'match-width': {
        const referenceComponent = componentsMap.get(selectedComponentIds[0]);
        if (!referenceComponent) break;
        const refWidth = referenceComponent.props.width;
        selectedComponents.forEach(c => {
          if (c.id !== referenceComponent.id) {
            updates.push({ id: c.id, props: { width: refWidth } });
          }
        });
        break;
      }
      case 'match-height': {
        const referenceComponent = componentsMap.get(selectedComponentIds[0]);
        if (!referenceComponent) break;
        const refHeight = referenceComponent.props.height;
        selectedComponents.forEach(c => {
          if (c.id !== referenceComponent.id) {
            updates.push({ id: c.id, props: { height: refHeight } });
          }
        });
        break;
      }
    }
    
    if (updates.length > 0) {
      updateComponents(updates);
    }
    }, [selectedComponentIds, components, updateComponents]);

    const arrangeContainerChildren = useCallback((panelId: string, opts: { direction?: string; justifyContent?: string; alignItems?: string }) => {
      const parent = appDefinition.components.find(c => c.id === panelId);
      if (!parent) return;
      const panelProps: any = parent.props;
      const direction = (opts.direction as any) || panelProps.direction || 'horizontal';
      const justify = (opts.justifyContent as any) || panelProps.justifyContent || 'start';
      const align = (opts.alignItems as any) || panelProps.alignItems || 'center';

      const children = appDefinition.components.filter(c => c.parentId === panelId && c.pageId === parent.pageId);
      if (children.length === 0) return;

      const updates: Array<{ id: string; props: Partial<ComponentProps> }> = [];
      const GAP = 10;

      if (direction === 'horizontal') {
        const containerWidth = panelProps.width || 0;
        const containerHeight = panelProps.height || 0;
        const totalWidth = children.reduce((s, c) => s + ((c.props as any).width || 0), 0);
        let gap = GAP;
        if (justify === 'space-between' && children.length > 1) {
          gap = (containerWidth - totalWidth) / (children.length - 1);
          if (!isFinite(gap) || gap < 0) gap = GAP;
        }

        const totalWithGaps = totalWidth + gap * (children.length - 1);
        let startX = 0;
        if (justify === 'center') startX = Math.max(0, Math.floor((containerWidth - totalWithGaps) / 2));
        else if (justify === 'end') startX = Math.max(0, Math.floor(containerWidth - totalWithGaps));

        const sorted = [...children].sort((a, b) => (a.props as any).x - (b.props as any).x);
        let currentX = startX;
        for (const c of sorted) {
          const cp: any = c.props;
          let newY = 0;
          if (align === 'center') newY = Math.floor((containerHeight - (cp.height || 0)) / 2);
          else if (align === 'end') newY = Math.max(0, (containerHeight - (cp.height || 0)));
          const propsUpdate: any = { x: Math.max(0, Math.floor(currentX)), y: Math.max(0, Math.floor(newY)) };
          if (align === 'stretch') {
            propsUpdate.y = 0;
            propsUpdate.height = containerHeight;
          }
          updates.push({ id: c.id, props: propsUpdate });
          currentX += (cp.width || 0) + gap;
        }
      } else {
        const containerWidth = panelProps.width || 0;
        const containerHeight = panelProps.height || 0;
        const totalHeight = children.reduce((s, c) => s + ((c.props as any).height || 0), 0);
        let gap = GAP;
        if (justify === 'space-between' && children.length > 1) {
          gap = (containerHeight - totalHeight) / (children.length - 1);
          if (!isFinite(gap) || gap < 0) gap = GAP;
        }

        const totalWithGaps = totalHeight + gap * (children.length - 1);
        let startY = 0;
        if (justify === 'center') startY = Math.max(0, Math.floor((containerHeight - totalWithGaps) / 2));
        else if (justify === 'end') startY = Math.max(0, Math.floor(containerHeight - totalWithGaps));

        const sorted = [...children].sort((a, b) => (a.props as any).y - (b.props as any).y);
        let currentY = startY;
        for (const c of sorted) {
          const cp: any = c.props;
          let newX = 0;
          if (align === 'center') newX = Math.floor((containerWidth - (cp.width || 0)) / 2);
          else if (align === 'end') newX = Math.max(0, (containerWidth - (cp.width || 0)));
          const propsUpdate: any = { x: Math.max(0, Math.floor(newX)), y: Math.max(0, Math.floor(currentY)) };
          if (align === 'stretch') {
            propsUpdate.x = 0;
            propsUpdate.width = containerWidth;
          }
          updates.push({ id: c.id, props: propsUpdate });
          currentY += (cp.height || 0) + gap;
        }
      }

      if (updates.length > 0) {
        updateComponents(updates as any);
      }
    }, [appDefinition.components, updateComponents]);

  // --- DYNAMIC DATA ACTIONS ---
  const handleCreateRecord = useCallback(async (dataSourceName: string, newRecord: any) => {
  const instance = appDefinition.dataSources.find(ds => ds.id === dataSourceName);
  if (!instance) return;
  const provider = dataSourceRegistry[instance.providerId];
  if (!provider) {
    console.error(`Provider for ${instance.providerId} not found`);
    return;
  }
  await provider.createRecord(instance, newRecord);
  await refreshDataSource(instance.id);
  }, [appDefinition, refreshDataSource]); // FIX: Depend on the entire appDefinition

  const handleUpdateRecord = useCallback(async (dataSourceName: string, recordId: any, updates: any) => {
  const instance = appDefinition.dataSources.find(ds => ds.id === dataSourceName);
  if (!instance || !recordId) return;
  const provider = dataSourceRegistry[instance.providerId];
  await provider.updateRecord(instance, recordId, updates);
  await refreshDataSource(instance.id);
  const selectedRecord = appDefinition.dataStore.selectedRecord;
  if (selectedRecord && typeof selectedRecord === 'object' && 'id' in selectedRecord && (selectedRecord as any).id === recordId) {
    updateDataStore('selectedRecord', { ...(selectedRecord as any), ...(typeof updates === 'object' && updates ? updates : {}) });
  }
  }, [appDefinition, refreshDataSource, updateDataStore]); // FIX: Depend on the entire appDefinition

  const handleDeleteRecord = useCallback(async (dataSourceName: string, recordId: any) => {
   const instance = appDefinition.dataSources.find(ds => ds.id === dataSourceName);
  if (!instance || !recordId) return;
  const provider = dataSourceRegistry[instance.providerId];
  await provider.deleteRecord(instance, recordId);
  await refreshDataSource(instance.id);
  const selectedRecord = appDefinition.dataStore.selectedRecord;
  if (selectedRecord && typeof selectedRecord === 'object' && 'id' in selectedRecord && (selectedRecord as any).id === recordId) {
    updateDataStore('selectedRecord', null);
  }
  }, [appDefinition, refreshDataSource, updateDataStore]); // FIX: Depend on the entire appDefinition

  const handleSelectRecord = useCallback((dataStoreKey: string, record: any) => {
    updateDataStore(dataStoreKey, record);
  }, [updateDataStore]);
  
  const handleUpdateVariable = useCallback((variableName: string, newValue: any) => {
    setVariableState(prev => ({
      ...prev,
      [variableName]: newValue
    }));
  }, []);

  const actions: ActionHandlers = useMemo(() => ({
  createRecord: handleCreateRecord,
  updateRecord: handleUpdateRecord,
  deleteRecord: handleDeleteRecord,
  selectRecord: handleSelectRecord,
  updateVariable: handleUpdateVariable,
  }), [handleCreateRecord, handleUpdateRecord, handleDeleteRecord, handleSelectRecord, handleUpdateVariable]);
  
  const selectPage = useCallback((pageId: string) => {
  setCurrentPageId(pageId);
  setSelectedComponentIds([]);
  }, []);

  const currentPageComponents = useMemo(() => {
  return components.filter(c => c.pageId === currentPageId);
  }, [components, currentPageId]);


  // --- EXPRESSION EVALUATION SCOPE ---
  const evaluationScope = useMemo(() => {
  const scope = { console, theme: appDefinition.theme, ...dataStore, ...dataSourceContents, ...variableState };
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
  components.filter(c => c.type === ComponentType.TABLE).forEach(c => {
    const props = c.props as TableProps;
    if (props.selectedRecordKey) {
      const existingScopeValue = scope[c.id];
      scope[c.id] = {
        ...(typeof existingScopeValue === 'object' && existingScopeValue ? existingScopeValue : {}),
        selectedRecord: get(dataStore, props.selectedRecordKey)
      }
    }
  });

  return scope;
  }, [appDefinition.theme, dataStore, components, dataSourceContents, variableState]);

  const memoizedAppDefinition = useMemo(() => (appDefinition), [appDefinition]);

  return {
  appDefinition: memoizedAppDefinition,
  setAppDefinition,
  components,
  currentPageId,
  currentPageComponents,
  dataStore,
  selectedComponentIds,
  setSelectedComponentIds,
  addComponent,
  updateComponent,
  updateComponents,
  selectComponent,
  deselectAllComponents,
  deleteComponent,
  deleteSelectedComponents,
  updateDataStore,
  actions,
  evaluationScope,
  dataSourceInstances,
  addDataSource,
  refreshDataSource, // Expose for manual refresh
  variables,
  addVariable,
  variableState,
  dataSourceContents, // Expose for preview
  updateTheme,
  applyTheme,
  reparentComponent,
  selectPage,
    alignAndDistribute,
    arrangeContainerChildren,
    // Expose lower-level handlers expected by tests
    handleUpdateVariable,
  };
};

