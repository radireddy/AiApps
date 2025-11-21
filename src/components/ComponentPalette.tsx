import React from 'react';
import { ComponentPlugin } from '@/types';
import { componentRegistry } from '@/components/component-registry/registry';

interface ComponentPaletteProps {
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const PaletteItem: React.FC<{ componentPlugin: ComponentPlugin }> = ({ componentPlugin }) => {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', componentPlugin.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-md cursor-grab bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all text-center"
      title={`Drag to add a ${componentPlugin.paletteConfig.label}`}
      aria-label={`${componentPlugin.paletteConfig.label} component`}
      data-testid={`palette-item-${componentPlugin.type}`}
    >
      {componentPlugin.paletteConfig.icon}
      <span className="text-xs font-semibold mt-1">{componentPlugin.paletteConfig.label}</span>
    </div>
  );
};

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ width, isCollapsed, onToggleCollapse }) => {
  if (isCollapsed) {
    return (
      <aside className="w-10 bg-white border-r border-gray-200 flex flex-col items-center py-3 shrink-0" role="region" aria-label="Components">
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
            aria-label="Expand Components"
            aria-expanded="false"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside style={{ width: `${width}px` }} className="bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden" role="region" aria-label="Components">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1" id="components-heading">Components</h2>
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
            aria-label="Collapse Components"
            aria-expanded="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div className="p-3 overflow-y-auto" aria-labelledby="components-heading">
        <div className="grid grid-cols-2 gap-2">
          {Object.values(componentRegistry).map(plugin => (
            <PaletteItem key={plugin.type} componentPlugin={plugin} />
          ))}
        </div>
      </div>
    </aside>
  );
};
