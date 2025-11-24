


import React, { useRef, useCallback, useState, useEffect } from 'react';
import { AppComponent, ComponentType, ComponentProps } from '../types';
import { RenderedComponent } from './RenderedComponent';

interface CanvasProps {
  components: AppComponent[];
  allComponents: AppComponent[];
  onDrop: (item: { type: ComponentType }, x: number, y: number, parentId: string | null) => void;
  onSelectComponent: (id: string, e: React.MouseEvent) => void;
  onDeselectCanvas: () => void;
  selectedComponentIds: string[];
  onSetSelectedComponentIds: (ids: string[]) => void;
  updateComponent: (id: string, newProps: Partial<ComponentProps>) => void;
  updateComponents: (updates: Array<{ id: string; props: Partial<ComponentProps> }>) => void;
  onDeleteComponent: (id: string) => void;
  evaluationScope: Record<string, any>;
  onReparentComponent: (componentId: string, finalPosition?: { x: number; y: number }) => void;
  currentPageId: string;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  components, 
  allComponents, 
  onDrop, 
  onSelectComponent, 
  onDeselectCanvas, 
  selectedComponentIds, 
  onSetSelectedComponentIds,
  updateComponent,
  updateComponents, 
  onDeleteComponent, 
  evaluationScope, 
  onReparentComponent,
  currentPageId,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const marqueeStartPos = useRef({ x: 0, y: 0 });
  const isMarqueeSelecting = useRef(false);

  // This ref will hold the latest marquee state, allowing the mouseup handler to access it
  // without needing to be re-created on every marquee change.
  const marqueeRef = useRef(marquee);
  useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMarqueeSelecting.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(marqueeStartPos.current.x, currentX);
    const y = Math.min(marqueeStartPos.current.y, currentY);
    const width = Math.abs(currentX - marqueeStartPos.current.x);
    const height = Math.abs(currentY - marqueeStartPos.current.y);
    setMarquee({ x, y, width, height });
  }, []);

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    
    // Use the ref to get the final marquee state, avoiding the stale closure problem.
    const finalMarquee = marqueeRef.current;
    if (isMarqueeSelecting.current && finalMarquee) {
      // If the marquee is very small (less than 5px in both dimensions), treat it as a click
      // and deselect all components instead of selecting any
      const isClick = finalMarquee.width < 5 && finalMarquee.height < 5;
      
      if (!isClick) {
        // Only perform marquee selection if the user actually dragged (not just clicked)
        const getAbsolutePosition = (componentId: string, allComps: AppComponent[]): { x: number; y: number } => {
            const component = allComps.find(c => c.id === componentId);
            if (!component) return { x: 0, y: 0 };

            let absX = component.props.x as number;
            let absY = component.props.y as number;
            let currentParentId = component.parentId;
            
            while (currentParentId) {
                const parent = allComps.find(p => p.id === currentParentId);
                if (parent) {
                    absX += parent.props.x as number;
                    absY += parent.props.y as number;
                    currentParentId = parent.parentId;
                } else {
                    break;
                }
            }
            return { x: absX, y: absY };
        };

        const componentsOnPage = allComponents.filter(c => c.pageId === currentPageId);

        const selectedIds = componentsOnPage.filter(comp => {
          const { x: compX, y: compY } = getAbsolutePosition(comp.id, allComponents);
          const compRect = {
            x1: compX,
            y1: compY,
            x2: compX + (comp.props.width as number),
            y2: compY + (comp.props.height as number),
          };
          const marqueeRect = {
            x1: finalMarquee.x,
            y1: finalMarquee.y,
            x2: finalMarquee.x + finalMarquee.width,
            y2: finalMarquee.y + finalMarquee.height,
          };
          // Check for intersection
          return !(compRect.x1 > marqueeRect.x2 || compRect.x2 < marqueeRect.x1 || compRect.y1 > marqueeRect.y2 || compRect.y2 < marqueeRect.y1);
        }).map(c => c.id);

        if (selectedIds.length > 0) {
          onSetSelectedComponentIds(selectedIds);
        }
      }
      // If it's a click (isClick === true), onDeselectCanvas() was already called in handleMouseDown
      // so we don't need to do anything else - components are already deselected
    }
    isMarqueeSelecting.current = false;
    setMarquee(null);
  }, [allComponents, onSetSelectedComponentIds, handleMouseMove, currentPageId]);


  const handleMouseDown = (e: React.MouseEvent) => {
    // FIX: Only start marquee selection if the mousedown event's direct target is the canvas itself.
    // This prevents marquee from starting when clicking on container components, fixing the selection bug.
    if (e.target !== canvasRef.current) {
        return;
    }

    onDeselectCanvas();
    isMarqueeSelecting.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    marqueeStartPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setMarquee({ x: marqueeStartPos.current.x, y: marqueeStartPos.current.y, width: 0, height: 0 });
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
  };

  const rootComponents = components.filter(c => !c.parentId);

  return (
    <div
      ref={canvasRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseDown={handleMouseDown}
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
          selectedComponentIds={selectedComponentIds}
          onSelect={onSelectComponent}
          onUpdate={updateComponent}
          onUpdateComponents={updateComponents}
          onDelete={onDeleteComponent}
          onDrop={onDrop}
          mode="edit"
          dataStore={{}}
          evaluationScope={evaluationScope}
          onReparentCheck={onReparentComponent}
        />
      ))}
      {marquee && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
    </div>
  );
};