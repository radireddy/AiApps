/**
 * List Component
 * 
 * A data-driven, repeatable UI component that renders a template for each item in an array.
 * Supports template editing mode, currentItem context, and full canvas/preview consistency.
 * 
 * Extends Container component with list-specific features like iteration and template rendering.
 */

import React, { useMemo, useCallback, createContext, useContext, useEffect } from 'react';
import { ComponentType, ListProps, ComponentPlugin, ActionHandlers, ContainerProps } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { createContainerComponent } from './container-factory';
import { createBaseContainerRenderer, BaseContainerRendererOptions } from './base-container';
import { safeEval } from '../../expressions/engine';

// ============================================================================
// DEBUG_LOGGING: Drag operations inside List components
// ============================================================================
const DEBUG_LIST_DRAG = true; // Set to false to disable list drag debug logs

const listDragDebugLog = (operation: string, details: any, isError: boolean = false) => {
  if (!DEBUG_LIST_DRAG) return;
  const logMethod = isError ? console.error : console.warn;
  const prefix = isError ? '❌ LIST_DRAG_FAILED' : '🔄 LIST_DRAG';
  logMethod(`[${prefix}] ${operation}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
};
// ============================================================================
// END DEBUG_LOGGING
// ============================================================================

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/**
 * Context for providing currentItem to List children
 * This allows child components to access currentItem in their expressions
 */
interface ListItemContextValue {
  currentItem: any;
  index: number;
}

const ListItemContext = createContext<ListItemContextValue | null>(null);

/**
 * Hook to access currentItem from List context
 * Returns null if not inside a List item
 */
export const useListItemContext = (): ListItemContextValue | null => {
  return useContext(ListItemContext);
};

interface ListRendererProps {
  component: { props: ListProps; id: string; type: ComponentType };
  children: React.ReactNode;
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
  onClick?: () => void;
  onUpdate?: (id: string, newProps: Partial<any>) => void;
}

/**
 * List Component Renderer
 * 
 * Renders a repeated template for each item in the data array.
 * In edit mode, shows a single template instance with editing capabilities.
 * In preview mode, shows all items with full interactivity.
 * 
 * Uses React Context to provide currentItem to children components.
 */
const ListRenderer: React.FC<ListRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
  onClick,
  onUpdate,
}) => {
  const p = component.props;

  // Evaluate data using useJavaScriptRenderer to properly handle expressions and variables
  // This ensures variables like {{hotels}} are correctly evaluated
  const rawData = useJavaScriptRenderer(p.data, evaluationScope, []);
  
  // Ensure the result is an array
  // Handle cases where JSON array string is provided without {{}} wrapper
  const data = useMemo(() => {
    // If it's already an array, return it
    if (Array.isArray(rawData)) {
      return rawData;
    }
    
    // If rawData is a string that looks like JSON, try to parse it
    if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      // Check if it looks like a JSON array or object
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
          (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          // Not valid JSON, continue to warning
        }
      }
    }
    
    // If not an array, return empty array
    if (rawData !== undefined && rawData !== null) {
      // Silently return empty array - no logging needed
    }
    
    return [];
  }, [rawData, p.data, evaluationScope]);

  // Evaluate template properties - these will be used to create container props for each list item
  const templateHeight = useJavaScriptRenderer(p.templateHeight, evaluationScope, 40);
  const rawTemplateBackground = useJavaScriptRenderer(p.templateBackground, evaluationScope, undefined);
  
  // Normalize templateBackground - handle empty strings, null, undefined
  const templateBackground = useMemo(() => {
    if (rawTemplateBackground === null || rawTemplateBackground === undefined || rawTemplateBackground === '') {
      return undefined;
    }
    // If it's a string, trim it and check if it's empty
    if (typeof rawTemplateBackground === 'string') {
      const trimmed = rawTemplateBackground.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    // Convert to string if it's not already
    return String(rawTemplateBackground);
  }, [rawTemplateBackground]);

  // Create a container renderer for list items - this gives each item all container features
  const ItemContainerRenderer = useMemo(() => {
    return createBaseContainerRenderer({
      styleExtensions: {
        // In edit mode, add visual indicators
        ...(mode === 'edit' ? {
          border: '2px dashed #3b82f6',
        } : {}),
      },
    });
  }, [mode]);

  // Create container props for each list item from List template properties
  // This maps List template properties to Container properties
  const createItemContainerProps = useCallback((item: any, index: number): ContainerProps => {
    const templateHeightValue = typeof templateHeight === 'number' 
      ? templateHeight 
      : (typeof templateHeight === 'string' ? parseFloat(templateHeight.replace(/[^\d.-]/g, '')) || 40 : 40);

    // Map List template properties to Container properties
    // This allows list items to have all container features (padding, borders, background, etc.)
    return {
      // Layout
      width: '100%',
      height: `${templateHeightValue}px`,
      
      // Background - use templateBackground if provided, otherwise inherit from List
      backgroundColor: templateBackground || p.backgroundColor || '{{theme.colors.surface}}',
      backgroundImage: p.backgroundImage,
      
      // Borders - inherit from List or use defaults
      borderWidth: p.borderWidth || '{{theme.border.width}}',
      borderColor: mode === 'edit' ? '#3b82f6' : (p.borderColor || '{{theme.colors.border}}'),
      borderStyle: mode === 'edit' ? 'dashed' : (p.borderStyle || 'solid'),
      borderRadius: p.borderRadius || '{{theme.radius.default}}',
      borderTop: p.borderTop,
      borderRight: p.borderRight,
      borderBottom: p.borderBottom,
      borderLeft: p.borderLeft,
      
      // Spacing - inherit from List
      padding: p.padding || '{{theme.spacing.sm}}',
      
      // Other container properties - inherit from List
      minWidth: p.minWidth,
      maxWidth: p.maxWidth,
      minHeight: p.minHeight,
      maxHeight: p.maxHeight,
      zIndex: p.zIndex,
      className: p.className,
      customAttributes: p.customAttributes,
      tooltip: p.tooltip,
      onClick: p.onClick,
      
      // Base props
      hidden: p.hidden,
      disabled: p.disabled,
      opacity: p.opacity,
      boxShadow: p.boxShadow,
    } as ContainerProps;
  }, [p, templateHeight, templateBackground, mode]);
  const rawItemSpacing = useJavaScriptRenderer(p.itemSpacing, evaluationScope, 8);
  // Ensure itemSpacing is a number (parse if it's a string with units)
  const itemSpacing = useMemo(() => {
    if (typeof rawItemSpacing === 'number') {
      return rawItemSpacing;
    }
    if (typeof rawItemSpacing === 'string') {
      // Remove any units and parse as number
      const numValue = parseFloat(rawItemSpacing.replace(/[^\d.-]/g, ''));
      return isNaN(numValue) ? 8 : numValue;
    }
    return 8;
  }, [rawItemSpacing]);
  const emptyState = useJavaScriptRenderer(p.emptyState, evaluationScope, 'No records found');
  const overflow = p.overflow || 'auto';
  const scrollbarVisibility = p.scrollbarVisibility || 'auto';

  // Calculate item key for each item
  const getItemKey = useCallback((item: any, index: number): string => {
    if (p.itemKey) {
      try {
        // Evaluate itemKey expression with currentItem context
        const itemKeyScope = { ...evaluationScope, currentItem: item, index };
        const keyValue = safeEval(
          typeof p.itemKey === 'string' && p.itemKey.startsWith('{{') && p.itemKey.endsWith('}}')
            ? p.itemKey.substring(2, p.itemKey.length - 2).trim()
            : p.itemKey,
          itemKeyScope
        );
        return keyValue !== undefined && keyValue !== null ? String(keyValue) : String(index);
      } catch (error) {
        console.warn('Error evaluating itemKey:', error);
        return String(index);
      }
    }
    return String(index);
  }, [p.itemKey, evaluationScope]);

  // Handle item click
  const handleItemClick = useCallback((item: any, index: number) => {
    if (mode === 'preview' && p.onItemClick && actions) {
      try {
        const clickScope = { ...evaluationScope, currentItem: item, index, actions };
        const expression = typeof p.onItemClick === 'string' && p.onItemClick.startsWith('{{') && p.onItemClick.endsWith('}}')
          ? p.onItemClick.substring(2, p.onItemClick.length - 2).trim()
          : p.onItemClick;
        safeEval(expression, clickScope);
      } catch (error) {
        console.error('Error executing onItemClick:', error);
      }
    }
  }, [mode, p.onItemClick, actions, evaluationScope]);

  // Build container style
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: overflow === 'hidden' ? 'hidden' : overflow === 'scroll' ? 'scroll' : 'auto',
    isolation: 'isolate', // Create a new stacking context to contain z-index
  };

  // Handle scrollbar visibility
  if (scrollbarVisibility === 'hidden') {
    containerStyle.scrollbarWidth = 'none';
    containerStyle.msOverflowStyle = 'none';
  }

  // In edit mode, show multiple items with visual indicators (like preview but with edit mode styling)
  if (mode === 'edit') {
    // Calculate template height - use as minHeight to allow auto-sizing based on children
    const templateHeightValue = typeof templateHeight === 'number' 
      ? templateHeight 
      : (typeof templateHeight === 'string' ? parseFloat(templateHeight.replace(/[^\d.-]/g, '')) || 40 : 40);
    
    // Use actual data if available, otherwise show empty state
    const displayData = data.length > 0 ? data : [];
    const hasChildren = React.Children.count(children) > 0;

    // Create resize handler once outside the map to avoid recreating functions
    const handleItemResizeMouseDown = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (mode !== 'edit' || !onUpdate) return;
      
      const startY = e.clientY;
      const startHeight = templateHeightValue;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dy = moveEvent.clientY - startY;
        const newHeight = Math.max(20, Math.round(startHeight + dy));
        
        if (onUpdate) {
          onUpdate(component.id, { templateHeight: newHeight });
        }
      };
      
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
      document.body.style.cursor = 'ns-resize';
    }, [mode, onUpdate, component.id, templateHeightValue]);

    return (
      <div style={containerStyle} onClick={onClick}>
        {/* Visual indicator that this is a List component */}
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          LIST
        </div>
        
        {displayData.length > 0 ? (
          // Show multiple items in edit mode (like preview)
          // Each item uses BaseContainerRenderer for full container features
          // Memoized list item component to prevent unnecessary re-renders during drag
          (() => {
            // Memoized list item component with re-render tracking
            const MemoizedListItem = React.memo<{
              item: any;
              index: number;
              itemKey: string;
              itemContainerProps: ContainerProps;
              itemComponent: any;
              templateHeightValue: number;
              itemSpacing: number;
              hasChildren: boolean;
              children: React.ReactNode;
              mode: 'edit' | 'preview';
              actions?: ActionHandlers;
              evaluationScope: Record<string, any>;
              onClick?: () => void;
              onItemResizeMouseDown: (e: React.MouseEvent) => void;
              isLast: boolean;
            }>(({ 
              item, 
              index, 
              itemKey, 
              itemContainerProps, 
              itemComponent, 
              templateHeightValue, 
              itemSpacing, 
              hasChildren, 
              children, 
              mode, 
              actions, 
              evaluationScope, 
              onClick,
              onItemResizeMouseDown,
              isLast
            }) => {
              return (
                <ListItemContext.Provider
                  value={{ currentItem: item, index }}
                >
                  <div 
                    style={{ 
                      marginBottom: !isLast ? `${itemSpacing}px` : 0,
                      height: `${templateHeightValue}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    <ItemContainerRenderer
                      component={itemComponent as any}
                      mode={mode}
                      actions={actions}
                      evaluationScope={evaluationScope}
                      onClick={onClick}
                    >
                      {hasChildren ? (
                        children
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          color: '#3b82f6',
                          fontSize: '14px',
                          gap: '4px',
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round"/>
                            <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round"/>
                            <line x1="7" y1="16" x2="17" y2="16" strokeLinecap="round"/>
                          </svg>
                          <span>Drop components here to build template</span>
                        </div>
                      )}
                    </ItemContainerRenderer>
                    
                    {mode === 'edit' && (
                      <div
                        data-resize-handle="list-item"
                        onMouseDown={onItemResizeMouseDown}
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '60px',
                          height: '8px',
                          backgroundColor: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: '4px',
                          cursor: 'ns-resize',
                          zIndex: 100,
                          pointerEvents: 'auto',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                        aria-label="Resize List Item Height"
                        role="slider"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f6';
                        }}
                      />
                    )}
                  </div>
                </ListItemContext.Provider>
              );
            }, (prevProps, nextProps) => {
              // Custom comparison - only re-render if these specific props change
              // This prevents re-renders during drag operations
              const shouldSkipRender = (
                prevProps.itemKey === nextProps.itemKey &&
                prevProps.templateHeightValue === nextProps.templateHeightValue &&
                prevProps.itemSpacing === nextProps.itemSpacing &&
                prevProps.hasChildren === nextProps.hasChildren &&
                prevProps.mode === nextProps.mode &&
                prevProps.isLast === nextProps.isLast &&
                prevProps.item === nextProps.item &&
                prevProps.index === nextProps.index
              );

              // DEBUG: Log when list item re-renders
              if (!shouldSkipRender) {
                listDragDebugLog('LIST_ITEM_RE_RENDER', {
                  itemKey: nextProps.itemKey,
                  index: nextProps.index,
                  changedProps: {
                    itemKey: prevProps.itemKey !== nextProps.itemKey,
                    templateHeightValue: prevProps.templateHeightValue !== nextProps.templateHeightValue,
                    itemSpacing: prevProps.itemSpacing !== nextProps.itemSpacing,
                    hasChildren: prevProps.hasChildren !== nextProps.hasChildren,
                    mode: prevProps.mode !== nextProps.mode,
                    isLast: prevProps.isLast !== nextProps.isLast,
                    item: prevProps.item !== nextProps.item,
                    index: prevProps.index !== nextProps.index,
                  },
                });
              }

              return shouldSkipRender;
            });

            return displayData.map((item, index) => {
              const itemKey = getItemKey(item, index);
              const itemContainerProps = createItemContainerProps(item, index);
              
              const itemComponent = {
                props: itemContainerProps,
                id: `${component.id}_item_${index}`,
                type: ComponentType.CONTAINER as ComponentType,
              };

              return (
                <MemoizedListItem
                  key={itemKey}
                  item={item}
                  index={index}
                  itemKey={itemKey}
                  itemContainerProps={itemContainerProps}
                  itemComponent={itemComponent}
                  templateHeightValue={templateHeightValue}
                  itemSpacing={itemSpacing}
                  hasChildren={hasChildren}
                  children={children}
                  mode={mode}
                  actions={actions}
                  evaluationScope={evaluationScope}
                  onClick={onClick}
                  onItemResizeMouseDown={handleItemResizeMouseDown}
                  isLast={index === displayData.length - 1}
                />
              );
            });
          })()
        ) : (
          // Show empty state if no data - also use container renderer
          (() => {
            const templateHeightValue = typeof templateHeight === 'number' 
              ? templateHeight 
              : (typeof templateHeight === 'string' ? parseFloat(templateHeight.replace(/[^\d.-]/g, '')) || 40 : 40);
            
            const emptyItemContainerProps = createItemContainerProps(null, 0);
            const emptyItemComponent = {
              props: emptyItemContainerProps,
              id: `${component.id}_empty`,
              type: ComponentType.CONTAINER as ComponentType,
            };

            return (
              <div 
                style={{ 
                  height: `${templateHeightValue}px`, // Set explicit height on wrapper
                  width: '100%',
                  position: 'relative', // Ensure proper positioning context
                }}
                // Don't add drop handlers here - let List component handle all drops
              >
                <ItemContainerRenderer
                  component={emptyItemComponent as any}
                  mode={mode}
                  actions={actions}
                  evaluationScope={evaluationScope}
                  onClick={onClick}
                >
                  {hasChildren ? (
                    <ListItemContext.Provider value={null}>
                      {children}
                    </ListItemContext.Provider>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#3b82f6',
                      fontSize: '14px',
                      gap: '4px',
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round"/>
                        <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round"/>
                        <line x1="7" y1="16" x2="17" y2="16" strokeLinecap="round"/>
                      </svg>
                      <span>Drop components here to build template</span>
                    </div>
                  )}
                </ItemContainerRenderer>
              </div>
            );
          })()
        )}
        
        {data.length === 0 && p.data && (
          <div style={{
            position: 'relative',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#92400e',
            textAlign: 'left',
            zIndex: 1,
            pointerEvents: 'auto',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ No data found</div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div><strong>Expression:</strong> {typeof p.data === 'string' ? p.data : JSON.stringify(p.data)}</div>
              <div><strong>Evaluated type:</strong> {Array.isArray(rawData) ? `Array (${rawData.length} items)` : typeof rawData}</div>
              <div><strong>Evaluated value:</strong> {rawData === undefined ? 'undefined' : rawData === null ? 'null' : JSON.stringify(rawData).substring(0, 100)}</div>
              {typeof p.data === 'string' && p.data.includes('hotels') && (
                <div style={{ marginTop: '4px', padding: '4px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '2px' }}>
                  <strong>Variable check:</strong>
                  <br />• 'hotels' in scope: {'hotels' in evaluationScope ? '✅ Yes' : '❌ No'}
                  <br />• hotels value: {evaluationScope['hotels'] !== undefined ? JSON.stringify(evaluationScope['hotels']).substring(0, 50) : 'undefined'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // In preview mode, render all items
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    return (
      <div style={containerStyle} onClick={onClick}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#9ca3af',
          fontSize: '14px',
        }}>
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} onClick={onClick}>
      {data.map((item, index) => {
        const itemKey = getItemKey(item, index);
        const itemContainerProps = createItemContainerProps(item, index);
        
        // Calculate template height value for this item
        const templateHeightValue = typeof templateHeight === 'number' 
          ? templateHeight 
          : (typeof templateHeight === 'string' ? parseFloat(templateHeight.replace(/[^\d.-]/g, '')) || 40 : 40);
        
        // Create a virtual component object for the container renderer
        const itemComponent = {
          props: itemContainerProps,
          id: `${component.id}_item_${index}`,
          type: ComponentType.CONTAINER as ComponentType,
        };

        return (
          <ListItemContext.Provider
            key={itemKey}
            value={{ currentItem: item, index }}
          >
            <div
              style={{ 
                marginBottom: index < data.length - 1 ? `${itemSpacing}px` : 0,
                height: `${templateHeightValue}px`, // Set explicit height on wrapper
                width: '100%',
                position: 'relative', // Ensure proper positioning context
              }}
              onClick={() => handleItemClick(item, index)}
              role="listitem"
              aria-label={`List item ${index + 1}`}
              // Don't add drop handlers here - let List component handle all drops
            >
              <ItemContainerRenderer
                component={itemComponent as any}
                mode={mode}
                actions={actions}
                evaluationScope={evaluationScope}
                onClick={() => handleItemClick(item, index)}
              >
                {children}
              </ItemContainerRenderer>
            </div>
          </ListItemContext.Provider>
        );
      })}
    </div>
  );
};

/**
 * Custom renderer options for List component
 * Extends base container with list-specific rendering
 */
const listRendererOptions: BaseContainerRendererOptions = {
  styleExtensions: (props: ListProps) => {
    return {
      // List-specific styles can be added here
    };
  },
};

/**
 * List Component Renderer Wrapper
 * Combines base container rendering with list-specific behavior
 */
const ListPluginRenderer: React.FC<any> = (props) => {
  const {
    component,
    children,
    mode,
    actions,
    evaluationScope,
    onClick,
    onUpdate,
  } = props;

  // Create base container renderer
  const BaseContainerRenderer = createBaseContainerRenderer(listRendererOptions);

  // Use base container for outer styling, then add list-specific rendering inside
  return (
    <BaseContainerRenderer
      component={component}
      mode={mode}
      actions={actions}
      evaluationScope={evaluationScope}
      onClick={onClick}
    >
      <ListRenderer
        component={component}
        mode={mode}
        actions={actions}
        evaluationScope={evaluationScope}
        onClick={onClick}
        onUpdate={onUpdate}
      >
        {children}
      </ListRenderer>
    </BaseContainerRenderer>
  );
};

/**
 * List Component Plugin
 * Extends Container component with list-specific features
 */
export const ListPlugin: ComponentPlugin = {
  type: ComponentType.LIST,
  isContainer: true,
  paletteConfig: {
    label: 'List',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg"
    },
      React.createElement('rect', {
        x: "3",
        y: "4",
        width: "18",
        height: "16",
        rx: "2",
        stroke: "currentColor",
        strokeWidth: "2"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "8",
        x2: "17",
        y2: "8",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "12",
        x2: "17",
        y2: "12",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      }),
      React.createElement('line', {
        x1: "7",
        y1: "16",
        x2: "17",
        y2: "16",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round"
      })
    ),
    defaultProps: {
      ...commonStylingProps,
      width: '400px',
      height: '500px',
      backgroundColor: '{{theme.colors.surface}}',
      borderWidth: '{{theme.border.width}}',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '{{theme.radius.default}}',
      padding: '{{theme.spacing.sm}}',
      data: '["Item 1", "Item 2", "Item 3"]', // Default data: array of 3 strings
      itemKey: '',
      emptyState: 'No records found',
      templateHeight: 40,
      itemSpacing: 8,
      overflow: 'auto',
      scrollbarVisibility: 'auto',
    },
  },
  renderer: ListPluginRenderer,
  properties: () => null, // Properties handled by metadata system
};

