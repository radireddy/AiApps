
import React, { useState, useMemo } from 'react';
import { ComponentPlugin, ComponentType } from '../types';
import { componentRegistry } from './component-registry/registry';
import { typography } from '../constants';

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
      <span className={`${typography.label} ${typography.medium} mt-1`}>{componentPlugin.paletteConfig.label}</span>
    </div>
  );
};

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ width, isCollapsed, onToggleCollapse }) => {
  const [expandedCategory, setExpandedCategory] = useState<string>('Input');

  const categories = useMemo(() => [
    'Input',
    'Display',
    'Media',
    'Layout',
    'Icons',
    'Other',
  ], []);

  const getCategoryFor = (plugin: ComponentPlugin) => {
    switch (plugin.type) {
      case ComponentType.INPUT:
      case ComponentType.TEXTAREA:
      case ComponentType.SELECT:
      case ComponentType.CHECKBOX:
      case ComponentType.RADIO_GROUP:
      case ComponentType.SWITCH:
        return 'Input';
      case ComponentType.LABEL:
      case ComponentType.BUTTON:
      case ComponentType.TABLE:
        return 'Display';
      case ComponentType.IMAGE:
        return 'Media';
      case ComponentType.PANEL:
      case ComponentType.H_STACK:
      case ComponentType.V_STACK:
      case ComponentType.CONTAINER:
        return 'Layout';
      case ComponentType.DIVIDER:
        return 'Icons';
      default:
        return 'Other';
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, ComponentPlugin[]> = {};
    categories.forEach(c => (map[c] = []));
    Object.values(componentRegistry).forEach(plugin => {
      const c = getCategoryFor(plugin);
      if (!map[c]) map[c] = [];
      map[c].push(plugin);
    });
    return map;
  }, [categories]);

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
        <h2 className={`${typography.section} ${typography.bold} text-gray-500 uppercase tracking-wider px-1`} id="components-heading">Components</h2>
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
      <div className="p-2 overflow-y-auto" aria-labelledby="components-heading">
        {categories.map(cat => {
          const items = grouped[cat] || [];
          const isOpen = expandedCategory === cat;
          return (
            <div key={cat} className="mb-2">
              <button
                onClick={() => setExpandedCategory(isOpen ? '' : cat)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50"
                aria-expanded={isOpen}
                aria-controls={`palette-${cat}`}
              >
                <span className={`${typography.subsection} ${typography.semibold} text-gray-600`}>{cat}</span>
                <svg className={`h-4 w-4 text-gray-500 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4l8 6-8 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <div id={`palette-${cat}`} className="mt-2 px-2">
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(plugin => (
                      <PaletteItem key={plugin.type} componentPlugin={plugin} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};