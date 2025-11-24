import React, { useState, useMemo, memo, useEffect } from 'react';
import { AppDefinition, AppPage, AppComponent } from '../types';
import { componentRegistry } from './component-registry/registry';
import { getIconForType } from './TreeViewIcons';
import { typography } from '../constants';

interface TreeViewProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  appDefinition: AppDefinition;
  currentPageId: string;
  selectedComponentIds: string[];
  onSelectPage: (pageId: string) => void;
  onSelectComponent: (componentId: string, pageId: string) => void;
  onDeleteComponent?: (componentId: string) => void;
}

interface TreeNodeData {
  id: string;
  name: string;
  type: 'APP' | 'PAGE' | 'COMPONENT';
  componentType?: AppComponent['type'];
  children: TreeNodeData[];
  pageId?: string;
}

const buildTree = (appDefinition: AppDefinition): TreeNodeData => {
  const { pages, components, name: appName, id: appId } = appDefinition;
  
  const componentMap = new Map<string, AppComponent>(components.map(c => [c.id, c]));
  const childrenMap = new Map<string, string[]>();
  
  components.forEach(c => {
    const parentKey = c.parentId || `page_${c.pageId}`;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(c.id);
  });
  
  const buildComponentNodes = (componentIds: string[]): TreeNodeData[] => {
    if (!componentIds) return [];
    return componentIds.map(id => {
      const component = componentMap.get(id)!;
      return {
        id: component.id,
        name: component.id,
        type: 'COMPONENT',
        componentType: component.type,
        pageId: component.pageId,
        children: buildComponentNodes(childrenMap.get(component.id) || []),
      };
    });
  };

  return {
    id: appId,
    name: 'Application',
    type: 'APP',
    children: pages.map(page => ({
      id: page.id,
      name: page.name,
      type: 'PAGE',
      pageId: page.id,
      children: buildComponentNodes(childrenMap.get(`page_${page.id}`) || []),
    })),
  };
};

const TreeNode: React.FC<{
  node: TreeNodeData;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  currentPageId: string;
  selectedComponentIds: string[];
  onSelectPage: (pageId: string) => void;
  onSelectComponent: (componentId: string, pageId: string) => void;
  onDeleteComponent?: (componentId: string) => void;
}> = memo(({ node, level, expandedNodes, toggleNode, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent }) => {
  const isExpanded = expandedNodes.has(node.id);
  const isExpandable = node.children.length > 0;

  const handleSelect = () => {
    if (node.type === 'PAGE' && node.pageId) {
        onSelectPage(node.pageId);
    } else if (node.type === 'COMPONENT' && node.pageId) {
        onSelectComponent(node.id, node.pageId);
    }
  };
  
  const isSelected = (node.type === 'PAGE' && node.id === currentPageId) || (node.type === 'COMPONENT' && selectedComponentIds.includes(node.id));
  const selectionClass = isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100';
  const label = node.type === 'COMPONENT' ? `${componentRegistry[node.componentType!].paletteConfig.label}` : node.name;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'COMPONENT' && onDeleteComponent) {
      onDeleteComponent(node.id);
    }
  };

  // Handle click on the entire row - for expandable nodes, both toggle AND select
  const handleRowClick = (e: React.MouseEvent) => {
    // If it's expandable, toggle the expand/collapse state
    if (isExpandable) {
      toggleNode(node.id);
    }
    // Always select the component/page
    handleSelect();
  };

  return (
    <div>
      <div 
        className={`flex items-center p-1 my-0.5 rounded-md cursor-pointer ${selectionClass} transition-colors group`} 
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center flex-grow">
            {isExpandable ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
            ) : (
                <span className="w-4 mr-1 flex-shrink-0"></span>
            )}
            <span className="mr-2 flex-shrink-0">{getIconForType(node.type, node.componentType)}</span>
            <span className={`${typography.label} ${typography.medium} truncate`} title={label}>{label}</span>
        </div>
        {node.type === 'COMPONENT' && onDeleteComponent && (
          <button
            onClick={handleDelete}
            className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all flex-shrink-0"
            aria-label={`Delete ${label}`}
            title={`Delete ${label}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {isExpanded && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
          currentPageId={currentPageId}
          selectedComponentIds={selectedComponentIds}
          onSelectPage={onSelectPage}
          onSelectComponent={onSelectComponent}
          onDeleteComponent={onDeleteComponent}
        />
      ))}
    </div>
  );
});

export const TreeView: React.FC<TreeViewProps> = ({ isCollapsed, onToggleCollapse, appDefinition, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set([appDefinition.id, currentPageId]));

    const tree = useMemo(() => buildTree(appDefinition), [appDefinition]);
    
    useEffect(() => {
        // Automatically expand the current page if it's not already
        if (!expandedNodes.has(currentPageId)) {
            setExpandedNodes(prev => new Set(prev).add(currentPageId));
        }
    }, [currentPageId, expandedNodes]);

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
  
    if (isCollapsed) {
        return (
          <aside className="w-10 bg-white border-r border-gray-200 flex flex-col items-center py-3 shrink-0" role="region" aria-label="Explorer">
            <button 
                onClick={onToggleCollapse} 
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
                aria-label="Expand Explorer"
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
        <aside className="bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden" role="region" aria-label="Explorer">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className={`${typography.section} ${typography.bold} text-gray-500 uppercase tracking-wider px-1`} id="explorer-heading">Explorer</h2>
            <button 
                onClick={onToggleCollapse} 
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
                aria-label="Collapse Explorer"
                aria-expanded="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="p-2 overflow-y-auto" aria-labelledby="explorer-heading">
            <TreeNode
                node={tree}
                level={0}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                currentPageId={currentPageId}
                selectedComponentIds={selectedComponentIds}
                onSelectPage={onSelectPage}
                onSelectComponent={onSelectComponent}
                onDeleteComponent={onDeleteComponent}
            />
          </div>
        </aside>
      );
};