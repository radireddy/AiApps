import React from 'react';
import { ComponentProps } from '../../types';
import { PropertyGroup, PropertyConfig, PropertyRendererProps } from './types';
import { createPropertyConfig, filterPropertyGroups } from './factory';
import { PropertyGroupRenderer } from './PropertyGroupRenderer';
import { PropertyRenderer } from './PropertyRenderer';

export interface BasePropertiesRendererProps {
  /** Component with props */
  component: { id?: string; props: ComponentProps };
  /** Update function */
  updateProp: (key: string, value: any) => void;
  /** Property configuration */
  config: PropertyConfig;
  /** Open expression editor callback */
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  /** Additional context (dataSources, variables, etc.) */
  context?: Record<string, any>;
}

/**
 * Base Properties Renderer
 * 
 * This component follows the Template Method Pattern:
 * - Defines the structure for rendering properties
 * - Delegates specific rendering to PropertyGroupRenderer and PropertyRenderer
 * - Handles filtering and ordering of property groups
 * 
 * It also follows the Composition Pattern:
 * - Composes property groups rather than using inheritance
 * - Allows flexible configuration through PropertyConfig
 */
export const BasePropertiesRenderer: React.FC<BasePropertiesRendererProps> = ({
  component,
  updateProp,
  config,
  onOpenExpressionEditor,
  context = {},
}) => {
  // Create property groups from config
  const allGroups = React.useMemo(() => {
    return createPropertyConfig(config);
  }, [config]);

  // Filter groups based on component props and context
  const filteredGroups = React.useMemo(() => {
    return filterPropertyGroups(allGroups, component.props, context);
  }, [allGroups, component.props, context]);

  // Create renderer props
  const rendererProps: PropertyRendererProps = React.useMemo(() => ({
    props: component.props,
    updateProp,
    onOpenExpressionEditor,
    context,
  }), [component.props, updateProp, onOpenExpressionEditor, context]);

  return (
    <div className="py-1">
      {filteredGroups.map(group => (
        <PropertyGroupRenderer
          key={group.id}
          group={group}
          rendererProps={rendererProps}
        />
      ))}
    </div>
  );
};

