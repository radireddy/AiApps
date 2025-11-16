

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppComponent, ComponentProps, ComponentType, ActionHandlers } from '../types';
import { componentRegistry } from './component-registry/registry';
import { useJavaScriptRenderer } from '../property-renderers/useJavaScriptRenderer';

interface RenderedComponentProps {
  component: AppComponent;
  allComponents: AppComponent[];
  selectedComponentId: string | null;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
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
  selectedComponentId,
  onSelect,
  onUpdate,
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

  const plugin = componentRegistry[component.type];
  const ComponentRenderer = plugin.renderer;
  const isSelected = component.id === selectedComponentId;
  
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
    
    e.stopPropagation();
    onSelect(component.id, e);
    setIsDragging(true);
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'edit') onDelete(component.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode !== 'edit') return;
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
      onUpdate(component.id, { x: (component.props.x as number) + dx, y: (component.props.y as number) + dy });
      dragStartPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onReparentCheck(component.id);
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
  }, [isDragging, onUpdate, component.id, component.props.x, component.props.y, mode, onReparentCheck]);

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
    const x = event.clientX - rect.left + (component.props.x as number);
    const y = event.clientY - rect.top + (component.props.y as number);

    onDrop({ type }, x, y, component.id);
  }, [onDrop, component.id, component.props.x, component.props.y, plugin.isContainer]);

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
    zIndex: plugin.isContainer ? 0 : (isSelected ? 10 : 1),
    display: isHidden ? 'none' : 'block',
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
            selectedComponentId={selectedComponentId}
            onSelect={onSelect}
            onUpdate={onUpdate}
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
      
       {isSelected && mode === 'edit' && !isEditingInline && (
        <>
           <div
            onClick={handleDelete}
            className="absolute -top-3 -right-3 w-6 h-6 bg-white text-gray-600 border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 z-20 transition-all"
            aria-label="Delete Component"
            role="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div
            data-resize-handle="true"
            onMouseDown={handleResizeMouseDown}
            className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-20"
            aria-label="Resize Component"
            role="slider"
          />
        </>
      )}
    </div>
  );
};