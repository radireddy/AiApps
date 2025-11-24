/**
 * Base Container Utilities
 * 
 * This module provides reusable utilities for creating container-based components.
 * Any component that extends Container will automatically get:
 * - All container properties (padding, borders, background, etc.)
 * - Container rendering behavior (absolute positioning for children)
 * - Container drag-and-drop behavior
 * - Container property panel structure
 */

import React from 'react';
import { ContainerProps, ActionHandlers } from '../../types';
import { buildBorderStyles, buildSpacingStyles } from './common';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';

/**
 * Options for customizing the base container renderer
 */
export interface BaseContainerRendererOptions {
  /**
   * Optional custom style extensions to merge with base container styles
   */
  styleExtensions?: React.CSSProperties | ((props: ContainerProps, evaluationScope: Record<string, any>) => React.CSSProperties);
  
  /**
   * Optional custom onClick handler
   * If provided, this will be called in addition to the base onClick handler
   */
  onClick?: (props: ContainerProps, actions?: ActionHandlers, evaluationScope?: Record<string, any>) => void;
  
  /**
   * Optional custom wrapper element (defaults to div)
   */
  wrapperElement?: keyof JSX.IntrinsicElements;
  
  /**
   * Optional additional props to pass to the wrapper element
   */
  wrapperProps?: Record<string, any>;
}

/**
 * Base container renderer props
 */
export interface BaseContainerRendererProps {
  component: { props: ContainerProps };
  children: React.ReactNode;
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
  onClick?: () => void;
}

/**
 * Creates a base container renderer with optional customizations
 * 
 * This renderer provides:
 * - Absolute positioning container (position: relative)
 * - Background color/image support
 * - Border styling (all border properties)
 * - Padding support
 * - Min/max width/height
 * - Z-index support
 * - Custom attributes support
 * - onClick event handling
 * 
 * Children are expected to be absolutely positioned within this container.
 */
export function createBaseContainerRenderer(
  options: BaseContainerRendererOptions = {}
): React.FC<BaseContainerRendererProps> {
  const {
    styleExtensions = {},
    onClick: customOnClick,
    wrapperElement = 'div',
    wrapperProps = {},
  } = options;

  return function BaseContainerRenderer({
    component,
    children,
    mode,
    actions,
    evaluationScope,
    onClick: externalOnClick,
  }: BaseContainerRendererProps) {
    const p = component.props;
    
    // Evaluate all props at the top level (hooks must be called unconditionally)
    const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
    const backgroundImage = useJavaScriptRenderer(p.backgroundImage, evaluationScope, '');
    const opacity = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
    const boxShadow = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
    const padding = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
    const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, undefined);
    const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, undefined);
    const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, undefined);
    const borderTop = useJavaScriptRenderer(p.borderTop, evaluationScope, undefined);
    const borderRight = useJavaScriptRenderer(p.borderRight, evaluationScope, undefined);
    const borderBottom = useJavaScriptRenderer(p.borderBottom, evaluationScope, undefined);
    const borderLeft = useJavaScriptRenderer(p.borderLeft, evaluationScope, undefined);
    const borderStyle = useJavaScriptRenderer(p.borderStyle, evaluationScope, undefined);
    const zIndex = useJavaScriptRenderer(p.zIndex, evaluationScope, undefined);
    const className = useJavaScriptRenderer(p.className, evaluationScope, undefined);
    const tooltip = useJavaScriptRenderer(p.tooltip, evaluationScope, undefined);
    
    // Build border and spacing styles
    const borderStyles = buildBorderStyles(
      { ...p, borderStyle } as any,
      borderRadius,
      borderWidth,
      borderColor,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft
    );
    const spacingStyles = buildSpacingStyles(padding, undefined);
    
    // Parse custom attributes if provided
    let customAttrs: Record<string, string> = {};
    if (p.customAttributes) {
      try {
        const parsed = typeof p.customAttributes === 'string' 
          ? JSON.parse(p.customAttributes) 
          : p.customAttributes;
        if (typeof parsed === 'object' && parsed !== null) {
          customAttrs = parsed;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    
    // Build background style
    let backgroundStyle: React.CSSProperties = {};
    if (backgroundImage) {
      backgroundStyle.backgroundImage = `url(${backgroundImage})`;
      backgroundStyle.backgroundSize = 'cover';
      backgroundStyle.backgroundPosition = 'center';
      backgroundStyle.backgroundRepeat = 'no-repeat';
    } else if (backgroundColor) {
      backgroundStyle.backgroundColor = backgroundColor;
    }
    
    // Evaluate min/max dimensions
    const minWidth = useJavaScriptRenderer(p.minWidth, evaluationScope, undefined);
    const maxWidth = useJavaScriptRenderer(p.maxWidth, evaluationScope, undefined);
    const minHeight = useJavaScriptRenderer(p.minHeight, evaluationScope, undefined);
    const maxHeight = useJavaScriptRenderer(p.maxHeight, evaluationScope, undefined);
    
    // Get custom style extensions
    const customStyles = typeof styleExtensions === 'function'
      ? styleExtensions(p, evaluationScope)
      : styleExtensions;
    
    // Build container style - NO flex, NO grid, just absolute positioning container
    // Width and height come from the parent RenderedComponent wrapper, not from here
    // The container should fill its allocated space
    const containerStyle: React.CSSProperties = {
      position: 'relative', // Container itself is positioned absolutely by parent
      width: '100%', // Fill the width allocated by parent
      height: '100%', // Fill the height allocated by parent
      boxSizing: 'border-box',
      ...backgroundStyle,
      opacity,
      boxShadow: boxShadow || undefined,
      ...spacingStyles,
      ...borderStyles,
      ...(zIndex !== undefined && { zIndex }),
      ...(minWidth !== undefined && { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }),
      ...(maxWidth !== undefined && { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }),
      ...(minHeight !== undefined && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
      ...(maxHeight !== undefined && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
      // Children will be absolutely positioned within this container
      overflow: 'hidden', // Clip children to container bounds
      ...customStyles, // Apply custom style extensions last
    };
    
    // Handle onClick event
    const handleClick = () => {
      if (mode === 'preview' && p.onClick && actions) {
        try {
          // Evaluate onClick expression in the evaluation scope with actions available
          const clickScope = { ...evaluationScope, actions };
          const onClickValue = p.onClick;
          if (typeof onClickValue === 'string') {
            // Handle expression format {{ ... }}
            const { safeEval } = require('../../expressions/engine') as { safeEval: (expr: string, scope: any) => any };
            const expression = onClickValue.startsWith('{{') && onClickValue.endsWith('}}')
              ? onClickValue.substring(2, onClickValue.length - 2).trim()
              : onClickValue;
            safeEval(expression, clickScope);
          }
        } catch (error) {
          console.error('Error executing container onClick:', error);
        }
      }
      
      // Call custom onClick if provided
      if (customOnClick) {
        customOnClick(p, actions, evaluationScope);
      }
      
      // Call external onClick if provided
      if (externalOnClick) {
        externalOnClick();
      }
    };
    
    const WrapperElement = wrapperElement as any;
    
    return (
      <WrapperElement
        style={containerStyle}
        className={className}
        title={tooltip}
        onClick={handleClick}
        {...customAttrs}
        {...wrapperProps}
      >
        {children}
      </WrapperElement>
    );
  };
}

/**
 * Default base container renderer (no customizations)
 * Can be used directly or as a reference implementation
 */
export const BaseContainerRenderer = createBaseContainerRenderer();

