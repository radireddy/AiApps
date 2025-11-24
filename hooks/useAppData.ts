
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppDefinition, AppComponent, ComponentType, DataStore, ComponentProps, ActionHandlers, DataSourceInstance, TableProps, AppVariable, Theme, AppPage } from '../types';
import { componentRegistry } from '../components/component-registry/registry';
import { dataSourceRegistry } from '../data-sources/registry';
import { get, set } from '../utils/data-helpers';

// ============================================================================
// DEBUG_LOGGING: Remove this entire section before production
// ============================================================================
const DEBUG_OPERATIONS = true; // Set to false to disable all debug logs

const debugLog = (operation: string, details: any, isError: boolean = false) => {
  if (!DEBUG_OPERATIONS) return;
  const logMethod = isError ? console.error : console.warn;
  const prefix = isError ? '❌ OPERATION FAILED' : '⚠️ OPERATION INFO';
  logMethod(`[${prefix}] ${operation}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
};
// ============================================================================
// END DEBUG_LOGGING
// ============================================================================


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
  
  // Ref to store latest selectedComponentIds to avoid stale closures in deleteSelectedComponents
  const selectedComponentIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedComponentIdsRef.current = selectedComponentIds;
  }, [selectedComponentIds]);
  
  const { components, dataStore, dataSources: dataSourceInstances, variables, theme } = appDefinition;

  // --- Data Sources State Management ---
  const [dataSourceContents, setDataSourceContents] = useState<Record<string, any[]>>({});
  // --- App Variables State ---
  const [variableState, setVariableState] = useState<Record<string, any>>({});

  // FIX: Use a ref to access latest appDefinition to break circular dependency in refreshDataSource
  const appDefinitionRef = useRef(appDefinition);
  useEffect(() => {
    appDefinitionRef.current = appDefinition;
  }, [appDefinition]);

  /**
   * Refreshes the data for a specific data source instance.
   * Fetches records from the provider and updates the local state.
   */
  const refreshDataSource = useCallback(async (instanceId: string) => {
    const instance = appDefinitionRef.current.dataSources.find(ds => ds.id === instanceId);
    if (!instance) return;
    const provider = dataSourceRegistry[instance.providerId];
    if (!provider) return;

    const records = await provider.getRecords(instance);
    setDataSourceContents(prev => ({ ...prev, [instance.id]: records }));
  }, []); // FIX: No dependencies - uses ref to access latest appDefinition, breaking circular dependency
  
  // Refresh all data sources on initial load or when instances change
  // FIX: Use a ref to track previous data source IDs to prevent unnecessary refreshes
  const prevDataSourceIdsRef = useRef<string>('');
  useEffect(() => {
    const currentIds = appDefinition.dataSources.map(ds => ds.id).sort().join(',');
    // Only refresh if data source IDs actually changed
    if (prevDataSourceIdsRef.current !== currentIds) {
      prevDataSourceIdsRef.current = currentIds;
      appDefinition.dataSources.forEach(instance => {
        refreshDataSource(instance.id);
      });
    }
  }, [appDefinition.dataSources, refreshDataSource]);
  
  // Initialize variable state when app definition changes
  useEffect(() => {
      const newVarState: Record<string, any> = {};
      if (appDefinition.variables && Array.isArray(appDefinition.variables)) {
          appDefinition.variables.forEach(v => {
              newVarState[v.name] = parseInitialValue(v.initialValue, v.type);
          });
      }
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
  
  const addDataSource = useCallback((instance: DataSourceInstance) => {
    setAppDefinitionState(prev => ({
      ...prev,
      dataSources: [...prev.dataSources, instance]
    }));
  }, []);

  const addVariable = useCallback((variable: AppVariable) => {
    const variables = appDefinition.variables || [];
    if (variables.some(v => v.name === variable.name)) {
        alert('A variable with this name already exists.');
        return;
    }
    setAppDefinitionState(prev => ({
        ...prev,
        variables: [...(prev.variables || []), variable]
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
                    // For Container type, use the provided position directly (no auto-arrangement)
                    if (parent.type === ComponentType.CONTAINER) {
                        // Container uses absolute positioning - position is already relative to padding edge
                        // Ensure position is not negative (clamp to 0)
                        (newComp.props as any).x = Math.max(0, (newComp.props as any).x);
                        (newComp.props as any).y = Math.max(0, (newComp.props as any).y);
                    } else {
                        // For other container types (Panel, HStack, VStack), use auto-arrangement
                        const parentProps: any = parent.props as any;
                        const existingChildren = prev.components.filter(c => c.parentId === parentId && c.pageId === pageId);
                        const GAP = 10;

                        // Build an array including the new component and compute positions for all children
                        const allChildren = [...existingChildren, newComp];

                        // Parse parent padding to account for it in positioning
                        const parsePaddingValue = (padding?: string | number): { left: number; top: number } => {
                            if (padding === undefined) return { left: 0, top: 0 };
                            if (typeof padding === 'number') return { left: padding, top: padding };
                            const parts = String(padding).trim().split(/\s+/);
                            if (parts.length === 1) {
                                const value = parseFloat(parts[0]) || 0;
                                return { left: value, top: value };
                            } else if (parts.length === 2) {
                                return { top: parseFloat(parts[0]) || 0, left: parseFloat(parts[1]) || 0 };
                            } else if (parts.length === 4) {
                                return { top: parseFloat(parts[0]) || 0, left: parseFloat(parts[3]) || 0 };
                            }
                            return { left: 0, top: 0 };
                        };
                        const parentPadding = parsePaddingValue(parentProps.padding);
                        
                        if ((parentProps.direction || 'horizontal') === 'horizontal') {
                        // compute positions left-to-right, starting from padding edge
                        let currentX = parentPadding.left;
                        const arranged = allChildren.map((c, idx) => {
                            const w = (c.props as any).width || 0;
                            const h = (c.props as any).height || 0;
                            const y = Math.max(parentPadding.top, Math.floor(((parentProps.height || 0) - h) / 2));
                            const x = currentX;
                            currentX += w + GAP;
                            return { id: c.id, x, y };
                        });

                        // apply arranged positions to newComp and existing children by merging when forming new components array below
                        (newComp.props as any).x = arranged.find(a => a.id === newComp.id)!.x;
                        (newComp.props as any).y = arranged.find(a => a.id === newComp.id)!.y;

                        // update existing children's props in the copy by mapping later
                        // we'll apply arranged positions when creating the final components array below
                        // store arranged positions on a map via closure
                        (newComp as any)._arranged = arranged.reduce((m, a) => { m[a.id] = { x: a.x, y: a.y }; return m; }, {} as Record<string, any>);
                    } else {
                        // vertical stacking, starting from padding edge
                        let currentY = parentPadding.top;
                        const arranged = allChildren.map((c) => {
                            const w = (c.props as any).width || 0;
                            const h = (c.props as any).height || 0;
                            const x = Math.max(parentPadding.left, Math.floor(((parentProps.width || 0) - w) / 2));
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
    setAppDefinitionState(prev => {
        const component = prev.components.find(c => c.id === id);
        if (!component) {
            return prev;
        }

        // Check if this is a Container and padding is being changed
        const isContainer = component.type === ComponentType.CONTAINER;
        const paddingChanged = isContainer && 'padding' in newProps && newProps.padding !== component.props.padding;
        
        // Parse padding helper - extracts left and top padding values
        // Children positions are relative to content area which starts at (padding.left, padding.top)
        const parsePaddingValue = (padding?: string | number): { left: number; top: number } => {
            if (padding === undefined) return { left: 0, top: 0 };
            if (typeof padding === 'number') return { left: padding, top: padding };
            const parts = String(padding).trim().split(/\s+/);
            if (parts.length === 1) {
                const value = parseFloat(parts[0]) || 0;
                return { left: value, top: value };
            } else if (parts.length === 2) {
                // Format: "top right" -> top applies to top and bottom, right applies to left and right
                const top = parseFloat(parts[0]) || 0;
                const right = parseFloat(parts[1]) || 0;
                return { top, left: right };
            } else if (parts.length === 4) {
                // Format: "top right bottom left"
                return { 
                    top: parseFloat(parts[0]) || 0, 
                    left: parseFloat(parts[3]) || 0 
                };
            }
            return { left: 0, top: 0 };
        };

        // If padding changed on a Container, calculate deltas BEFORE updating the container
        let paddingDeltaX = 0;
        let paddingDeltaY = 0;
        if (paddingChanged) {
            const oldPadding = parsePaddingValue(component.props.padding);
            const newPadding = parsePaddingValue(newProps.padding);
            paddingDeltaX = newPadding.left - oldPadding.left;
            paddingDeltaY = newPadding.top - oldPadding.top;
        }

        // Update components - first update the container, then adjust children
        let updatedComponents = prev.components.map(c => {
            if (c.id === id) {
                return { ...c, props: { ...c.props, ...newProps } };
            }
            return c;
        });

        // If padding changed, adjust all child positions to maintain their visual positions
        // When padding increases, content area moves right/down, so children need to move right/down
        // When padding decreases, content area moves left/up, so children need to move left/up
        // This preserves the visual arrangement and spacing between components
        if (paddingChanged && (paddingDeltaX !== 0 || paddingDeltaY !== 0)) {
            updatedComponents = updatedComponents.map(c => {
                if (c.parentId === id) {
                    const currentX = c.props.x as number;
                    const currentY = c.props.y as number;
                    // Adjust position by the padding delta to maintain visual position
                    // Don't clamp to 0 here - allow negative values if padding decreases significantly
                    // The component will be clipped by the container's overflow anyway
                    return {
                        ...c,
                        props: {
                            ...c.props,
                            x: currentX + paddingDeltaX,
                            y: currentY + paddingDeltaY,
                        }
                    };
                }
                return c;
            });
        }

        return {
            ...prev,
            components: updatedComponents,
        };
    });
  }, []);
  
  const updateComponents = useCallback((updates: Array<{ id: string; props: Partial<ComponentProps> }>) => {
    if (updates.length === 0) return; // Early exit if no updates
    
    setAppDefinitionState(prev => {
        // Create a Set of IDs to update for O(1) lookup
        const updateIds = new Set(updates.map(u => u.id));
        const updatesMap = new Map(updates.map(u => [u.id, u.props]));
        
        // Only create new array if there are actual changes
        let hasChanges = false;
        // Pre-allocate array for better performance
        const newComponents = new Array(prev.components.length);
        
        for (let i = 0; i < prev.components.length; i++) {
            const c = prev.components[i];
            if (updateIds.has(c.id)) {
                const newProps = updatesMap.get(c.id)!;
                // Check if props actually changed to avoid unnecessary re-renders
                const xChanged = 'x' in newProps && (c.props as any).x !== (newProps as any).x;
                const yChanged = 'y' in newProps && (c.props as any).y !== (newProps as any).y;
                
                if (xChanged || yChanged) {
                    hasChanges = true;
                    // Only merge the changed props, not all props
                    newComponents[i] = { 
                        ...c, 
                        props: { 
                            ...c.props, 
                            ...(xChanged ? { x: (newProps as any).x } : {}),
                            ...(yChanged ? { y: (newProps as any).y } : {}),
                        } 
                    };
                } else {
                    newComponents[i] = c; // No change, keep same reference
                }
            } else {
                newComponents[i] = c; // Not updated, keep same reference
            }
        }
        
        // Only update state if there are actual changes
        if (!hasChanges) {
            return prev; // Return same reference to prevent re-render
        }
        
        return {
            ...prev,
            components: newComponents,
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
    setAppDefinitionState(prev => {
        // Use ref to get the latest selectedComponentIds to avoid stale closures
        const currentSelectedIds = selectedComponentIdsRef.current;
        if (currentSelectedIds.length === 0) return prev;
        
        const allIdsToDelete = new Set<string>();
        const findChildren = (parentId: string) => {
            prev.components.forEach(c => {
                if(c.parentId === parentId) {
                    allIdsToDelete.add(c.id);
                    findChildren(c.id);
                }
            });
        };
        currentSelectedIds.forEach(id => {
            allIdsToDelete.add(id);
            findChildren(id);
        });
        return {
            ...prev,
            components: prev.components.filter(c => !allIdsToDelete.has(c.id)),
        }
    });
    setSelectedComponentIds([]);
  }, []);

  const updateDataStore = useCallback((key: string, value: any) => {
    setAppDefinitionState(prev => ({
        ...prev,
        dataStore: set(prev.dataStore, key, value)
      }));
  }, []);

  // Ref to track if reparentComponent is currently being processed to prevent infinite loops
  const isReparentingRef = useRef<Set<string>>(new Set());

  /**
   * Handles the complex logic of moving a component into or out of a container.
   * It calculates the new relative coordinates based on the component's absolute position
   * and the new parent's position.
   * 
   * @param componentId - The ID of the component being moved.
   */
  const reparentComponent = useCallback((componentId: string, finalPosition?: { x: number; y: number }) => {
    // DEBUG_LOGGING: Log reparent attempt
    debugLog('REPARENT_ATTEMPT', {
      componentId,
      finalPosition,
    });
    
    // Prevent infinite loops by checking if this component is already being reparented
    if (isReparentingRef.current.has(componentId)) {
      debugLog('REPARENT_SKIPPED_ALREADY_PROCESSING', {
        componentId,
        currentlyProcessing: Array.from(isReparentingRef.current),
      }, true);
      return;
    }
    isReparentingRef.current.add(componentId);

    // Helper to parse padding - returns all four sides
    const parsePaddingValue = (padding?: string | number): { left: number; top: number; right: number; bottom: number } => {
        if (padding === undefined) return { left: 0, top: 0, right: 0, bottom: 0 };
        if (typeof padding === 'number') return { left: padding, top: padding, right: padding, bottom: padding };
        const parts = String(padding).trim().split(/\s+/);
        if (parts.length === 1) {
            const value = parseFloat(parts[0]) || 0;
            return { left: value, top: value, right: value, bottom: value };
        } else if (parts.length === 2) {
            const top = parseFloat(parts[0]) || 0;
            const right = parseFloat(parts[1]) || 0;
            return { top, right, bottom: top, left: right };
        } else if (parts.length === 4) {
            return {
                top: parseFloat(parts[0]) || 0,
                right: parseFloat(parts[1]) || 0,
                bottom: parseFloat(parts[2]) || 0,
                left: parseFloat(parts[3]) || 0,
            };
        }
        return { left: 0, top: 0, right: 0, bottom: 0 };
    };

    // Helper to parse width/height to number (handles "400px", "50%", or number)
    const parseSizeToNumber = (size: any): number => {
        if (typeof size === 'number') return size;
        if (typeof size === 'string' && size.trim()) {
            // Extract numeric value from strings like "400px" or "50%"
            const match = size.trim().match(/^(\d+(?:\.\d+)?)/);
            if (match) return parseFloat(match[1]);
        }
        return 0;
    };

    // Helper to get the absolute position of a component (border position on canvas)
    // Uses a visited set to prevent infinite loops from circular parent references
    // For Container parents, accounts for padding: child positions are relative to padding edge
    const getAbsolutePosition = (cId: string, allComponents: AppComponent[], visited: Set<string> = new Set()): { x: number, y: number } => {
        // Prevent infinite loops from circular references
        if (visited.has(cId)) {
            console.warn(`Circular parent reference detected for component ${cId}`);
            return { x: 0, y: 0 };
        }
        visited.add(cId);
        
        const component = allComponents.find(c => c.id === cId);
        if (!component) return { x: 0, y: 0 };

        // Start with component's own position
        let absX = component.props.x;
        let absY = component.props.y;
        let currentParentId = component.parentId;
        
        while (currentParentId) {
            if (visited.has(currentParentId)) {
                console.warn(`Circular parent reference detected in parent chain for component ${cId}`);
                break;
            }
            visited.add(currentParentId);
            const parent = allComponents.find(p => p.id === currentParentId);
            if (parent) {
                // Add parent's border position
                absX += parent.props.x;
                absY += parent.props.y;
                // For Container type, child positions are relative to padding edge (content area)
                // So we need to add padding to get the absolute border position
                if (parent.type === ComponentType.CONTAINER) {
                    const parentPadding = parsePaddingValue(parent.props.padding);
                    absX += parentPadding.left;
                    absY += parentPadding.top;
                }
                currentParentId = parent.parentId;
            } else {
                break;
            }
        }
        return { x: absX, y: absY };
    };
    
    // Helper to check if a component is a descendant of another
    // Uses a visited set to prevent infinite recursion in case of circular references
    const isDescendant = (childId: string, parentId: string, allComponents: AppComponent[], visited: Set<string> = new Set()): boolean => {
        // Prevent infinite recursion from circular references
        if (visited.has(childId)) return false;
        visited.add(childId);
        
        const child = allComponents.find(c => c.id === childId);
        if (!child || !child.parentId) return false;
        if (child.parentId === parentId) return true;
        return isDescendant(child.parentId, parentId, allComponents, visited);
    };

    setAppDefinitionState(prev => {
        const allComponents = prev.components;
        const componentToReparent = allComponents.find(c => c.id === componentId);
        if (!componentToReparent) {
          debugLog('REPARENT_FAILED_COMPONENT_NOT_FOUND', {
            componentId,
            availableComponentIds: allComponents.map(c => c.id),
            totalComponents: allComponents.length,
          }, true);
          return prev;
        }

        // Use finalPosition if provided (from drag drop), otherwise calculate from current state
        let absoluteX: number;
        let absoluteY: number;
        if (finalPosition) {
            // If final position is provided, it should be the absolute position on canvas
            // (calculated from initial absolute position + drag delta)
            // This is more accurate than calculating from relative position within old parent
            absoluteX = finalPosition.x;
            absoluteY = finalPosition.y;
        } else {
            // Use current position from state
            const pos = getAbsolutePosition(componentId, allComponents);
            absoluteX = pos.x;
            absoluteY = pos.y;
        }
        // Parse component dimensions to numbers
        const componentWidth = parseSizeToNumber(componentToReparent.props.width);
        const componentHeight = parseSizeToNumber(componentToReparent.props.height);
        const centerX = absoluteX + componentWidth / 2;
        const centerY = absoluteY + componentHeight / 2;

        // Helper to get parent's border position (not including padding)
        // This calculates the absolute position of the parent's border on the canvas
        const getParentBorderPosition = (parentId: string): { x: number, y: number } => {
            if (!parentId) return { x: 0, y: 0 };
            const parent = allComponents.find(p => p.id === parentId);
            if (!parent) return { x: 0, y: 0 };
            
            // Start with parent's relative position
            let borderX = parent.props.x as number;
            let borderY = parent.props.y as number;
            let currentParentId = parent.parentId;
            const visited = new Set<string>();
            
            // Walk up the parent chain to calculate absolute position
            while (currentParentId) {
                if (visited.has(currentParentId)) break;
                visited.add(currentParentId);
                const grandParent = allComponents.find(p => p.id === currentParentId);
                if (grandParent) {
                    // Add grandparent's relative position
                    borderX += grandParent.props.x as number;
                    borderY += grandParent.props.y as number;
                    // For Container grandparents, child positions are relative to padding edge
                    // So we need to add padding to get the absolute border position
                    if (grandParent.type === ComponentType.CONTAINER) {
                        const grandParentPadding = parsePaddingValue(grandParent.props.padding);
                        borderX += grandParentPadding.left;
                        borderY += grandParentPadding.top;
                    }
                    currentParentId = grandParent.parentId;
                } else {
                    break;
                }
            }
            return { x: borderX, y: borderY };
        };

        const potentialParents = allComponents.filter(p => {
            const plugin = componentRegistry[p.type];
            // Cannot be its own parent or child, and must be on the same page
            // Check if componentId is a descendant of p.id to prevent moving into own child
            return plugin.isContainer && p.id !== componentId && !isDescendant(componentId, p.id, allComponents) && p.pageId === componentToReparent.pageId;
        });

        let newParent: AppComponent | null = null;
        let smallestArea = Infinity;

        // Use threshold for easier container entry
        const CONTAINER_THRESHOLD = 0.5;
        
        for (const parent of potentialParents) {
            // Get parent's border position (not including padding)
            const parentBorderPos = getParentBorderPosition(parent.id);
            // For Container type, check if component is still within content area bounds (accounting for padding)
            // For other containers, use center point check
            let isWithinBounds: boolean;
            // Parse parent dimensions to numbers
            const parentWidth = parseSizeToNumber(parent.props.width);
            const parentHeight = parseSizeToNumber(parent.props.height);
            
            if (parent.type === ComponentType.CONTAINER) {
                const parentPadding = parsePaddingValue(parent.props.padding);
                // Check if component fits within the content area (border - padding on all sides)
                // Use threshold to make it easier to drag into container
                const contentLeft = parentBorderPos.x + parentPadding.left;
                const contentTop = parentBorderPos.y + parentPadding.top;
                const contentRight = parentBorderPos.x + parentWidth - parentPadding.right;
                const contentBottom = parentBorderPos.y + parentHeight - parentPadding.bottom;
                
                // Component is considered inside if it's mostly inside (using threshold)
                // This makes it easier to drag components into containers
                isWithinBounds = (
                    absoluteX >= contentLeft - CONTAINER_THRESHOLD &&
                    absoluteX + componentWidth <= contentRight + CONTAINER_THRESHOLD &&
                    absoluteY >= contentTop - CONTAINER_THRESHOLD &&
                    absoluteY + componentHeight <= contentBottom + CONTAINER_THRESHOLD
                );
            } else {
                isWithinBounds = (
                    centerX >= parentBorderPos.x &&
                    centerX <= parentBorderPos.x + parentWidth &&
                    centerY >= parentBorderPos.y &&
                    centerY <= parentBorderPos.y + parentHeight
                );
            }
            
            if (isWithinBounds) {
                const area = parentWidth * parentHeight;
                if (area < smallestArea) {
                    smallestArea = area;
                    newParent = parent;
                }
            }
        }
        
        const oldParentId = componentToReparent.parentId || null;
        
        // If component is currently in a Container, check if it's still within that container's bounds
        // Only move it out if it's completely outside the container
        // Use a small threshold (0.5px) to account for floating-point precision issues
        const CONTAINMENT_THRESHOLD = 0.5;
        if (oldParentId) {
            const oldParent = allComponents.find(p => p.id === oldParentId);
            if (oldParent && oldParent.type === ComponentType.CONTAINER) {
                const oldParentBorderPos = getParentBorderPosition(oldParentId);
                const oldParentPadding = parsePaddingValue(oldParent.props.padding);
                const oldParentWidth = parseSizeToNumber(oldParent.props.width);
                const oldParentHeight = parseSizeToNumber(oldParent.props.height);
                const contentLeft = oldParentBorderPos.x + oldParentPadding.left;
                const contentTop = oldParentBorderPos.y + oldParentPadding.top;
                const contentRight = oldParentBorderPos.x + oldParentWidth - oldParentPadding.right;
                const contentBottom = oldParentBorderPos.y + oldParentHeight - oldParentPadding.bottom;
                
                // Check if component is still completely within the original container's content area
                // Use threshold to account for floating-point precision
                const stillInOriginalContainer = (
                    absoluteX >= contentLeft - CONTAINMENT_THRESHOLD &&
                    absoluteX + componentWidth <= contentRight + CONTAINMENT_THRESHOLD &&
                    absoluteY >= contentTop - CONTAINMENT_THRESHOLD &&
                    absoluteY + componentHeight <= contentBottom + CONTAINMENT_THRESHOLD
                );
                
                // If still in original container, keep it there (don't reparent)
                if (stillInOriginalContainer) {
                  debugLog('REPARENT_NO_CHANGE_STILL_IN_ORIGINAL', {
                    componentId,
                    oldParentId,
                    absolutePosition: { x: absoluteX, y: absoluteY },
                    containerBounds: { contentLeft, contentTop, contentRight, contentBottom },
                    componentSize: { width: componentWidth, height: componentHeight },
                  });
                  return prev; // No change needed - component stays in original container
                }
                
                // If not in original container, check if it's completely outside
                // Component is completely outside if no part of it overlaps the content area
                // Use threshold to make it easier to drag out
                const completelyOutside = (
                    absoluteX + componentWidth <= contentLeft + CONTAINMENT_THRESHOLD ||
                    absoluteX >= contentRight - CONTAINMENT_THRESHOLD ||
                    absoluteY + componentHeight <= contentTop + CONTAINMENT_THRESHOLD ||
                    absoluteY >= contentBottom - CONTAINMENT_THRESHOLD
                );
                
                // Only allow moving out if completely outside
                // If partially overlapping, don't change parent (keep in original container)
                if (!completelyOutside) {
                  debugLog('REPARENT_NO_CHANGE_PARTIALLY_OVERLAPPING', {
                    componentId,
                    oldParentId,
                    absolutePosition: { x: absoluteX, y: absoluteY },
                    containerBounds: { contentLeft, contentTop, contentRight, contentBottom },
                    componentSize: { width: componentWidth, height: componentHeight },
                    completelyOutside,
                  });
                  return prev; // Partially overlapping - keep in original container
                }
            }
        }
        
        const newParentId = newParent ? newParent.id : null;

        if (oldParentId === newParentId) {
          debugLog('REPARENT_NO_CHANGE_SAME_PARENT', {
            componentId,
            parentId: oldParentId,
          });
          return prev; // No change needed
        }

        try {
          const newParentAbsPos = newParent ? getParentBorderPosition(newParent.id) : { x: 0, y: 0 };
          // For Container, position should be relative to padding edge (content area)
          // For other containers, position is relative to border edge
          let newRelativeX: number;
          let newRelativeY: number;
          if (newParent && newParent.type === ComponentType.CONTAINER) {
            const newParentPadding = parsePaddingValue(newParent.props.padding);
            // Calculate relative position to padding edge (content area)
            newRelativeX = absoluteX - newParentAbsPos.x - newParentPadding.left;
            newRelativeY = absoluteY - newParentAbsPos.y - newParentPadding.top;
            // Clamp to ensure non-negative
            newRelativeX = Math.max(0, newRelativeX);
            newRelativeY = Math.max(0, newRelativeY);
          } else {
            newRelativeX = absoluteX - newParentAbsPos.x;
            newRelativeY = absoluteY - newParentAbsPos.y;
          }

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

          debugLog('REPARENT_SUCCESS', {
            componentId,
            oldParentId,
            newParentId,
            oldPosition: { x: componentToReparent.props.x, y: componentToReparent.props.y },
            newPosition: { x: newRelativeX, y: newRelativeY },
            absolutePosition: { x: absoluteX, y: absoluteY },
            newParentAbsPos,
            newParentType: newParent?.type,
          });

          return { ...prev, components: updatedComponents };
        } catch (error) {
          debugLog('REPARENT_EXCEPTION', {
            componentId,
            oldParentId,
            newParentId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            absolutePosition: { x: absoluteX, y: absoluteY },
          }, true);
          return prev;
        }
    });
    
    // Remove from processing set after a short delay to allow state update to complete
    setTimeout(() => {
      isReparentingRef.current.delete(componentId);
    }, 100);
  }, [setAppDefinitionState]);

  // FIX: Completely overhauled alignment and distribution logic to be robust, prevent overlaps, and correctly space all components.
  /**
   * Aligns or distributes selected components.
   * Supports left/center/right alignment, top/middle/bottom alignment,
   * and horizontal/vertical distribution.
   */
  const alignAndDistribute = useCallback((action: AlignAction) => {
    if (selectedComponentIds.length < 2) return;

    const componentsMap = new Map<string, AppComponent>();
    components.forEach(c => componentsMap.set(c.id, c));
    const selectedComponents = selectedComponentIds.map(id => componentsMap.get(id)).filter((c): c is AppComponent => !!c);
    
    if (selectedComponents.length < 2) return;

    const updates: Array<{ id: string; props: Partial<ComponentProps> }> = [];
    const GAP = 10; // Default gap between components when stacking

    const boundingBox = selectedComponents.reduce((acc, c) => ({
        x1: Math.min(acc.x1, c.props.x),
        y1: Math.min(acc.y1, c.props.y),
        x2: Math.max(acc.x2, c.props.x + c.props.width),
        y2: Math.max(acc.y2, c.props.y + c.props.height)
    }), { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });

    switch (action) {
        // --- HORIZONTAL ALIGNMENT & VERTICAL STACKING ---
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

        // --- VERTICAL ALIGNMENT & HORIZONTAL STACKING ---
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

        // --- DISTRIBUTION ---
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
        
        // --- SIZE MATCHING ---
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
        debugLog('ARRANGE_CONTAINER_ATTEMPT', {
          panelId,
          opts,
        });
        
        setAppDefinitionState(prev => {
            const parent = prev.components.find(c => c.id === panelId);
            if (!parent) {
              debugLog('ARRANGE_CONTAINER_FAILED_PARENT_NOT_FOUND', {
                panelId,
                availableComponentIds: prev.components.map(c => c.id),
              }, true);
              return prev;
            }
            const panelProps: any = parent.props;
            // Use opts values first, then fall back to current props, then defaults
            const direction = (opts.direction as any) || panelProps.direction || 'horizontal';
            const justify = (opts.justifyContent as any) || panelProps.justifyContent || 'start';
            const align = (opts.alignItems as any) || panelProps.alignItems || 'center';

            const children = prev.components.filter(c => c.parentId === panelId && c.pageId === parent.pageId);
            if (children.length === 0) return prev;

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

                // When switching to horizontal, preserve order by sorting by current Y position (top to bottom)
                // If Y positions are similar, sort by X to preserve left-to-right order
                const sorted = [...children].sort((a, b) => {
                    const aY = (a.props as any).y;
                    const bY = (b.props as any).y;
                    if (Math.abs(aY - bY) < 5) { // If Y positions are very close, sort by X
                        return (a.props as any).x - (b.props as any).x;
                    }
                    return aY - bY;
                });
                let currentX = startX;
                for (const c of sorted) {
                    const cp: any = c.props;
                    let newY = 0;
                    if (align === 'center') newY = Math.max(0, Math.floor((containerHeight - (cp.height || 0)) / 2));
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

                // When switching to vertical, preserve order by sorting by current X position (left to right)
                // If X positions are similar, sort by Y to preserve top-to-bottom order
                const sorted = [...children].sort((a, b) => {
                    const aX = (a.props as any).x;
                    const bX = (b.props as any).x;
                    if (Math.abs(aX - bX) < 5) { // If X positions are very close, sort by Y
                        return (a.props as any).y - (b.props as any).y;
                    }
                    return aX - bX;
                });
                let currentY = startY;
                for (const c of sorted) {
                    const cp: any = c.props;
                    let newX = 0;
                    if (align === 'center') newX = Math.max(0, Math.floor((containerWidth - (cp.width || 0)) / 2));
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
                const updatesMap = new Map(updates.map(u => [u.id, u.props]));
                debugLog('ARRANGE_CONTAINER_SUCCESS', {
                  panelId,
                  childrenCount: children.length,
                  updatesCount: updates.length,
                  updates: updates.map(u => ({ id: u.id, props: u.props })),
                });
                return {
                    ...prev,
                    components: prev.components.map(c => {
                        if (updatesMap.has(c.id)) {
                            return { ...c, props: { ...c.props, ...updatesMap.get(c.id) } };
                        }
                        return c;
                    }),
                };
            } else {
              debugLog('ARRANGE_CONTAINER_NO_UPDATES', {
                panelId,
                childrenCount: children.length,
                reason: 'No updates generated',
              }, true);
            }
            return prev;
        });
    }, [setAppDefinitionState]);

  /**
   * Reorders a component within the same parent.
   * Moves the component to a new position in the sibling list.
   * @param componentId - The component to reorder
   * @param newIndex - The new index position (0-based)
   * @param parentId - The parent ID (null for root/page level)
   * @param pageId - The page ID
   */
  const reorderComponent = useCallback((componentId: string, newIndex: number, parentId: string | null, pageId: string) => {
    setAppDefinitionState(prev => {
      const component = prev.components.find(c => c.id === componentId);
      if (!component) return prev;
      
      // Verify the component is on the correct page
      if (component.pageId !== pageId) return prev;
      
      // Get all siblings (components with the same parent)
      const siblings = prev.components
        .filter(c => {
          const cParentId = c.parentId || null;
          return cParentId === parentId && c.pageId === pageId && c.id !== componentId;
        })
        .sort((a, b) => {
          // Sort by current order in the array (preserve existing order)
          const aIndex = prev.components.indexOf(a);
          const bIndex = prev.components.indexOf(b);
          return aIndex - bIndex;
        });
      
      // Clamp newIndex to valid range
      const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));
      
      // Create new array with component inserted at new position
      const newSiblings = [...siblings];
      newSiblings.splice(clampedIndex, 0, component);
      
      // Rebuild components array maintaining order
      const otherComponents = prev.components.filter(c => {
        const cParentId = c.parentId || null;
        return !(cParentId === parentId && c.pageId === pageId);
      });
      
      // Insert siblings in order after other components
      const reorderedComponents = [...otherComponents, ...newSiblings];
      
      return {
        ...prev,
        components: reorderedComponents,
      };
    });
  }, []);

  /**
   * Moves a component from one parent to another (or to root).
   * Also handles reordering within the new parent.
   * This function properly updates parentId and calculates relative positions.
   * If the move fails validation, it automatically rolls back to the original position.
   * @param componentId - The component to move
   * @param newParentId - The new parent ID (null for root/page level)
   * @param newIndex - Optional new index position within new parent (0-based)
   * @param pageId - The page ID
   */
  const moveComponentToParent = useCallback((componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => {
    debugLog('MOVE_COMPONENT_ATTEMPT', {
      componentId,
      newParentId,
      newIndex,
      pageId,
    });
    
    setAppDefinitionState(prev => {
      const component = prev.components.find(c => c.id === componentId);
      if (!component) {
        debugLog('MOVE_COMPONENT_FAILED_NOT_FOUND', {
          componentId,
          availableIds: prev.components.map(c => c.id),
        }, true);
        return prev;
      }
      
      // Verify the component is on the correct page
      if (component.pageId !== pageId) {
        debugLog('MOVE_COMPONENT_FAILED_WRONG_PAGE', {
          componentId,
          componentPageId: component.pageId,
          requestedPageId: pageId,
        }, true);
        return prev;
      }
      
      // Store original state for rollback if move fails
      const originalParentId = component.parentId || null;
      const originalX = component.props.x as number;
      const originalY = component.props.y as number;
      
      // Helper to get absolute position of a component
      const getAbsolutePosition = (cId: string, allComps: AppComponent[]): { x: number, y: number } => {
        const comp = allComps.find(c => c.id === cId);
        if (!comp) return { x: 0, y: 0 };
        
        let absX = comp.props.x as number;
        let absY = comp.props.y as number;
        let currentParentId = comp.parentId;
        
        while (currentParentId) {
          const parent = allComps.find(p => p.id === currentParentId);
          if (parent) {
            absX += parent.props.x as number;
            absY += parent.props.y as number;
            // For Container type, add padding to get absolute border position
            if (parent.type === ComponentType.CONTAINER) {
              const parsePaddingValue = (padding?: string | number): { left: number; top: number; right: number; bottom: number } => {
                if (padding === undefined) return { left: 0, top: 0, right: 0, bottom: 0 };
                if (typeof padding === 'number') return { left: padding, top: padding, right: padding, bottom: padding };
                const parts = String(padding).trim().split(/\s+/);
                if (parts.length === 1) {
                  const value = parseFloat(parts[0]) || 0;
                  return { left: value, top: value, right: value, bottom: value };
                } else if (parts.length === 2) {
                  const top = parseFloat(parts[0]) || 0;
                  const right = parseFloat(parts[1]) || 0;
                  return { top, right, bottom: top, left: right };
                } else if (parts.length === 4) {
                  return {
                    top: parseFloat(parts[0]) || 0,
                    right: parseFloat(parts[1]) || 0,
                    bottom: parseFloat(parts[2]) || 0,
                    left: parseFloat(parts[3]) || 0,
                  };
                }
                return { left: 0, top: 0, right: 0, bottom: 0 };
              };
              const parentPadding = parsePaddingValue(parent.props.padding);
              absX += parentPadding.left;
              absY += parentPadding.top;
            }
            currentParentId = parent.parentId;
          } else {
            break;
          }
        }
        return { x: absX, y: absY };
      };
      
      // Helper to check if a component is a descendant (prevent circular references)
      const isDescendant = (childId: string, parentId: string, allComps: AppComponent[]): boolean => {
        const child = allComps.find(c => c.id === childId);
        if (!child || !child.parentId) return false;
        if (child.parentId === parentId) return true;
        return isDescendant(child.parentId, parentId, allComps);
      };
      
      // Prevent moving component into itself or its own descendant
      if (newParentId && (component.id === newParentId || isDescendant(newParentId, component.id, prev.components))) {
        debugLog('MOVE_COMPONENT_FAILED_CIRCULAR_REFERENCE', {
          componentId,
          newParentId,
          isSelf: component.id === newParentId,
          isDescendant: isDescendant(newParentId, component.id, prev.components),
        }, true);
        return prev; // Rollback - return original state
      }
      
      // Verify new parent exists and is a container (if not null) - validate BEFORE attempting move
      if (newParentId) {
        const newParent = prev.components.find(c => c.id === newParentId);
        if (!newParent) {
          debugLog('MOVE_COMPONENT_FAILED_PARENT_NOT_FOUND', {
            componentId,
            newParentId,
            availableParentIds: prev.components.filter(c => componentRegistry[c.type]?.isContainer).map(c => c.id),
          }, true);
          return prev; // Rollback - return original state
        }
        
        const plugin = componentRegistry[newParent.type];
        if (!plugin || !plugin.isContainer) {
          debugLog('MOVE_COMPONENT_FAILED_NOT_CONTAINER', {
            componentId,
            newParentId,
            newParentType: newParent.type,
            isContainer: plugin?.isContainer,
          }, true);
          return prev; // Rollback - return original state
        }
        
        // Verify new parent is on the same page
        if (newParent.pageId !== pageId) {
          debugLog('MOVE_COMPONENT_FAILED_PARENT_WRONG_PAGE', {
            componentId,
            newParentId,
            newParentPageId: newParent.pageId,
            requestedPageId: pageId,
          }, true);
          return prev; // Rollback - return original state
        }
      }
      
      const oldParentId = component.parentId || null;
      
      // If parent hasn't changed and no reordering needed, return early
      if (oldParentId === newParentId && newIndex === null) {
        return prev;
      }
      
      // Get absolute position of the component
      const absolutePos = getAbsolutePosition(componentId, prev.components);
      
      // Calculate new relative position based on new parent
      let newRelativeX: number;
      let newRelativeY: number;
      
      if (newParentId) {
        const newParent = prev.components.find(c => c.id === newParentId)!;
        const newParentAbsPos = getAbsolutePosition(newParentId, prev.components);
        
        // For Container type, position should be relative to padding edge (content area)
        // For other containers, position is relative to border edge
        if (newParent.type === ComponentType.CONTAINER) {
          const parsePaddingValue = (padding?: string | number): { left: number; top: number; right: number; bottom: number } => {
            if (padding === undefined) return { left: 0, top: 0, right: 0, bottom: 0 };
            if (typeof padding === 'number') return { left: padding, top: padding, right: padding, bottom: padding };
            const parts = String(padding).trim().split(/\s+/);
            if (parts.length === 1) {
              const value = parseFloat(parts[0]) || 0;
              return { left: value, top: value, right: value, bottom: value };
            } else if (parts.length === 2) {
              const top = parseFloat(parts[0]) || 0;
              const right = parseFloat(parts[1]) || 0;
              return { top, right, bottom: top, left: right };
            } else if (parts.length === 4) {
              return {
                top: parseFloat(parts[0]) || 0,
                right: parseFloat(parts[1]) || 0,
                bottom: parseFloat(parts[2]) || 0,
                left: parseFloat(parts[3]) || 0,
              };
            }
            return { left: 0, top: 0, right: 0, bottom: 0 };
          };
          const newParentPadding = parsePaddingValue(newParent.props.padding);
          // Calculate relative position to padding edge (content area)
          newRelativeX = absolutePos.x - newParentAbsPos.x - newParentPadding.left;
          newRelativeY = absolutePos.y - newParentAbsPos.y - newParentPadding.top;
          // Clamp to ensure non-negative
          newRelativeX = Math.max(0, newRelativeX);
          newRelativeY = Math.max(0, newRelativeY);
        } else {
          newRelativeX = absolutePos.x - newParentAbsPos.x;
          newRelativeY = absolutePos.y - newParentAbsPos.y;
        }
      } else {
        // Moving to root level - use absolute position
        newRelativeX = absolutePos.x;
        newRelativeY = absolutePos.y;
      }
      
      // Get siblings in new parent (excluding the component being moved)
      const newSiblings = prev.components
        .filter(c => {
          const cParentId = c.parentId || null;
          return cParentId === newParentId && c.pageId === pageId && c.id !== componentId;
        })
        .sort((a, b) => {
          // Sort by current order in the array
          const aIndex = prev.components.indexOf(a);
          const bIndex = prev.components.indexOf(b);
          return aIndex - bIndex;
        });
      
      // If newIndex is specified, insert at that position
      let finalSiblings: AppComponent[];
      if (newIndex !== null && newIndex >= 0) {
        const clampedIndex = Math.max(0, Math.min(newIndex, newSiblings.length));
        const updatedComponent = {
          ...component,
          parentId: newParentId, // CRITICAL: Update parentId
          props: {
            ...component.props,
            x: newRelativeX,
            y: newRelativeY,
          },
        };
        finalSiblings = [...newSiblings];
        finalSiblings.splice(clampedIndex, 0, updatedComponent);
      } else {
        // Append to end
        finalSiblings = [
          ...newSiblings,
          {
            ...component,
            parentId: newParentId, // CRITICAL: Update parentId
            props: {
              ...component.props,
              x: newRelativeX,
              y: newRelativeY,
            },
          },
        ];
      }
      
      // Rebuild components array
      const otherComponents = prev.components.filter(c => {
        const cParentId = c.parentId || null;
        return !(cParentId === newParentId && c.pageId === pageId);
      });
      
      const reorderedComponents = [...otherComponents, ...finalSiblings];
      
      // Validate the move: check if the component exists and has correct parentId
      const updatedComponent = reorderedComponents.find(c => c.id === componentId);
      if (!updatedComponent) {
        // Component not found - rollback
        debugLog('MOVE_COMPONENT_FAILED_NOT_FOUND_AFTER_MOVE', {
          componentId,
          reorderedComponentIds: reorderedComponents.map(c => c.id),
          totalComponents: reorderedComponents.length,
        }, true);
        return prev;
      }
      
      // Validate parent relationship - this is the critical check
      const actualParentId = updatedComponent.parentId || null;
      if (actualParentId !== newParentId) {
        // Parent mismatch - rollback
        debugLog('MOVE_COMPONENT_FAILED_PARENT_MISMATCH', {
          componentId,
          expectedParentId: newParentId,
          actualParentId,
          updatedComponent: {
            id: updatedComponent.id,
            parentId: updatedComponent.parentId,
            pageId: updatedComponent.pageId,
          },
        }, true);
        return prev;
      }
      
      // If newParentId is set, do a final validation that parent exists and is a container
      if (newParentId) {
        const newParent = reorderedComponents.find(c => c.id === newParentId);
        if (!newParent) {
          // Parent not found - rollback
          debugLog('MOVE_COMPONENT_FAILED_PARENT_NOT_FOUND_AFTER_MOVE', {
            componentId,
            newParentId,
            reorderedComponentIds: reorderedComponents.map(c => c.id),
          }, true);
          return prev;
        }
        
        const plugin = componentRegistry[newParent.type];
        if (!plugin || !plugin.isContainer) {
          // Parent is not a container - rollback
          debugLog('MOVE_COMPONENT_FAILED_PARENT_NOT_CONTAINER_AFTER_MOVE', {
            componentId,
            newParentId,
            newParentType: newParent.type,
            isContainer: plugin?.isContainer,
          }, true);
          return prev;
        }
      }
      
      // Move successful - component is now a child of the new parent
      debugLog('MOVE_COMPONENT_SUCCESS', {
        componentId,
        oldParentId,
        newParentId,
        oldPosition: { x: originalX, y: originalY },
        newPosition: { x: newRelativeX, y: newRelativeY },
        newIndex,
        absolutePosition: absolutePos,
      });
      
      return {
        ...prev,
        components: reorderedComponents,
      };
    });
  }, []);

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
    // FIX: Add type guards to ensure selectedRecord is an object with an 'id' before access.
    // Cast to `any` to satisfy strict type checking when accessing `id` and spreading.
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
    // FIX: Add type guards to ensure selectedRecord is an object with an 'id' before access.
    // Cast to `any` to satisfy strict type checking when accessing `id`.
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
  /**
   * Constructs the scope object used by the expression evaluation engine.
   * This combines the data store, theme, variables, and component states into a single object.
   * Any change to these dependencies triggers a re-evaluation of expressions.
   */
  const evaluationScope = useMemo(() => {
    const scope = { console, theme: appDefinition.theme, ...dataStore, ...dataSourceContents, ...variableState };
    // Add component states to scope
    components.forEach(c => {
        const props = c.props as any;
        if (props.dataStoreKey) {
            scope[c.id] = {
                value: get(dataStore, props.dataStoreKey),
                ...props // Also expose all props (like placeholder, disabled, etc.)
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
    reorderComponent,
    moveComponentToParent,
  };
};
