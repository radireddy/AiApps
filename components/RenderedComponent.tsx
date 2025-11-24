


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers } from '../types';
import { componentRegistry } from './component-registry/registry';
import { useJavaScriptRenderer } from '../property-renderers/useJavaScriptRenderer';
import { parsePadding } from './component-registry/common';
import { evaluateHidden } from '../utils/disabled-helper';

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
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartInfo = useRef({ x: 0, y: 0, width: 0, height: 0, widthUnit: 'px', heightUnit: 'px' });
  const componentRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false); // Track if component actually moved during drag
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Store initial positions on drag start
  const initialAbsolutePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Store initial absolute positions on drag start
  const rafIdRef = useRef<number | null>(null); // RAF ID for throttling
  const pendingUpdatesRef = useRef<Array<{ id: string; props: { x: number; y: number; } }> | null>(null); // Pending updates

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
    
    if (!isSelected) {
      onSelect(component.id, e);
    }
    setIsDragging(true);
    hasMoved.current = false; // Reset move tracking
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Store initial positions of all selected components for smooth drag
    initialPositionsRef.current.clear();
    initialAbsolutePositionsRef.current.clear();
    
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
          if (parent.type === ComponentType.CONTAINER) {
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
    
    selectedComponentIds.forEach(id => {
      const comp = allComponents.find(c => c.id === id);
      if (comp) {
        initialPositionsRef.current.set(id, {
          x: comp.props.x as number,
          y: comp.props.y as number,
        });
        // Store absolute position for accurate reparenting
        initialAbsolutePositionsRef.current.set(id, getAbsolutePosition(comp, allComponents));
      }
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || mode !== 'edit') return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      // Only consider it a move if the mouse has moved more than a few pixels
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved.current = true;
      }

      // Calculate updates based on initial positions (not current positions) for smoother drag
      // This prevents accumulation errors and makes drag feel more responsive
      const updates = selectedIdsRef.current.map(id => {
        const initialPos = initialPositionsRef.current.get(id);
        if (!initialPos) return null;
        
        // Calculate new position from initial position + total mouse movement
        const totalDx = e.clientX - dragStartPos.current.x;
        const totalDy = e.clientY - dragStartPos.current.y;
        
        return {
          id,
          props: {
            x: initialPos.x + totalDx,
            y: initialPos.y + totalDy,
          }
        };
      }).filter((u): u is { id: string; props: { x: number; y: number; } } => u !== null);

      // Throttle updates using requestAnimationFrame for smooth 60fps rendering
      if (updates.length > 0) {
        pendingUpdatesRef.current = updates;
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            if (pendingUpdatesRef.current && pendingUpdatesRef.current.length > 0) {
              onUpdateComponents(pendingUpdatesRef.current);
              pendingUpdatesRef.current = null;
            }
            rafIdRef.current = null;
          });
        }
      }
    };

    const handleMouseUp = (e?: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        
        // Cancel any pending RAF and apply final update immediately
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        
        // Apply final position updates and reparent immediately
        // Use requestAnimationFrame to ensure DOM updates complete, then reparent
        if (pendingUpdatesRef.current && pendingUpdatesRef.current.length > 0) {
          const finalUpdates = pendingUpdatesRef.current;
          onUpdateComponents(finalUpdates);
          pendingUpdatesRef.current = null;
          
          // Reparent immediately with absolute positions calculated from initial absolute + drag delta
          // This ensures components are reparented using their final drop positions correctly
          if (hasMoved.current && e) {
            selectedIdsRef.current.forEach(id => {
              const initialAbsPos = initialAbsolutePositionsRef.current.get(id);
              const finalUpdate = finalUpdates.find(u => u.id === id);
              
              if (initialAbsPos && finalUpdate) {
                // Calculate absolute position: initial absolute + drag delta
                // The drag delta is the difference between final relative position and initial relative position
                const initialRelPos = initialPositionsRef.current.get(id);
                if (initialRelPos) {
                  const dragDeltaX = (finalUpdate.props.x as number) - initialRelPos.x;
                  const dragDeltaY = (finalUpdate.props.y as number) - initialRelPos.y;
                  const finalAbsoluteX = initialAbsPos.x + dragDeltaX;
                  const finalAbsoluteY = initialAbsPos.y + dragDeltaY;
                  
                  // Pass absolute position to reparentComponent
                  onReparentCheck(id, { x: finalAbsoluteX, y: finalAbsoluteY });
                } else {
                  onReparentCheck(id);
                }
              } else {
                onReparentCheck(id);
              }
            });
          } else if (hasMoved.current) {
            // Fallback: use relative position if we don't have absolute position
            selectedIdsRef.current.forEach(id => {
              const finalUpdate = finalUpdates.find(u => u.id === id);
              if (finalUpdate) {
                onReparentCheck(id, { x: finalUpdate.props.x, y: finalUpdate.props.y });
              } else {
                onReparentCheck(id);
              }
            });
          }
        } else {
          // No pending updates, reparent immediately
          if (hasMoved.current) {
            selectedIdsRef.current.forEach(id => onReparentCheck(id));
          }
        }
        
        hasMoved.current = false; // Reset for next interaction
        initialPositionsRef.current.clear(); // Clear initial positions
        initialAbsolutePositionsRef.current.clear(); // Clear initial absolute positions
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Cancel any pending RAF and apply final update
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pendingUpdatesRef.current && pendingUpdatesRef.current.length > 0) {
        onUpdateComponents(pendingUpdatesRef.current);
        pendingUpdatesRef.current = null;
      }
    };
    // FIX: Removed `selectedComponentIds` from the dependency array. The event listener is now stable
    // throughout the drag operation and relies on refs for fresh data, preventing stale closures.
  }, [isDragging, onUpdateComponents, mode, onReparentCheck]);


  useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || mode !== 'edit') return;
      const dx = e.clientX - resizeStartInfo.current.x;
      const dy = e.clientY - resizeStartInfo.current.y;
      
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
        onUpdate(component.id, {
          width: widthValue,
          height: heightValue,
        });
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
    if (!componentRef.current || !plugin.isContainer) return;

    const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
    if (!type) return;

    const rect = componentRef.current.getBoundingClientRect();
    
    // Calculate padding offset - account for container's padding
    const { left: paddingLeft, top: paddingTop } = parsePadding(component.props.padding);
    
    // Position relative to padding edge (content area), not border edge
    // The position should be relative to the container's content area (after padding)
    const x = event.clientX - rect.left - paddingLeft;
    const y = event.clientY - rect.top - paddingTop;

    onDrop({ type }, x, y, component.id);
  }, [onDrop, component.id, component.props.padding, plugin.isContainer]);

  const handleDragOver = (event: React.DragEvent) => {
    if (plugin.isContainer) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
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
  // Calculate nesting depth
  const getNestingDepth = (compId: string, allComps: AppComponent[]): number => {
    const comp = allComps.find(c => c.id === compId);
    if (!comp || !comp.parentId) return 0;
    return 1 + getNestingDepth(comp.parentId, allComps);
  };
  const nestingDepth = getNestingDepth(component.id, allComponents);
  
  // Base z-index: containers get lower values, non-containers get higher
  // Selected components get a boost to show selection outline
  // Children get higher z-index than parents
  let baseZIndex: number;
  if (plugin.isContainer) {
    // Containers: lower z-index, deeper nesting = even lower
    baseZIndex = 100 - (nestingDepth * 10);
  } else {
    // Non-container children: higher z-index, deeper nesting = even higher
    baseZIndex = 200 + (nestingDepth * 10);
  }
  
  // Selected components get a boost
  const selectedBoost = isSelected ? 1000 : 0;
  
  const componentStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: width, // Can be "400px" or "50%" - CSS will handle it
    height: height, // Can be "300px" or "50%" - CSS will handle it
    zIndex: baseZIndex + selectedBoost,
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
  
  const children = allComponents.filter(c => c.parentId === component.id);

  return (
    <div
      ref={componentRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={componentStyle}
      className={`${mode === 'edit' ? 'select-none' : ''} ${selectionClass} ${cursorClass} ${activeCursorClass}`}
      aria-label={`${component.type} component`}
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