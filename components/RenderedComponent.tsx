


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers } from '../types';
import { componentRegistry } from './component-registry/registry';
import { useJavaScriptRenderer } from '../property-renderers/useJavaScriptRenderer';
import { parsePadding } from './component-registry/common';
import { evaluateHidden } from '../utils/disabled-helper';
import { dragState } from '../utils/dragState';
import { ListContext } from './component-registry/ListContext';

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

interface RenderedComponentProps {
  component: AppComponent;
  allComponents: AppComponent[];
  selectedComponentIds: string[];
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  onUpdateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDelete: (id: string) => void;
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onReparentCheck: (id: string, finalPosition?: { x: number; y: number }) => void;
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
}

export const RenderedComponent: React.FC<RenderedComponentProps> = ({
  component,
  allComponents,
  selectedComponentIds,
  onSelect,
  onUpdate,
  onUpdateComponents,
  onDelete,
  onDrop,
  onReparentCheck,
  mode,
  dataStore,
  onUpdateDataStore,
  actions,
  evaluationScope,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragOverCheckRef = useRef<number | null>(null); // For throttling drag over checks
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartInfo = useRef({ x: 0, y: 0, width: 0, height: 0, widthUnit: 'px', heightUnit: 'px' });
  const componentRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false); // Track if component actually moved during drag
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Store initial positions on drag start
  const initialAbsolutePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Store initial absolute positions on drag start
  const initialScreenPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Store initial screen positions (getBoundingClientRect) on drag start
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // Current drag offset for CSS transform
  const parentContainerOverflowRef = useRef<Map<string, string>>(new Map()); // Store original overflow values of parent containers during drag

  // This ref will hold the latest `allComponents` array to avoid stale closures in event handlers.
  const allComponentsRef = useRef(allComponents);
  useEffect(() => {
    allComponentsRef.current = allComponents;
  }, [allComponents]);

  // FIX: This ref ensures the drag handler always has the latest list of selected component IDs,
  // preventing a stale closure if the selection changes at the start of a drag.
  const selectedIdsRef = useRef(selectedComponentIds);
  useEffect(() => {
    selectedIdsRef.current = selectedComponentIds;
  }, [selectedComponentIds]);

  const plugin = componentRegistry[component.type];
  const ComponentRenderer = plugin.renderer;
  const isSelected = selectedComponentIds.includes(component.id);
  
  const isHidden = evaluateHidden(component.props.hidden, evaluationScope);

  // Exit inline editing when component is deselected
  useEffect(() => {
    if (!isSelected) {
      setIsEditingInline(false);
    }
  }, [isSelected]);

  // Subscribe to global drag state for visual feedback on containers
  // Only highlights the innermost container under the mouse
  useEffect(() => {
    if (!plugin.isContainer || mode !== 'edit') return;
    
    let lastCheckTime = 0;
    const THROTTLE_MS = 16; // Check at ~60fps for smoother updates
    
    const checkDragOver = () => {
      const now = performance.now();
      if (now - lastCheckTime < THROTTLE_MS) {
        return; // Skip if too soon
      }
      lastCheckTime = now;
      
      const state = dragState.getState();
      // Only show highlight if dragging and not dragging this component itself
      if (state.isDragging && !state.draggedComponentIds.includes(component.id) && componentRef.current) {
        const rect = componentRef.current.getBoundingClientRect();
        const isOverContainer = (
          state.mouseX >= rect.left &&
          state.mouseX <= rect.right &&
          state.mouseY >= rect.top &&
          state.mouseY <= rect.bottom
        );
        
        // Only highlight if this is the highlighted container (innermost one)
        const shouldHighlight = isOverContainer && state.highlightedContainerId === component.id;
        
        // Throttle drag over state updates to avoid excessive re-renders
        if (dragOverCheckRef.current !== null) {
          cancelAnimationFrame(dragOverCheckRef.current);
        }
        
        dragOverCheckRef.current = requestAnimationFrame(() => {
          setIsDragOver(shouldHighlight);
          dragOverCheckRef.current = null;
        });
      } else {
        if (dragOverCheckRef.current !== null) {
          cancelAnimationFrame(dragOverCheckRef.current);
          dragOverCheckRef.current = null;
        }
        setIsDragOver(false);
      }
    };
    
    const unsubscribe = dragState.subscribe(() => {
      checkDragOver();
    });
    
    // Also check on mount in case drag is already in progress
    checkDragOver();
    
    return () => {
      unsubscribe();
      if (dragOverCheckRef.current !== null) {
        cancelAnimationFrame(dragOverCheckRef.current);
        dragOverCheckRef.current = null;
      }
    };
  }, [plugin.isContainer, mode, component.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'edit' || isEditingInline) return;
    if ((e.target as HTMLElement).dataset.resizeHandle) return;
    
    // Don't handle mousedown if clicking on the delete button or any of its children
    const target = e.target as HTMLElement;
    const deleteButton = target.closest('[data-delete-button="true"]') || target.closest('[aria-label="Delete Component"]');
    if (deleteButton) {
      // Let the delete button handle its own events
      return;
    }
    
    // Also check if the click originated from within the delete button area
    // by checking if the target or its parent has the delete button data attribute
    if (target.getAttribute('data-delete-button') === 'true' || 
        target.closest('[data-delete-button="true"]') ||
        target.getAttribute('aria-label') === 'Delete Component' ||
        target.closest('[aria-label="Delete Component"]')) {
      return;
    }

    // FIX: Removed logic that allowed clicks on container backgrounds to "pass through".
    // Now, any click on any part of a component will select it and stop the event,
    // allowing containers to be selected and moved properly.
    e.stopPropagation();
    
    // CRITICAL FIX: Determine which components will be selected for this drag
    // If this component is not selected, it will become the only selected component
    // Otherwise, use the current selection
    const componentsToDrag = !isSelected ? [component.id] : selectedComponentIds;
    
    // CRITICAL: Update selectedIdsRef immediately to ensure handleMouseUp has correct IDs
    selectedIdsRef.current = componentsToDrag;
    
    if (!isSelected) {
      onSelect(component.id, e);
    }
    setIsDragging(true);
    hasMoved.current = false; // Reset move tracking
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Update global drag state with the actual components that will be dragged
    dragState.startDrag(componentsToDrag);
    
    // Store initial positions of all selected components for smooth drag
    initialPositionsRef.current.clear();
    initialAbsolutePositionsRef.current.clear();
    initialScreenPositionsRef.current.clear();
    dragOffsetRef.current = { x: 0, y: 0 };
    
    // Store initial screen positions (getBoundingClientRect) for fixed positioning during drag
    // Use componentsToDrag instead of selectedComponentIds to include the newly selected component
    componentsToDrag.forEach(id => {
      const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        initialScreenPositionsRef.current.set(id, {
          x: rect.left,
          y: rect.top,
        });
      }
    });
    
    // Helper to calculate absolute position
    const getAbsolutePosition = (comp: AppComponent, allComps: AppComponent[]): { x: number; y: number } => {
      let absX = comp.props.x as number;
      let absY = comp.props.y as number;
      let currentParentId = comp.parentId;
      const visited = new Set<string>();
      
      while (currentParentId) {
        if (visited.has(currentParentId)) break;
        visited.add(currentParentId);
        const parent = allComps.find(p => p.id === currentParentId);
        if (parent) {
          absX += parent.props.x as number;
          absY += parent.props.y as number;
          if (parent.type === ComponentType.CONTAINER || parent.type === ComponentType.LIST) {
            const paddingStr = parent.props.padding as string | number | undefined;
            let paddingLeft = 0;
            let paddingTop = 0;
            if (paddingStr !== undefined) {
              if (typeof paddingStr === 'number') {
                paddingLeft = paddingTop = paddingStr;
              } else {
                const parts = String(paddingStr).trim().split(/\s+/);
                if (parts.length >= 1) {
                  paddingTop = parseFloat(parts[0]) || 0;
                  paddingLeft = parts.length >= 4 ? (parseFloat(parts[3]) || 0) : (parts.length >= 2 ? (parseFloat(parts[1]) || 0) : paddingTop);
                }
              }
            }
            absX += paddingLeft;
            absY += paddingTop;
          }
          currentParentId = parent.parentId;
        } else {
          break;
        }
      }
      return { x: absX, y: absY };
    };
    
    // Collect refs to all dragged components for direct DOM manipulation
    // Use componentsToDrag to ensure we store positions for the component being clicked
    componentsToDrag.forEach(id => {
      const comp = allComponents.find(c => c.id === id);
      if (comp) {
        initialPositionsRef.current.set(id, {
          x: comp.props.x as number,
          y: comp.props.y as number,
        });
        // Store absolute position for accurate reparenting
        initialAbsolutePositionsRef.current.set(id, getAbsolutePosition(comp, allComponents));
        
        // Find all ancestor containers and temporarily set overflow to visible to prevent clipping during drag
        // This handles nested containers (e.g., Container -> Container -> Component)
        let currentParentId = comp.parentId;
        while (currentParentId) {
          const parentElement = document.querySelector(`[data-component-id="${currentParentId}"]`) as HTMLElement;
          if (parentElement) {
            // The container element is the first direct child div of the RenderedComponent wrapper
            // (BaseContainerRenderer/PanelRenderer creates a div with overflow: hidden)
            const containerElement = parentElement.firstElementChild as HTMLElement;
            if (containerElement && containerElement.tagName === 'DIV') {
              const computedStyle = window.getComputedStyle(containerElement);
              const originalOverflow = containerElement.style.overflow || computedStyle.overflow;
              if (originalOverflow === 'hidden') {
                // Only store and modify if we haven't already done so for this parent
                if (!parentContainerOverflowRef.current.has(currentParentId)) {
                  parentContainerOverflowRef.current.set(currentParentId, originalOverflow);
                  containerElement.style.overflow = 'visible';
                }
              }
            }
          }
          // Move up to the next parent
          const parentComp = allComponents.find(c => c.id === currentParentId);
          currentParentId = parentComp?.parentId || null;
        }
      } else {
        // DEBUG_LOGGING: Component not found when storing initial position
        debugLog('DRAG_START_COMPONENT_NOT_FOUND', {
          componentId: id,
          availableComponentIds: allComponents.map(c => c.id),
          componentsToDrag,
        }, true);
      }
    });
    
    // DEBUG_LOGGING: Log what we stored
    debugLog('DRAG_START_STORED_POSITIONS', {
      componentsToDrag,
      storedInitialPositions: Array.from(initialPositionsRef.current.keys()),
      storedAbsolutePositions: Array.from(initialAbsolutePositionsRef.current.keys()),
      storedScreenPositions: Array.from(initialScreenPositionsRef.current.keys()),
      selectedIdsRefValue: selectedIdsRef.current,
    });
  };
  
  const handleDoubleClick = () => {
    if (mode !== 'edit') return;
    if (component.type === ComponentType.LABEL || component.type === ComponentType.BUTTON || component.type === ComponentType.INPUT) {
      setIsEditingInline(true);
    }
  };

  const handleCommitInlineEdit = (newValue: string) => {
    const propToUpdate = component.type === ComponentType.INPUT ? 'placeholder' : 'text';
    onUpdate(component.id, { [propToUpdate]: newValue } as Partial<ComponentProps>);
    setIsEditingInline(false);
  };


  const handleDeleteMouseDown = (e: React.MouseEvent) => {
    // Prevent the delete button click from triggering component selection
    // Stop propagation immediately to prevent wrapper's handleMouseDown from firing
    e.stopPropagation();
    e.preventDefault();
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Ensure delete click is handled
    e.stopPropagation();
    e.preventDefault();
    if (mode === 'edit') {
      onDelete(component.id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode !== 'edit' || selectedComponentIds.length > 1) return; // Disable resizing for multi-select
    
    // Parse width/height to numbers for resize calculations
    // Also store the original units to preserve them during resize
    const parseSizeToNumber = (size: any): number => {
      if (typeof size === 'number') return size;
      if (typeof size === 'string' && size.trim()) {
        const match = size.trim().match(/^(\d+(?:\.\d+)?)(px|%)$/);
        if (match) return parseFloat(match[1]);
      }
      return 400; // default
    };
    
    const getSizeUnit = (size: any): string => {
      if (typeof size === 'string' && size.trim()) {
        const match = size.trim().match(/^(\d+(?:\.\d+)?)(px|%)$/);
        if (match) return match[2];
      }
      return 'px'; // default to px
    };
    
    // Store both numeric values and units for resize
    const originalWidth = component.props.width;
    const originalHeight = component.props.height;
    const widthNum = parseSizeToNumber(originalWidth);
    const heightNum = parseSizeToNumber(originalHeight);
    const widthUnit = getSizeUnit(originalWidth);
    const heightUnit = getSizeUnit(originalHeight);
    
    setIsResizing(true);
    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      width: widthNum,
      height: heightNum,
      // Store units in the ref so we can use them during resize
      widthUnit: widthUnit,
      heightUnit: heightUnit,
    } as any;
  };

  useEffect(() => {
    let rafId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || mode !== 'edit') return;
      
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      // Only consider it a move if the mouse has moved more than a few pixels
      const moved = Math.abs(dx) > 2 || Math.abs(dy) > 2;
      if (moved) {
        hasMoved.current = true;
      }

      // Only update global drag state and find containers if we've actually moved
      // This prevents unnecessary state updates and container highlighting on simple clicks
      if (hasMoved.current) {
        dragState.updateMousePosition(e.clientX, e.clientY);
        
        // Find the innermost container under the mouse cursor
        // Check all containers and find the smallest one (innermost) that contains the mouse
        let innermostContainerId: string | null = null;
        let smallestArea = Infinity;
        
        allComponentsRef.current.forEach(comp => {
          const compPlugin = componentRegistry[comp.type];
          // Skip if not a container, is being dragged, or not on the same page
          if (!compPlugin?.isContainer || 
              selectedIdsRef.current.includes(comp.id) ||
              comp.pageId !== component.pageId) {
            return;
          }
          
          const containerElement = document.querySelector(`[data-component-id="${comp.id}"]`) as HTMLElement;
          if (!containerElement) return;
          
          const rect = containerElement.getBoundingClientRect();
          // Check if mouse is within container bounds
          if (e.clientX >= rect.left && 
              e.clientX <= rect.right && 
              e.clientY >= rect.top && 
              e.clientY <= rect.bottom) {
            // Calculate area - smaller area means more nested/innermost
            const area = rect.width * rect.height;
            if (area < smallestArea) {
              smallestArea = area;
              innermostContainerId = comp.id;
            }
          }
        });
        
        // Update highlighted container (only the innermost one)
        dragState.setHighlightedContainer(innermostContainerId);
      }

      // Update drag offset for CSS transform (no state updates during drag)
      dragOffsetRef.current = { x: dx, y: dy };

      // Use CSS transforms for smooth drag preview without React re-renders
      // Apply transform directly to DOM elements for instant visual feedback
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        selectedIdsRef.current.forEach(id => {
          // Find the component element in the DOM (cached lookup)
          const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
          if (element) {
            // CRITICAL FIX: Only apply transforms/styles if component has actually moved
            // This prevents components from jumping or having their layout messed up on simple clicks
            if (hasMoved.current) {
              // Use transform instead of fixed positioning to avoid layout issues
              // Transform doesn't affect the component's actual position, preventing layout jumps
              element.style.transform = `translate(${dx}px, ${dy}px)`;
              element.style.willChange = 'transform';
              element.style.pointerEvents = 'none'; // Prevent interaction during drag
              // Increase z-index to ensure dragged component stays on top
              if (element.style.zIndex !== '10000') {
                element.style.zIndex = '10000';
              }
            }
            // If not moved yet, don't apply any transforms at all - this prevents layout issues
          }
        });
        rafId = null;
      });
    };

    const handleMouseUp = (e?: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setIsDragOver(false); // Clear drag over state when drag ends
        
        // Cancel any pending RAF
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        
        // Calculate position updates first
        const updates: Array<{ id: string; props: { x: number; y: number; } }> = [];
        const dx = dragOffsetRef.current.x;
        const dy = dragOffsetRef.current.y;
        
        // DEBUG_LOGGING: Log drag operation
        debugLog('DRAG_END', {
          componentId: component.id,
          hasMoved: hasMoved.current,
          dragOffset: { dx, dy },
          selectedIds: selectedIdsRef.current,
          initialPositions: Array.from(initialPositionsRef.current.entries()),
        });
        
        // Only update positions if component actually moved
        if (hasMoved.current && (dx !== 0 || dy !== 0)) {
          selectedIdsRef.current.forEach(id => {
            const initialPos = initialPositionsRef.current.get(id);
            if (initialPos) {
              updates.push({
                id,
                props: {
                  x: initialPos.x + dx,
                  y: initialPos.y + dy,
                }
              });
            } else {
              // DEBUG_LOGGING: Missing initial position
              debugLog('DRAG_FAILED_MISSING_INITIAL_POS', {
                componentId: id,
                allInitialPositions: Array.from(initialPositionsRef.current.keys()),
              }, true);
            }
          });
          
          // Apply position updates FIRST - this triggers React re-render with correct position
          if (updates.length > 0) {
            try {
              onUpdateComponents(updates);
              debugLog('DRAG_POSITION_UPDATED', {
                updates: updates,
                updateCount: updates.length,
              });
            } catch (error) {
              debugLog('DRAG_UPDATE_FAILED', {
                error: error instanceof Error ? error.message : String(error),
                updates: updates,
                stack: error instanceof Error ? error.stack : undefined,
              }, true);
            }
          } else {
            debugLog('DRAG_NO_UPDATES', {
              reason: 'No updates generated despite movement',
              hasMoved: hasMoved.current,
              dragOffset: { dx, dy },
            }, true);
          }
          
          // Reparent immediately with absolute positions calculated from initial absolute + drag delta
          if (e) {
            selectedIdsRef.current.forEach(id => {
              const initialAbsPos = initialAbsolutePositionsRef.current.get(id);
              const initialRelPos = initialPositionsRef.current.get(id);
              
              try {
                if (initialAbsPos && initialRelPos) {
                  const finalAbsoluteX = initialAbsPos.x + dx;
                  const finalAbsoluteY = initialAbsPos.y + dy;
                  
                  // Pass absolute position to reparentComponent
                  onReparentCheck(id, { x: finalAbsoluteX, y: finalAbsoluteY });
                  debugLog('DRAG_REPARENT_CALLED', {
                    componentId: id,
                    finalAbsolutePosition: { x: finalAbsoluteX, y: finalAbsoluteY },
                    initialAbsolutePosition: initialAbsPos,
                    initialRelativePosition: initialRelPos,
                    dragOffset: { dx, dy },
                  });
                } else {
                  onReparentCheck(id);
                  debugLog('DRAG_REPARENT_WITHOUT_POSITION', {
                    componentId: id,
                    hasInitialAbsPos: !!initialAbsPos,
                    hasInitialRelPos: !!initialRelPos,
                  }, true);
                }
              } catch (error) {
                debugLog('DRAG_REPARENT_FAILED', {
                  componentId: id,
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                  initialAbsPos,
                  initialRelPos,
                  dragOffset: { dx, dy },
                }, true);
              }
            });
          }
        } else {
          debugLog('DRAG_NO_MOVEMENT', {
            componentId: component.id,
            hasMoved: hasMoved.current,
            dragOffset: { dx, dy },
          });
        }
        
        // CRITICAL: Clean up drag styles AFTER state update, but use requestAnimationFrame
        // to ensure React has had time to apply the new styles from props before we remove transforms
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { // Double RAF to ensure render has completed
            selectedIdsRef.current.forEach(id => {
              const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
              if (element) {
                // Remove all drag-specific inline styles we added
                element.style.removeProperty('transform');
                element.style.removeProperty('will-change');
                element.style.removeProperty('pointer-events');
                // Only clear z-index if we set it to a very high value during drag
                if (element.style.zIndex === '10000') {
                  element.style.removeProperty('z-index');
                }
              }
            });
            
            // Restore parent container overflow values
            parentContainerOverflowRef.current.forEach((originalOverflow, parentId) => {
              const parentElement = document.querySelector(`[data-component-id="${parentId}"]`) as HTMLElement;
              if (parentElement) {
                const containerElement = parentElement.firstElementChild as HTMLElement;
                if (containerElement && containerElement.tagName === 'DIV') {
                  containerElement.style.overflow = originalOverflow;
                }
              }
            });
            parentContainerOverflowRef.current.clear();
          });
        });
        
        // Clear highlighted container and end global drag state
        dragState.setHighlightedContainer(null);
        dragState.endDrag();
        
        hasMoved.current = false; // Reset for next interaction
        initialPositionsRef.current.clear(); // Clear initial positions
        initialAbsolutePositionsRef.current.clear(); // Clear initial absolute positions
        initialScreenPositionsRef.current.clear(); // Clear initial screen positions
        dragOffsetRef.current = { x: 0, y: 0 };
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Clean up any drag styles - restore original positioning
      // Always cleanup to ensure no leftover styles interfere with normal rendering
      setTimeout(() => {
        selectedIdsRef.current.forEach(id => {
          const element = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement;
          if (element) {
            // Remove all drag-specific inline styles we added during drag
            element.style.removeProperty('transform');
            element.style.removeProperty('will-change');
            element.style.removeProperty('pointer-events');
            // Only clear z-index if it was set to a very high value during drag
            if (element.style.zIndex === '10000') {
              element.style.removeProperty('z-index');
            }
            // Force a reflow to ensure styles are applied
            void element.offsetHeight;
          }
        });
        
        // Restore parent container overflow values
        parentContainerOverflowRef.current.forEach((originalOverflow, parentId) => {
          const parentElement = document.querySelector(`[data-component-id="${parentId}"]`) as HTMLElement;
          if (parentElement) {
            const containerElement = parentElement.firstElementChild as HTMLElement;
            if (containerElement && containerElement.tagName === 'DIV') {
              containerElement.style.overflow = originalOverflow;
            }
          }
        });
        parentContainerOverflowRef.current.clear();
      }, 0);
    };
    // FIX: Removed `selectedComponentIds` from the dependency array. The event listener is now stable
    // throughout the drag operation and relies on refs for fresh data, preventing stale closures.
  }, [isDragging, onUpdateComponents, mode, onReparentCheck]);


  useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || mode !== 'edit') return;
      const dx = e.clientX - resizeStartInfo.current.x;
      const dy = e.clientY - resizeStartInfo.current.y;
      
      try {
        // Calculate new dimensions ensuring they're always valid positive numbers
        // Round to avoid decimal precision issues
        const newWidthNum = Math.max(20, Math.round(resizeStartInfo.current.width + dx));
        const newHeightNum = Math.max(20, Math.round(resizeStartInfo.current.height + dy));
        
        // Check if this is a container component (supports string width/height with units)
        const isContainer = plugin.isContainer;
        
        let widthValue: number | string;
        let heightValue: number | string;
        
        if (isContainer) {
          // For containers, use string values with units (px or %)
          const widthUnit = (resizeStartInfo.current as any).widthUnit || 'px';
          const heightUnit = (resizeStartInfo.current as any).heightUnit || 'px';
          widthValue = `${newWidthNum}${widthUnit}`;
          heightValue = `${newHeightNum}${heightUnit}`;
        } else {
          // For non-container components, use numeric values
          widthValue = newWidthNum;
          heightValue = newHeightNum;
        }
        
        // Only update if values have actually changed to avoid unnecessary re-renders
        const currentWidth = component.props.width;
        const currentHeight = component.props.height;
        if (currentWidth !== widthValue || currentHeight !== heightValue) {
          debugLog('RESIZE_UPDATE', {
            componentId: component.id,
            oldSize: { width: currentWidth, height: currentHeight },
            newSize: { width: widthValue, height: heightValue },
            resizeDelta: { dx, dy },
            isContainer,
          });
          
          try {
            onUpdate(component.id, {
              width: widthValue,
              height: heightValue,
            });
          } catch (error) {
            debugLog('RESIZE_UPDATE_FAILED', {
              componentId: component.id,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              newSize: { width: widthValue, height: heightValue },
              resizeDelta: { dx, dy },
            }, true);
          }
        }
      } catch (error) {
        debugLog('RESIZE_EXCEPTION', {
          componentId: component.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          resizeStartInfo: resizeStartInfo.current,
          mousePosition: { x: e.clientX, y: e.clientY },
        }, true);
      }
    };
    const handleResizeMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMouseMove);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, onUpdate, component.id, mode]);
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    // DEBUG_LOGGING: Log drop attempt
    debugLog('DROP_ATTEMPT', {
      componentId: component.id,
      componentType: component.type,
      isContainer: plugin.isContainer,
      hasComponentRef: !!componentRef.current,
      dropPosition: { clientX: event.clientX, clientY: event.clientY },
    });
    
    if (!componentRef.current || !plugin.isContainer) {
      debugLog('DROP_FAILED_INVALID_TARGET', {
        componentId: component.id,
        hasComponentRef: !!componentRef.current,
        isContainer: plugin.isContainer,
      }, true);
      return;
    }

    const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
    if (!type) {
      debugLog('DROP_FAILED_NO_TYPE', {
        componentId: component.id,
        dataTransferTypes: event.dataTransfer.types,
        availableData: Array.from(event.dataTransfer.types).map(t => ({
          type: t,
          data: event.dataTransfer.getData(t),
        })),
      }, true);
      return;
    }

    try {
      const rect = componentRef.current.getBoundingClientRect();
      
      // Calculate padding offset - account for container's padding
      const { left: paddingLeft, top: paddingTop } = parsePadding(component.props.padding);
      
      // Position relative to padding edge (content area), not border edge
      // The position should be relative to the container's content area (after padding)
      const x = event.clientX - rect.left - paddingLeft;
      const y = event.clientY - rect.top - paddingTop;

      debugLog('DROP_CALCULATED_POSITION', {
        componentId: component.id,
        droppedType: type,
        containerRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        padding: { left: paddingLeft, top: paddingTop },
        calculatedPosition: { x, y },
        clientPosition: { x: event.clientX, y: event.clientY },
      });

      onDrop({ type }, x, y, component.id);
      
      debugLog('DROP_SUCCESS', {
        componentId: component.id,
        droppedType: type,
        position: { x, y },
        parentId: component.id,
      });
    } catch (error) {
      debugLog('DROP_EXCEPTION', {
        componentId: component.id,
        droppedType: type,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, true);
    }
  }, [onDrop, component.id, component.type, component.props.padding, plugin.isContainer]);

  const handleDragOver = (event: React.DragEvent) => {
    if (plugin.isContainer && mode === 'edit') {
      // Check if something is being dragged
      // Note: getData might not work during dragover in some browsers, so we check types instead
      const hasDragData = event.dataTransfer.types.length > 0;
      
      // Show visual feedback if dragging anything (new component from palette or existing component)
      if (hasDragData) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Only clear if we're actually leaving the element (not just moving to a child)
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDropEnd = () => {
    setIsDragOver(false);
  };


  const p = component.props;
  // Ensure x, y are numbers (not expressions)
  const x = typeof p.x === 'number' ? p.x : (typeof p.x === 'string' ? parseFloat(p.x) || 0 : 0);
  const y = typeof p.y === 'number' ? p.y : (typeof p.y === 'string' ? parseFloat(p.y) || 0 : 0);
  
  // Parse width and height - support both px and % values
  // For containers, width/height can be strings like "400px" or "50%"
  const parseSize = (size: any, defaultValue: string): string => {
    if (typeof size === 'number') {
      return `${size}px`; // Convert number to px string
    }
    if (typeof size === 'string') {
      const trimmed = size.trim();
      // If it's already a valid format (number + px or %), use it
      if (trimmed.match(/^\d+(?:\.\d+)?(px|%)$/)) {
        return trimmed;
      }
      // If it's just a number, assume px
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) {
        return `${numValue}px`;
      }
    }
    return defaultValue;
  };
  
  const width = parseSize(p.width, '400px');
  const height = parseSize(p.height, '300px');
  
  // Calculate z-index based on nesting depth and component type
  // Containers should have lower z-index (stay in background)
  // Children should have higher z-index (always on top)
  // But if component has explicit zIndex prop, use that as base instead
  const explicitZIndex = (component.props as any).zIndex;
  
  // Selected components get a boost to show selection outline
  const selectedBoost = isSelected ? 1000 : 0;
  // Dragged components get an even higher z-index to stay visible above all containers
  const dragBoost = isDragging ? 10000 : 0;
  
  let finalZIndex: number;
  if (explicitZIndex !== undefined && explicitZIndex !== null) {
    // Use explicit z-index from props as base, but still apply boosts for selection/dragging
    const baseZIndex = typeof explicitZIndex === 'number' ? explicitZIndex : parseFloat(String(explicitZIndex)) || 0;
    finalZIndex = baseZIndex + selectedBoost + dragBoost;
  } else {
    // Calculate nesting depth
    const getNestingDepth = (compId: string, allComps: AppComponent[]): number => {
      const comp = allComps.find(c => c.id === compId);
      if (!comp || !comp.parentId) return 0;
      return 1 + getNestingDepth(comp.parentId, allComps);
    };
    const nestingDepth = getNestingDepth(component.id, allComponents);
    
    // Base z-index: containers get lower values, non-containers get higher
    // Children get higher z-index than parents
    let baseZIndex: number;
    if (plugin.isContainer) {
      // Containers: lower z-index, deeper nesting = even lower
      baseZIndex = 100 - (nestingDepth * 10);
    } else {
      // Non-container children: higher z-index, deeper nesting = even higher
      baseZIndex = 200 + (nestingDepth * 10);
    }
    
    finalZIndex = baseZIndex + selectedBoost + dragBoost;
  }
  
  const componentStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`, // Ensure pixel units for proper CSS rendering
    top: `${y}px`, // Ensure pixel units for proper CSS rendering
    width: width, // Can be "400px" or "50%" - CSS will handle it
    height: height, // Can be "300px" or "50%" - CSS will handle it
    zIndex: finalZIndex,
    // In edit mode, hidden components should be visible but with reduced opacity to indicate they're hidden
    // In preview mode, use display: none to completely hide them
    ...(isHidden 
      ? (mode === 'edit' 
        ? { opacity: 0.3, pointerEvents: 'auto' as const, display: 'block' } 
        : { display: 'none' })
      : { display: 'block' }),
    // Ensure overflow is visible so delete button positioned outside bounds is not clipped
    overflow: 'visible',
  };

  const selectionClass = isSelected && mode === 'edit' ? 'outline outline-2 outline-blue-500 outline-offset-2' : '';
  const cursorClass = mode === 'edit' ? 'cursor-grab' : '';
  const activeCursorClass = isDragging ? 'cursor-grabbing' : '';
  // Visual feedback when dragging over a container/panel - smooth transition
  const dragOverClass = isDragOver && plugin.isContainer && mode === 'edit' 
    ? 'ring-4 ring-blue-400 ring-offset-2 bg-blue-50/50 border-2 border-blue-400 border-dashed transition-all duration-150 ease-out' 
    : '';
  
  // For List components, don't render template children here because List handles its own children rendering:
  // - In edit mode: TemplateContainerRenderer renders template children
  // - In preview mode: ListItemRenderer renders cloned items
  // If we render them here too, we get duplicate rendering
  const shouldRenderChildren = component.type !== ComponentType.LIST;
  const children = shouldRenderChildren 
    ? allComponents.filter(c => c.parentId === component.id)
    : [];

  return (
    <div
      ref={componentRef}
      data-component-id={component.id}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDropEnd}
      style={componentStyle}
      className={`${mode === 'edit' ? 'select-none' : ''} ${selectionClass} ${cursorClass} ${activeCursorClass} ${dragOverClass}`}
      aria-label={`${component.type} component`}
    >
      <ListContext.Provider
        value={{
          allComponents,
          selectedComponentIds,
          onSelect,
          onUpdate,
          onUpdateComponents,
          onDelete,
          onDrop,
          onReparentCheck,
          dataStore,
          onUpdateDataStore,
          actions,
          currentComponentId: component.id, // Add current component id for List components
        } as any}
      >
        <ComponentRenderer
          component={component}
          mode={mode}
          dataStore={dataStore}
          onUpdateDataStore={onUpdateDataStore}
          actions={actions}
          isEditingInline={isEditingInline}
          onCommitInlineEdit={handleCommitInlineEdit}
          evaluationScope={evaluationScope}
        >
          {/* Render children recursively */}
          {/* For List in preview mode, children are handled by ListComponentRenderer */}
          {children.map(child => (
            <RenderedComponent
              key={child.id}
              component={child}
              allComponents={allComponents}
              selectedComponentIds={selectedComponentIds}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onUpdateComponents={onUpdateComponents}
              onDelete={onDelete}
              onDrop={onDrop}
              mode={mode}
              dataStore={dataStore}
              onUpdateDataStore={onUpdateDataStore}
              actions={actions}
              evaluationScope={evaluationScope}
              onReparentCheck={onReparentCheck}
            />
          ))}
        </ComponentRenderer>
      </ListContext.Provider>
      
      {/* Delete button and resize handle rendered after ComponentRenderer to ensure they're on top */}
      {isSelected && mode === 'edit' && !isEditingInline && (
        <>
           <div
            onClick={handleDeleteClick}
            onMouseDown={handleDeleteMouseDown}
            className="absolute -top-3 -right-3 w-6 h-6 bg-white text-gray-600 border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-lg"
            aria-label="Delete Component"
            role="button"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000, // Very high z-index to ensure it's above everything
              position: 'absolute',
            }}
            data-delete-button="true"
            onMouseUp={(e) => {
              // Also stop propagation on mouseup to be safe
              e.stopPropagation();
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (mode === 'edit') {
                  onDelete(component.id);
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          {selectedComponentIds.length === 1 && (
            <div
                data-resize-handle="true"
                onMouseDown={handleResizeMouseDown}
                className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-20"
                aria-label="Resize Component"
                role="slider"
            />
           )}
        </>
      )}
    </div>
  );
};