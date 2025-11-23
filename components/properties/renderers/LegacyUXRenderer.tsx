import React, { useMemo } from 'react';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { PropertyContext } from '../metadata';
import { CollapsibleSection, PropInput, PropFxInput, PropSelect } from '../../component-registry/common';

interface LegacyUXRendererProps {
  schema: ComponentPropertySchema;
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}

/**
 * Legacy UX Renderer
 * Renders metadata-driven properties using the previous UX design (CollapsibleSection, PropInput, etc.)
 * This preserves the original look and feel while using the metadata backend
 */
export const LegacyUXRenderer: React.FC<LegacyUXRendererProps> = ({
  schema,
  context,
  onUpdate,
  onOpenExpressionEditor,
  getValue,
  getError,
  isMixed,
}) => {
  // Group properties by group
  const propertiesByGroup = useMemo(() => {
    const grouped: Record<string, PropertyMetadata[]> = {};
    
    schema.properties.forEach(prop => {
      const groupId = prop.group || '__ungrouped__';
      if (!grouped[groupId]) {
        grouped[groupId] = [];
      }
      grouped[groupId].push(prop);
    });
    
    // Sort properties within each group
    Object.keys(grouped).forEach(groupId => {
      grouped[groupId].sort((a, b) => {
        const orderA = a.propertyOrder ?? 999;
        const orderB = b.propertyOrder ?? 999;
        return orderA - orderB;
      });
    });
    
    return grouped;
  }, [schema.properties]);

  // Get groups in order
  const sortedGroups = useMemo(() => {
    const groups = schema.groups || [];
    return [...groups].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
  }, [schema.groups]);

  // Render a single property using legacy components
  const renderProperty = (prop: PropertyMetadata) => {
    const value = getValue(prop.id);
    const error = getError(prop.id);
    const mixed = isMixed(prop.id);
    const displayValue = mixed ? '— Mixed —' : (value ?? prop.defaultValue ?? '');

    // Handle custom renderer
    if (prop.customRenderer) {
      const CustomRenderer = prop.customRenderer;
      return (
        <CustomRenderer
          metadata={prop}
          value={value}
          onChange={(newValue) => onUpdate(prop.id, newValue)}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={mixed}
        />
      );
    }

    // Render based on type using legacy components
    switch (prop.type) {
      case 'string':
      case 'expression':
        const supportsExpression = prop.supportsExpression ?? (prop.type === 'expression');
        const isExpression = typeof value === 'string' && value.startsWith('{{');
        
        return (
          <PropFxInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type={prop.type === 'expression' ? 'text' : undefined}
            placeholder={prop.placeholder}
            onOpenEditor={supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = isExpression ? String(value || '') : String(value || '');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            propertyKey={prop.id}
            className={error ? 'mb-2.5' : 'mb-2.5'}
          />
        );

      case 'number':
        return (
          <PropInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="number"
            placeholder={prop.placeholder}
          />
        );

      case 'boolean':
        // For boolean, we need to create a checkbox-like input
        // Since PropInput doesn't support boolean, we'll use a custom render
        return (
          <div className="mb-2.5">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={mixed ? false : (value ?? prop.defaultValue ?? false)}
                onChange={(e) => onUpdate(prop.id, e.target.checked)}
                disabled={mixed}
                className="mr-2"
              />
              <span className={`block ${prop.tooltip ? 'cursor-help' : ''}`} title={prop.tooltip}>
                {prop.label}
              </span>
            </label>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          </div>
        );

      case 'color':
        return (
          <PropFxInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="color"
            onOpenEditor={prop.supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = String(value || prop.defaultValue || '#000000');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : [];
        
        return (
          <PropSelect
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || ''))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
          />
        );

      case 'composite':
        // Composite properties need special handling
        if (!prop.compositeFields) {
          return <div className="text-red-500 text-xs">Composite property missing field definitions</div>;
        }
        
        const compositeValue = value || {};
        return (
          <div className="mb-2.5">
            <label className="block text-xs font-medium text-gray-600 mb-1">{prop.label}</label>
            <div className="grid grid-cols-2 gap-2.5">
              {prop.compositeFields.map((field) => (
                <PropInput
                  key={field.id}
                  label={field.label}
                  value={mixed ? '—' : (compositeValue[field.id] ?? field.defaultValue ?? '')}
                  onChange={(val) => {
                    onUpdate(prop.id, { ...compositeValue, [field.id]: val });
                  }}
                  type={field.type}
                />
              ))}
            </div>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          </div>
        );

      default:
        return (
          <div className="text-red-500 text-xs mb-2.5">
            Unsupported property type: {prop.type}
          </div>
        );
    }
  };

  return (
    <div className="py-1">
      {sortedGroups.map((group) => {
        const groupProperties = propertiesByGroup[group.id] || [];
        if (groupProperties.length === 0) return null;

        // Check if group has custom renderer
        if (group.customGroupRenderer) {
          const CustomGroupRenderer = group.customGroupRenderer;
          return (
            <CollapsibleSection
              key={group.id}
              title={group.label}
              isOpenDefault={!group.defaultCollapsed}
            >
              <CustomGroupRenderer
                group={group}
                properties={groupProperties}
                context={context}
                onUpdate={onUpdate}
                onOpenExpressionEditor={onOpenExpressionEditor}
                getValue={getValue}
                getError={getError}
                isMixed={isMixed}
              />
            </CollapsibleSection>
          );
        }

        // Default group rendering
        return (
          <CollapsibleSection
            key={group.id}
            title={group.label}
            isOpenDefault={!group.defaultCollapsed}
          >
            {groupProperties.map((prop) => (
              <React.Fragment key={prop.id}>
                {renderProperty(prop)}
              </React.Fragment>
            ))}
          </CollapsibleSection>
        );
      })}

      {/* Render ungrouped properties */}
      {propertiesByGroup['__ungrouped__'] && propertiesByGroup['__ungrouped__'].length > 0 && (
        <CollapsibleSection title="Other" isOpenDefault={true}>
          {propertiesByGroup['__ungrouped__'].map((prop) => (
            <React.Fragment key={prop.id}>
              {renderProperty(prop)}
            </React.Fragment>
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
};

