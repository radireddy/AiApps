/**
 * Component Renderer Factory
 * 
 * Factory functions for rendering components in tests.
 * Provides a consistent way to render any component from the registry.
 */

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { ComponentType, AppComponent } from 'types';
import { componentRegistry } from 'components/component-registry/registry';

/**
 * Props for rendering a component in test mode
 */
export interface RenderComponentOptions {
  /** Component definition */
  component: AppComponent;
  /** Evaluation scope for expressions */
  evaluationScope?: Record<string, any>;
  /** Render mode */
  mode?: 'preview' | 'edit';
  /** Data store */
  dataStore?: Record<string, any>;
  /** Action handlers */
  actionHandlers?: any;
}

/**
 * Result of rendering a component
 */
export interface RenderedComponent {
  /** Testing library render result */
  renderResult: RenderResult;
  /** The rendered DOM element */
  element: HTMLElement;
  /** The component definition */
  component: AppComponent;
}

/**
 * Gets default props for a component type
 */
export function getDefaultPropsForComponent(componentType: ComponentType): any {
  const plugin = componentRegistry[componentType];
  
  if (!plugin) {
    throw new Error(`Component plugin not found for type: ${componentType}`);
  }
  
  // Get default props from palette config
  const defaultProps = plugin.paletteConfig.defaultProps || {};
  
  // Ensure base props are always present
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    ...defaultProps,
  };
}

/**
 * Creates a component definition for testing
 */
export function createTestComponent(
  componentType: ComponentType,
  props: Partial<any> = {}
): AppComponent {
  const defaultProps = getDefaultPropsForComponent(componentType);
  
  return {
    id: `test-${componentType.toLowerCase()}-${Date.now()}`,
    type: componentType,
    props: {
      ...defaultProps,
      ...props,
    },
    pageId: 'test-page',
  };
}

/**
 * Renders a component using its plugin renderer
 */
export function renderComponent(options: RenderComponentOptions): RenderedComponent {
  const {
    component,
    evaluationScope = {},
    mode = 'preview',
    dataStore = {},
    actionHandlers,
  } = options;
  
  const plugin = componentRegistry[component.type];
  
  if (!plugin) {
    throw new Error(`Component plugin not found for type: ${component.type}`);
  }
  
  const Renderer = plugin.renderer;
  
  // Prepare props for the renderer
  const rendererProps: any = {
    component,
    evaluationScope,
    mode,
    dataStore,
  };
  
  // Add action handlers if provided
  if (actionHandlers) {
    rendererProps.actionHandlers = actionHandlers;
  }
  
  // Render the component
  const renderResult = render(<Renderer {...rendererProps} />);
  
  // Get the root element
  const container = renderResult.container;
  const element = container.firstChild as HTMLElement;
  
  if (!element) {
    throw new Error(`Component ${component.type} did not render any element`);
  }
  
  return {
    renderResult,
    element: element as HTMLElement,
    component,
  };
}

/**
 * Updates a component's property and re-renders
 */
export function updateComponentProperty(
  rendered: RenderedComponent,
  propertyId: string,
  value: any,
  evaluationScope: Record<string, any> = {}
): RenderedComponent {
  const updatedComponent: AppComponent = {
    ...rendered.component,
    props: {
      ...rendered.component.props,
      [propertyId]: value,
    },
  };
  
  // Unmount previous render
  rendered.renderResult.unmount();
  
  // Render with updated props
  return renderComponent({
    component: updatedComponent,
    evaluationScope,
    mode: 'preview',
  });
}

