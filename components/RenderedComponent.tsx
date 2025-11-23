


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers } from '../types';
import { componentRegistry } from './component-registry/registry';
import { useJavaScriptRenderer } from '../property-renderers/useJavaScriptRenderer';
import { parsePadding } from './component-registry/common';

interface RenderedComponentProps {
  component: AppComponent;
  allComponents: AppComponent[];
  selectedComponentIds: string[];
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  onUpdateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDelete: (id: string) => void;
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onReparentCheck: (id: string) => void;
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
  const resizeStartInfo = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const componentRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false); // Track if component actually moved during drag

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
  
  const isHidden = !!useJavaScriptRenderer(component.props.hidden, evaluationScope, false);

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
    setIsResizing(true);
    resizeStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      width: component.props.width as number,
      height: component.props.height as number,
    };
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

      // FIX: Read from the refs to get the latest list of selected IDs and component data,
      // ensuring all selected components move together correctly.
      const updates = selectedIdsRef.current.map(id => {
        const compToUpdate = allComponentsRef.current.find(c => c.id === id);
        if (!compToUpdate) return null;
        return {
          id,
          props: {
            x: (compToUpdate.props.x as number) + dx,
            y: (compToUpdate.props.y as number) + dy,
          }
        };
      }).filter((u): u is { id: string; props: { x: number; y: number; } } => u !== null);

      if (updates.length > 0) {
        onUpdateComponents(updates);
      }
      
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Only call reparentComponent if the component actually moved (was dragged, not just clicked)
        if (hasMoved.current) {
          selectedIdsRef.current.forEach(id => onReparentCheck(id));
        }
        hasMoved.current = false; // Reset for next interaction
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // FIX: Removed `selectedComponentIds` from the dependency array. The event listener is now stable
    // throughout the drag operation and relies on refs for fresh data, preventing stale closures.
  }, [isDragging, onUpdateComponents, mode, onReparentCheck]);


  useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || mode !== 'edit') return;
      const dx = e.clientX - resizeStartInfo.current.x;
      const dy = e.clientY - resizeStartInfo.current.y;
      onUpdate(component.id, {
        width: Math.max(20, resizeStartInfo.current.width + dx),
        height: Math.max(20, resizeStartInfo.current.height + dy),
      });
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
    
    // Calculate padding offset - account for parent's padding
    const { left: paddingLeft, top: paddingTop } = parsePadding(component.props.padding);
    
    // Position relative to padding edge, not border edge
    const x = event.clientX - rect.left - paddingLeft + (component.props.x as number);
    const y = event.clientY - rect.top - paddingTop + (component.props.y as number);

    onDrop({ type }, x, y, component.id);
  }, [onDrop, component.id, component.props.x, component.props.y, component.props.padding, plugin.isContainer]);

  const handleDragOver = (event: React.DragEvent) => {
    if (plugin.isContainer) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  };


  const p = component.props;
  const componentStyle: React.CSSProperties = {
    position: 'absolute',
    left: p.x,
    top: p.y,
    width: p.width,
    height: p.height,
    // Containers should also get higher z-index when selected to show selection outline
    zIndex: plugin.isContainer ? (isSelected ? 10 : 0) : (isSelected ? 10 : 1),
    // In edit mode, hidden components should still be selectable, so use opacity instead of display
    // In preview mode, use display: none to completely hide them
    ...(isHidden 
      ? (mode === 'edit' 
        ? { opacity: 0, pointerEvents: 'auto' as const, display: 'block' } 
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