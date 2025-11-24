import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
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
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  onMoveComponentToParent?: (componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => void;
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
  onReorderComponent?: (componentId: string, newIndex: number, parentId: string | null, pageId: string) => void;
  onMoveComponentToParent?: (componentId: string, newParentId: string | null, newIndex: number | null, pageId: string) => void;
  onExpandNode?: (id: string) => void;
  appDefinition: AppDefinition;
  draggedNodeIdRef: React.MutableRefObject<string | null>;
  isDraggingRef: React.MutableRefObject<boolean>;
}> = memo(({ node, level, expandedNodes, toggleNode, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent, onReorderComponent, onMoveComponentToParent, onExpandNode, appDefinition, draggedNodeIdRef, isDraggingRef }) => {
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

  // Drag and drop handlers
  const [dragOverState, setDragOverState] = useState<'none' | 'over' | 'before' | 'after'>('none');

  const handleDragStart = (e: React.DragEvent) => {
    if (node.type !== 'COMPONENT') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    draggedNodeIdRef.current = node.id;
    isDraggingRef.current = true;
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (node.type === 'APP') {
      return;
    }

    const draggedId = draggedNodeIdRef.current;
    if (!draggedId || draggedId === node.id) {
      setDragOverState('none');
      return;
    }

    // Prevent dropping on self or descendants
    const isDescendant = (childId: string, parentId: string, components: AppComponent[]): boolean => {
      const child = components.find(c => c.id === childId);
      if (!child || !child.parentId) return false;
      if (child.parentId === parentId) return true;
      return isDescendant(child.parentId, parentId, components);
    };

    if (node.type === 'COMPONENT' && isDescendant(node.id, draggedId, appDefinition.components)) {
      setDragOverState('none');
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    // Auto-expand collapsed nodes when dragging over them
    if (isExpandable && !isExpanded && onExpandNode) {
      onExpandNode(node.id);
    }

    // Determine drop position (before, after, or inside)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = height / 3;

    if (y < threshold) {
      setDragOverState('before');
    } else if (y > height - threshold) {
      setDragOverState('after');
    } else {
      setDragOverState('over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverState('none');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('text/plain') || draggedNodeIdRef.current;
    if (!draggedId || !onReorderComponent || !onMoveComponentToParent) {
      setDragOverState('none');
      draggedNodeIdRef.current = null;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      return;
    }

    const draggedComponent = appDefinition.components.find(c => c.id === draggedId);
    if (!draggedComponent || !draggedComponent.pageId) {
      setDragOverState('none');
      draggedNodeIdRef.current = null;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      return;
    }

    // Determine target parent and index
    let targetParentId: string | null = null;
    let targetIndex: number | null = null;

    if (node.type === 'PAGE') {
      // Dropping on a page - move to root level of that page
      targetParentId = null;
      const pageChildren = appDefinition.components
        .filter(c => !c.parentId && c.pageId === node.pageId && c.id !== draggedId)
        .sort((a, b) => {
          const aIndex = appDefinition.components.indexOf(a);
          const bIndex = appDefinition.components.indexOf(b);
          return aIndex - bIndex;
        });
      
      if (pageChildren.length > 0 && dragOverState !== 'over') {
        if (dragOverState === 'before') {
          targetIndex = 0;
        } else {
          targetIndex = pageChildren.length;
        }
      } else {
        targetIndex = pageChildren.length;
      }
    } else if (node.type === 'COMPONENT') {
      // Dropping on a component - check if it's a container
      const plugin = componentRegistry[node.componentType!];
      if (plugin && plugin.isContainer) {
        // Dropping into a container
        targetParentId = node.id;
        const containerChildren = appDefinition.components
          .filter(c => c.parentId === node.id && c.pageId === node.pageId)
          .sort((a, b) => {
            const aIndex = appDefinition.components.indexOf(a);
            const bIndex = appDefinition.components.indexOf(b);
            return aIndex - bIndex;
          });
        
        if (dragOverState === 'before') {
          const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
          const siblings = appDefinition.components
            .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId)
            .sort((a, b) => {
              const aIndex = appDefinition.components.indexOf(a);
              const bIndex = appDefinition.components.indexOf(b);
              return aIndex - bIndex;
            });
          const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
          targetIndex = Math.max(0, targetIndexInSiblings);
          targetParentId = currentNodeParentId;
        } else if (dragOverState === 'after') {
          const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
          const siblings = appDefinition.components
            .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId)
            .sort((a, b) => {
              const aIndex = appDefinition.components.indexOf(a);
              const bIndex = appDefinition.components.indexOf(b);
              return aIndex - bIndex;
            });
          const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
          targetIndex = Math.min(siblings.length, targetIndexInSiblings + 1);
          targetParentId = currentNodeParentId;
        } else {
          // Dropping inside container
          targetIndex = containerChildren.length;
        }
      } else {
        // Not a container - treat as sibling
        const currentNodeParentId = appDefinition.components.find(c => c.id === node.id)?.parentId || null;
        targetParentId = currentNodeParentId;
        const siblings = appDefinition.components
          .filter(c => (c.parentId || null) === currentNodeParentId && c.pageId === node.pageId && c.id !== draggedId)
          .sort((a, b) => {
            const aIndex = appDefinition.components.indexOf(a);
            const bIndex = appDefinition.components.indexOf(b);
            return aIndex - bIndex;
          });
        
        const targetIndexInSiblings = siblings.findIndex(c => c.id === node.id);
        if (dragOverState === 'before') {
          targetIndex = Math.max(0, targetIndexInSiblings);
        } else {
          targetIndex = Math.min(siblings.length, targetIndexInSiblings + 1);
        }
      }
    }

    // Check if we're moving to a different parent or just reordering
    const currentParentId = draggedComponent.parentId || null;
    if (targetParentId === currentParentId) {
      // Same parent (including both null for root level) - just reorder
      const siblings = appDefinition.components
        .filter(c => {
          const cParentId = c.parentId || null;
          return cParentId === currentParentId && c.pageId === draggedComponent.pageId && c.id !== draggedId;
        })
        .sort((a, b) => {
          const aIndex = appDefinition.components.indexOf(a);
          const bIndex = appDefinition.components.indexOf(b);
          return aIndex - bIndex;
        });
      
      const currentIndex = siblings.findIndex(c => c.id === draggedId);
      let newIndex = targetIndex!;
      
      if (currentIndex >= 0 && newIndex > currentIndex) {
        newIndex -= 1;
      }
      
      if (onReorderComponent) {
        onReorderComponent(draggedId, newIndex, currentParentId, draggedComponent.pageId);
      }
    } else {
      // Different parent - move component
      if (onMoveComponentToParent) {
        onMoveComponentToParent(draggedId, targetParentId, targetIndex, draggedComponent.pageId);
      }
    }

    setDragOverState('none');
    draggedNodeIdRef.current = null;
    isDraggingRef.current = false;
    document.body.style.cursor = '';
  };

  const handleDragEnd = () => {
    setDragOverState('none');
    draggedNodeIdRef.current = null;
    isDraggingRef.current = false;
    document.body.style.cursor = '';
  };

  // Prevent click when dragging
  const handleRowClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // If it's expandable, toggle the expand/collapse state
    if (isExpandable) {
      toggleNode(node.id);
    }
    // Always select the component/page
    handleSelect();
  };

  const dragOverClass = dragOverState === 'over' ? 'bg-blue-100 border-2 border-blue-400 shadow-md' : 
                       dragOverState === 'before' ? 'border-t-4 border-blue-500 bg-blue-50' :
                       dragOverState === 'after' ? 'border-b-4 border-blue-500 bg-blue-50' : '';
  
  const isBeingDragged = draggedNodeIdRef.current === node.id;
  const dragClass = isBeingDragged ? 'opacity-50 cursor-grabbing' : '';

  return (
    <div>
      <div 
        className={`flex items-center p-1 my-0.5 rounded-md ${node.type === 'COMPONENT' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectionClass} ${dragOverClass} ${dragClass} transition-colors group`} 
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={handleRowClick}
        draggable={node.type === 'COMPONENT'}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
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
          onReorderComponent={onReorderComponent}
          onMoveComponentToParent={onMoveComponentToParent}
          onExpandNode={onExpandNode}
          appDefinition={appDefinition}
          draggedNodeIdRef={draggedNodeIdRef}
          isDraggingRef={isDraggingRef}
        />
      ))}
    </div>
  );
});

export const TreeView: React.FC<TreeViewProps> = ({ isCollapsed, onToggleCollapse, appDefinition, currentPageId, selectedComponentIds, onSelectPage, onSelectComponent, onDeleteComponent, onReorderComponent, onMoveComponentToParent }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set([appDefinition.id, currentPageId]));
    const draggedNodeIdRef = useRef<string | null>(null);
    const isDraggingRef = useRef<boolean>(false);

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

    const expandNode = (id: string) => {
        setExpandedNodes(prev => new Set(prev).add(id));
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
                onReorderComponent={onReorderComponent}
                onMoveComponentToParent={onMoveComponentToParent}
                onExpandNode={expandNode}
                appDefinition={appDefinition}
                draggedNodeIdRef={draggedNodeIdRef}
                isDraggingRef={isDraggingRef}
            />
          </div>
        </aside>
      );
};