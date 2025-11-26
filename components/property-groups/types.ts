import { ComponentProps } from '../../types';
import React from 'react';

/**
 * Property definition for a single property field
 */
export interface PropertyDefinition {
  /** The property key in the component props */
  key: string;
  /** Display label for the property */
  label: string;
  /** Type of input to render */
  type: 'text' | 'number' | 'color' | 'select' | 'expression' | 'custom';
  /** Options for select type (can be static or dynamic via function) */
  options?: { value: any; label: string }[] | ((context?: Record<string, any>) => { value: any; label: string }[]);
  /** Placeholder text */
  placeholder?: string;
  /** Condition to show this property (based on component props and context) */
  condition?: (props: ComponentProps, context?: Record<string, any>) => boolean;
  /** Custom renderer component (for type: 'custom') */
  customRenderer?: React.FC<PropertyRendererProps>;
  /** Default value */
  defaultValue?: any;
  /** Additional props to pass to the input component */
  inputProps?: Record<string, any>;
}

/**
 * Props passed to property renderers
 */
export interface PropertyRendererProps {
  /** Component props */
  props: ComponentProps;
  /** Update function */
  updateProp: (key: string, value: any) => void;
  /** Open expression editor callback */
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  /** Additional context (dataSources, variables, etc.) */
  context?: Record<string, any>;
}

/**
 * A property group that contains related properties
 */
export interface PropertyGroup {
  /** Unique identifier for the group */
  id: string;
  /** Display title for the group */
  title: string;
  /** Properties in this group */
  properties: PropertyDefinition[];
  /** Condition to show this group (based on component props and context) */
  condition?: (props: ComponentProps, context?: Record<string, any>) => boolean;
  /** Display order (lower numbers appear first) */
  order?: number;
  /** Whether this group should be collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Custom renderer for the entire group (overrides default rendering) */
  customGroupRenderer?: React.FC<PropertyGroupRendererProps>;
}

/**
 * Props for custom group renderers
 */
export interface PropertyGroupRendererProps {
  group: PropertyGroup;
  rendererProps: PropertyRendererProps;
}

/**
 * Property configuration for a component type
 */
export interface PropertyConfig {
  /** Base property groups (always included) */
  baseGroups?: string[];
  /** Extended property groups (conditionally included) */
  extendedGroups?: string[];
  /** Custom property groups (component-specific) */
  customGroups?: PropertyGroup[];
  /** Property groups to exclude */
  excludeGroups?: string[];
  /** Custom order for groups */
  groupOrder?: string[];
}

