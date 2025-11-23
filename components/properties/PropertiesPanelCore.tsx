import React, { useMemo, useState } from 'react';
import { AppComponent, ComponentProps, DataSourceInstance, AppVariable, ComponentType } from '../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyContext } from './metadata';
import { propertyRegistry } from './registry';
import { PropertyTabs } from './PropertyTabs';
import { componentRegistry } from '../component-registry/registry';

interface PropertiesPanelCoreProps {
  components: AppComponent[];
  selectedComponentIds: string[];
  onUpdate: (id: string, newProps: Partial<ComponentProps>) => void;
  dataSources: DataSourceInstance[];
  variables: AppVariable[];
  evaluationScope: Record<string, any>;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  onArrangeContainerChildren?: (panelId: string, opts: { direction?: string; justifyContent?: string; alignItems?: string }) => void;
}

/**
 * Core metadata-driven properties panel
 * Supports tabs, groups, multi-selection, and expression editing
 */
export const PropertiesPanelCore: React.FC<PropertiesPanelCoreProps> = ({
  components,
  selectedComponentIds,
  onUpdate,
  dataSources,
  variables,
  evaluationScope,
  onOpenExpressionEditor,
  onArrangeContainerChildren,
}) => {
  const isMultiSelect = selectedComponentIds.length > 1;
  const selectedComponents = useMemo(() => {
    return components.filter(c => selectedComponentIds.includes(c.id));
  }, [components, selectedComponentIds]);

  // Get property schema for the selected component(s)
  const schema = useMemo(() => {
    if (selectedComponents.length === 0) return null;
    
    if (isMultiSelect) {
      // For multi-select, find common properties across all selected components
      const types = selectedComponents.map(c => c.type);
      const uniqueTypes = Array.from(new Set(types));
      
      // If all components are the same type, use that schema
      if (uniqueTypes.length === 1) {
        return propertyRegistry[uniqueTypes[0]];
      }
      
      // Otherwise, find common properties
      const schemas = uniqueTypes
        .map(type => propertyRegistry[type])
        .filter((s): s is ComponentPropertySchema => s !== undefined);
      
      if (schemas.length === 0) return null;
      
      // Find common properties across all schemas
      const commonPropertyIds = new Set<string>();
      const firstSchema = schemas[0];
      
      firstSchema.properties.forEach(prop => {
        if (schemas.every(s => s.properties.some(p => p.id === prop.id))) {
          commonPropertyIds.add(prop.id);
        }
      });
      
      // Create a merged schema with only common properties
      return {
        componentType: uniqueTypes[0] as ComponentType, // Use first type as representative
        tabs: firstSchema.tabs || [],
        groups: firstSchema.groups || [],
        properties: firstSchema.properties.filter(p => commonPropertyIds.has(p.id)),
      };
    } else {
      // Single selection
      const component = selectedComponents[0];
      return propertyRegistry[component.type];
    }
  }, [selectedComponents, isMultiSelect]);

  // Create property context
  const context: PropertyContext = useMemo(() => ({
    component: isMultiSelect ? undefined : selectedComponents[0],
    components: selectedComponents,
    dataSources,
    variables,
    evaluationScope,
    isMultiSelect,
    onArrangeContainerChildren,
  }), [selectedComponents, isMultiSelect, dataSources, variables, evaluationScope, onArrangeContainerChildren]);

  // Get property value (handles multi-select with mixed values)
  const getValue = (propertyId: string): any => {
    if (isMultiSelect) {
      const values = selectedComponents.map(c => (c.props as any)[propertyId]);
      const uniqueValues = Array.from(new Set(values.map(v => String(v ?? ''))));
      if (uniqueValues.length === 1) {
        return values[0];
      }
      return undefined; // Mixed - will be handled by isMixed
    }
    return (selectedComponents[0].props as any)[propertyId];
  };

  // Check if property has mixed values (multi-select)
  const isMixed = (propertyId: string): boolean => {
    if (!isMultiSelect) return false;
    const values = selectedComponents.map(c => (c.props as any)[propertyId]);
    const uniqueValues = Array.from(new Set(values.map(v => String(v ?? ''))));
    return uniqueValues.length > 1;
  };

  // Get validation error for a property
  const getError = (propertyId: string): string | undefined => {
    const metadata = schema?.properties.find(p => p.id === propertyId);
    if (!metadata?.validationRules) return undefined;

    const value = getValue(propertyId);
    
    for (const rule of metadata.validationRules) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            return rule.message || 'This field is required';
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < (rule.value ?? 0)) {
            return rule.message || `Value must be at least ${rule.value}`;
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > (rule.value ?? Infinity)) {
            return rule.message || `Value must be at most ${rule.value}`;
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && rule.value) {
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) {
              return rule.message || 'Value does not match required pattern';
            }
          }
          break;
        case 'custom':
          if (rule.validator) {
            const result = rule.validator(value);
            if (result !== true) {
              return typeof result === 'string' ? result : (rule.message || 'Invalid value');
            }
          }
          break;
      }
    }
    return undefined;
  };

  // Update property value
  const handleUpdate = (propertyId: string, value: any) => {
    if (isMultiSelect) {
      // Update all selected components
      selectedComponentIds.forEach(id => {
        onUpdate(id, { [propertyId]: value } as Partial<ComponentProps>);
      });
    } else {
      onUpdate(selectedComponentIds[0], { [propertyId]: value } as Partial<ComponentProps>);
    }
  };

  // Filter properties based on visibility conditions
  const visibleProperties = useMemo(() => {
    if (!schema) return [];
    
    return schema.properties.filter(prop => {
      // Check hidden condition
      if (prop.hidden !== undefined) {
        if (typeof prop.hidden === 'boolean' && prop.hidden) return false;
        if (typeof prop.hidden === 'function') {
          const result = prop.hidden(selectedComponents[0]?.props || {}, evaluationScope);
          if (result === true) return false;
        }
      }
      
      // Check visibleIf condition
      if (prop.visibleIf !== undefined) {
        if (typeof prop.visibleIf === 'boolean') {
          if (!prop.visibleIf) return false;
        } else if (typeof prop.visibleIf === 'function') {
          const result = prop.visibleIf(selectedComponents[0]?.props || {}, evaluationScope);
          if (result !== true) return false;
        }
      }
      
      // Check multi-edit support
      if (isMultiSelect && prop.multiEditSupport === 'none') {
        return false;
      }
      
      // Check applicableTo
      if (prop.applicableTo !== undefined && prop.applicableTo !== 'all') {
        if (isMultiSelect) {
          // For multi-select, property must be applicable to all selected component types
          const types = selectedComponents.map(c => c.type);
          return types.every(type => prop.applicableTo?.includes(type));
        } else {
          const componentType = selectedComponents[0]?.type;
          if (Array.isArray(prop.applicableTo)) {
            return prop.applicableTo.includes(componentType);
          }
        }
      }
      
      return true;
    });
  }, [schema, selectedComponents, isMultiSelect, evaluationScope]);

  if (!schema || selectedComponents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Select a component to see its properties.
      </div>
    );
  }

  return (
    <PropertyTabs
      tabs={schema.tabs || []}
      groups={schema.groups || []}
      properties={visibleProperties}
      context={context}
      onUpdate={handleUpdate}
      onOpenExpressionEditor={onOpenExpressionEditor}
      getValue={getValue}
      getError={getError}
      isMixed={isMixed}
    />
  );
};

