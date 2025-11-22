import React from 'react';
import { PropertyGroup, PropertyRendererProps } from './types';
import { PropertyGroup as PropertyGroupComponent, CollapsibleSection } from '../component-registry/common';
import { PropertyRenderer } from './PropertyRenderer';

interface PropertyGroupRendererProps {
  group: PropertyGroup;
  rendererProps: PropertyRendererProps;
}

/**
 * Property Group Renderer
 * 
 * Renders a single property group, either as a collapsible section
 * or as a regular property group component.
 */
export const PropertyGroupRenderer: React.FC<PropertyGroupRendererProps> = ({
  group,
  rendererProps,
}) => {
  // Filter properties based on their conditions
  const visibleProperties = group.properties.filter(prop => {
    if (prop.condition) {
      return prop.condition(rendererProps.props, rendererProps.context);
    }
    return true;
  });

  if (visibleProperties.length === 0) {
    return null;
  }

  // If group is collapsible, use CollapsibleSection
  if (group.collapsible) {
    return (
      <CollapsibleSection
        title={group.title}
        isOpenDefault={!group.defaultCollapsed}
      >
        {visibleProperties.map(prop => (
          <PropertyRenderer
            key={prop.key}
            property={prop}
            rendererProps={rendererProps}
          />
        ))}
      </CollapsibleSection>
    );
  }

  // Otherwise, use PropertyGroup component
  return (
    <PropertyGroupComponent title={group.title}>
      {visibleProperties.map(prop => (
        <PropertyRenderer
          key={prop.key}
          property={prop}
          rendererProps={rendererProps}
        />
      ))}
    </PropertyGroupComponent>
  );
};

