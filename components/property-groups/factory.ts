import { PropertyConfig, PropertyGroup } from './types';
import { ComponentProps } from '../../types';
import { propertyGroupRegistry } from './registry';

/**
 * Factory function to create property configurations
 * Follows the Factory Pattern for creating property configurations
 */

/**
 * Creates a property configuration from group IDs and custom groups
 */
export function createPropertyConfig(config: PropertyConfig): PropertyGroup[] {
  const groups: PropertyGroup[] = [];

  // Add base groups
  if (config.baseGroups) {
    const baseGroups = propertyGroupRegistry.getMany(config.baseGroups);
    groups.push(...baseGroups);
  }

  // Add extended groups (filtered by condition)
  if (config.extendedGroups) {
    const extendedGroups = propertyGroupRegistry.getMany(config.extendedGroups);
    groups.push(...extendedGroups);
  }

  // Add custom groups
  if (config.customGroups) {
    groups.push(...config.customGroups);
  }

  // Remove excluded groups
  if (config.excludeGroups) {
    const excludeSet = new Set(config.excludeGroups);
    const filtered = groups.filter(group => !excludeSet.has(group.id));
    groups.length = 0;
    groups.push(...filtered);
  }

  // Sort by order, then by custom order if provided
  groups.sort((a, b) => {
    // If custom order is provided, use it
    if (config.groupOrder) {
      const aIndex = config.groupOrder.indexOf(a.id);
      const bIndex = config.groupOrder.indexOf(b.id);
      
      // If both are in custom order, sort by that
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in custom order, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
    }
    
    // Otherwise, sort by order property
    const aOrder = a.order ?? 999;
    const bOrder = b.order ?? 999;
    return aOrder - bOrder;
  });

  return groups;
}

/**
 * Filters property groups based on component props
 * Removes groups and properties that don't meet their conditions
 */
export function filterPropertyGroups(
  groups: PropertyGroup[],
  componentProps: ComponentProps,
  context?: Record<string, any>
): PropertyGroup[] {
  return groups
    .filter(group => {
      // If group has a condition, check it
      if (group.condition) {
        return group.condition(componentProps, context);
      }
      return true;
    })
    .map(group => {
      // Filter properties within the group
      const filteredProperties = group.properties.filter(prop => {
        if (prop.condition) {
          return prop.condition(componentProps, context);
        }
        return true;
      });

      return {
        ...group,
        properties: filteredProperties,
      };
    })
    .filter(group => group.properties.length > 0); // Remove groups with no properties
}

/**
 * Creates a base property configuration (layout, state, styling)
 */
export function createBasePropertyConfig(): PropertyConfig {
  return {
    baseGroups: ['layout', 'state', 'styling'],
  };
}

/**
 * Extends a property configuration with additional groups
 */
export function extendPropertyConfig(
  baseConfig: PropertyConfig,
  additionalConfig: Partial<PropertyConfig>
): PropertyConfig {
  return {
    ...baseConfig,
    baseGroups: [
      ...(baseConfig.baseGroups || []),
      ...(additionalConfig.baseGroups || []),
    ],
    extendedGroups: [
      ...(baseConfig.extendedGroups || []),
      ...(additionalConfig.extendedGroups || []),
    ],
    customGroups: [
      ...(baseConfig.customGroups || []),
      ...(additionalConfig.customGroups || []),
    ],
    excludeGroups: additionalConfig.excludeGroups || baseConfig.excludeGroups,
    groupOrder: additionalConfig.groupOrder || baseConfig.groupOrder,
  };
}

