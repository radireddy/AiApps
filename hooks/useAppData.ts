

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppDefinition, AppComponent, ComponentType, DataStore, ComponentProps, ActionHandlers, DataSourceInstance, TableProps, AppVariable, Theme, AppPage } from '../types';
import { componentRegistry } from '../components/component-registry/registry';
import { dataSourceRegistry } from '../data-sources/registry';
import { get, set } from '../utils/data-helpers';


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

export const useAppData = (initialAppDefinition: AppDefinition, onSave: (appDef: AppDefinition) => void) => {
  const [appDefinition, setAppDefinitionState] = useState<AppDefinition>(initialAppDefinition);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>(initialAppDefinition.mainPageId);
  
  const { components, dataStore, dataSources: dataSourceInstances, variables, theme } = appDefinition;

  // --- Data Sources State Management ---
  const [dataSourceContents, setDataSourceContents] = useState<Record<string, any[]>>({});
  // --- App Variables State ---
  const [variableState, setVariableState] = useState<Record<string, any>>({});


  const refreshDataSource = useCallback(async (instanceId: string) => {
    const instance = appDefinition.dataSources.find(ds => ds.id === instanceId);
    if (!instance) return;
    const provider = dataSourceRegistry[instance.providerId];
    if (!provider) return;

    const records = await provider.getRecords(instance);
    setDataSourceContents(prev => ({ ...prev, [instance.id]: records }));
  }, [appDefinition]); // FIX: Depend on the entire appDefinition to avoid stale closures
  
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
    setSelectedComponentId(null);
    setCurrentPageId(definition.mainPageId);
  }, []);
  
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

  const addComponent = useCallback((type: ComponentType, position: { x: number; y: number }, parentId: string | null = null, pageId: string) => {
    const componentPlugin = componentRegistry[type];
    if (!componentPlugin) return;

    const newComponent: AppComponent = {
      id: `${type}_${Date.now()}`,
      type,
      props: {
        ...componentPlugin.paletteConfig.defaultProps,
        ...position,
      } as ComponentProps,
      parentId,
      pageId,
    };
    
    let newDataStore = { ...dataStore };
    const props = newComponent.props as any;
    if (props.dataStoreKey && !get(newDataStore, props.dataStoreKey)) {
        let defaultValue: any = '';
        if (type === ComponentType.CHECKBOX || type === ComponentType.SWITCH) {
            defaultValue = false;
        }
       newDataStore = set(newDataStore, props.dataStoreKey, defaultValue);
    }

    setAppDefinitionState(prev => ({
        ...prev,
        components: [...prev.components, newComponent],
        dataStore: newDataStore
    }));
  }, [dataStore]);

  const updateComponent = useCallback((id: string, newProps: Partial<ComponentProps>) => {
    setAppDefinitionState(prev => ({
        ...prev,
        components: prev.components.map(c =>
            c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
        )
    }));
  }, []);

  const selectComponent = useCallback((id: string) => {
    setSelectedComponentId(id);
  }, []);

  const deselectComponent = useCallback(() => {
    setSelectedComponentId(null);
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
    setSelectedComponentId(null);
  }, []);

  const updateDataStore = useCallback((key: string, value: any) => {
    setAppDefinitionState(prev => ({
        ...prev,
        dataStore: set(prev.dataStore, key, value)
      }));
  }, []);

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
    if (appDefinition.dataStore.selectedRecord?.id === recordId) {
        updateDataStore('selectedRecord', { ...appDefinition.dataStore.selectedRecord, ...updates });
    }
  }, [appDefinition, refreshDataSource, updateDataStore]); // FIX: Depend on the entire appDefinition

  const handleDeleteRecord = useCallback(async (dataSourceName: string, recordId: any) => {
     const instance = appDefinition.dataSources.find(ds => ds.id === dataSourceName);
    if (!instance || !recordId) return;
    const provider = dataSourceRegistry[instance.providerId];
    await provider.deleteRecord(instance, recordId);
    await refreshDataSource(instance.id);
    if (appDefinition.dataStore.selectedRecord?.id === recordId) {
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
    setSelectedComponentId(null);
  }, []);

  const currentPageComponents = useMemo(() => {
    return components.filter(c => c.pageId === currentPageId);
  }, [components, currentPageId]);


  // --- EXPRESSION EVALUATION SCOPE ---
  const evaluationScope = useMemo(() => {
    const scope = { console, theme: appDefinition.theme, ...dataStore, ...dataSourceContents, ...variableState };
    // Add component states to scope
    components.forEach(c => {
        const props = c.props as any;
        if (props.dataStoreKey) {
            scope[c.id] = {
                value: get(dataStore, props.dataStoreKey)
            }
        } else { // For components without dataStoreKey like buttons, expose the component itself
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
                ...scope[c.id], // Keep existing props
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
    selectedComponentId,
    addComponent,
    updateComponent,
    selectComponent,
    deselectComponent,
    deleteComponent,
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
  };
};