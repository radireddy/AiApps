import React from 'react';
import { PropertyDefinition, PropertyRendererProps } from './types';
import { PropInput, PropSelect, PropFxInput } from '../component-registry/common';

interface PropertyRendererPropsInternal {
  property: PropertyDefinition;
  rendererProps: PropertyRendererProps;
}

/**
 * Property Renderer
 * 
 * Renders a single property input based on its definition.
 * Uses the Strategy Pattern to select the appropriate input component.
 */
export const PropertyRenderer: React.FC<PropertyRendererPropsInternal> = ({
  property,
  rendererProps,
}) => {
  const { props, updateProp, onOpenExpressionEditor, context } = rendererProps;
  const value = (props as any)[property.key];

  // If property has a custom renderer, use it
  if (property.type === 'custom' && property.customRenderer) {
    return <property.customRenderer {...rendererProps} />;
  }

  // Handle different property types
  switch (property.type) {
    case 'text':
      return (
        <PropInput
          label={property.label}
          value={value ?? property.defaultValue ?? ''}
          onChange={val => updateProp(property.key, val)}
          placeholder={property.placeholder}
          {...property.inputProps}
        />
      );

    case 'number':
      return (
        <PropInput
          label={property.label}
          value={value ?? property.defaultValue ?? 0}
          onChange={val => updateProp(property.key, val)}
          type="number"
          placeholder={property.placeholder}
          {...property.inputProps}
        />
      );

    case 'color':
      return (
        <PropFxInput
          label={property.label}
          value={value ?? property.defaultValue ?? '#000000'}
          onChange={val => updateProp(property.key, val)}
          type="color"
          onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp(property.key, newVal)) : undefined}
          {...property.inputProps}
        />
      );

    case 'select':
      if (!property.options) {
        console.warn(`Property ${property.key} is of type 'select' but has no options`);
        return null;
      }
      // Handle dynamic options (function) or static options (array)
      const options = typeof property.options === 'function' 
        ? property.options(context)
        : property.options;
      
      if (!options || options.length === 0) {
        console.warn(`Property ${property.key} has no options available`);
        return null;
      }
      
      return (
        <PropSelect
          label={property.label}
          value={value ?? property.defaultValue ?? options[0]?.value}
          onChange={val => updateProp(property.key, val)}
          options={options}
        />
      );

    case 'expression':
      return (
        <PropFxInput
          label={property.label}
          value={value ?? property.defaultValue ?? ''}
          onChange={val => updateProp(property.key, val)}
          type={property.inputProps?.type}
          placeholder={property.placeholder}
          onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp(property.key, newVal)) : undefined}
          {...property.inputProps}
        />
      );

    default:
      console.warn(`Unknown property type: ${property.type} for property ${property.key}`);
      return null;
  }
};

