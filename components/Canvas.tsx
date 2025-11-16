

import React, { useRef, useCallback } from 'react';
import { AppComponent, ComponentType, ComponentProps } from '../types';
import { RenderedComponent } from './RenderedComponent';

interface CanvasProps {
  components: AppComponent[];
  allComponents: AppComponent[];
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onSelectComponent: (id: string, e: React.MouseEvent) => void;
  onDeselectCanvas: () => void;
  selectedComponentId: string | null;
  updateComponent: (id: string, newProps: Partial<ComponentProps>) => void;
  onDeleteComponent: (id: string) => void;
  evaluationScope: Record<string, any>;
  onReparentComponent: (componentId: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ components, allComponents, onDrop, onSelectComponent, onDeselectCanvas, selectedComponentId, updateComponent, onDeleteComponent, evaluationScope, onReparentComponent }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
    if (!type) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    onDrop({ type }, x, y, null);
  }, [onDrop]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === canvasRef.current) {
      onDeselectCanvas();
    }
  };
  
  const rootComponents = components.filter(c => !c.parentId);

  return (
    <div
      ref={canvasRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleCanvasClick}
      className="flex-grow relative overflow-hidden"
      style={{
        backgroundColor: '#fbfcfd',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }}
      role="region"
      aria-label="Application design canvas"
      data-testid="canvas"
    >
      {rootComponents.map(comp => (
        <RenderedComponent
          key={comp.id}
          component={comp}
          allComponents={allComponents}
          selectedComponentId={selectedComponentId}
          onSelect={onSelectComponent}
          onUpdate={updateComponent}
          onDelete={onDeleteComponent}
          onDrop={onDrop}
          mode="edit"
          dataStore={{}}
          evaluationScope={evaluationScope}
          onReparentCheck={onReparentComponent}
        />
      ))}
    </div>
  );
};