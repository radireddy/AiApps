import React, { useState, useMemo } from 'react';
import { PropertyGroup as PropertyGroupType, PropertyMetadata, PropertyContext } from './metadata';
import { CollapsibleSection, PropInput, PropFxInput, PropSelect } from '../component-registry/common';

interface PropertyGroupProps {
  group: PropertyGroupType;
  properties: PropertyMetadata[];
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({
  group,
  properties,
  context,
  onUpdate,
  onOpenExpressionEditor,
  getValue,
  getError,
  isMixed,
}) => {
  const [isOpen, setIsOpen] = useState(!group.defaultCollapsed);
  const sectionId = `group-${group.id}`;

  // Sort properties by order
  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      const orderA = a.propertyOrder ?? 999;
      const orderB = b.propertyOrder ?? 999;
      return orderA - orderB;
    });
  }, [properties]);

  // Render a single property input (without wrapper) - using smart layout logic
  const renderPropertyInput = (prop: PropertyMetadata, compact: boolean = false) => {
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

    // Render based on type
    switch (prop.type) {
      case 'string':
      case 'expression':
      case 'code':
        const supportsExpression = prop.supportsExpression ?? (prop.type === 'expression' || prop.type === 'code');
        const isExpression = typeof value === 'string' && value.startsWith('{{');
        
        return (
          <PropFxInput
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type={prop.type === 'expression' || prop.type === 'code' ? 'text' : undefined}
            placeholder={prop.placeholder}
            onOpenEditor={supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = isExpression ? String(value || '') : String(value || '');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            propertyKey={prop.id}
            className={compact ? 'mb-0' : 'mb-2.5'}
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
            className={compact ? 'mb-0' : undefined}
          />
        );

      case 'boolean':
        return (
          <div className={compact ? 'mb-0' : 'mb-2.5'}>
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
            className={compact ? 'mb-0' : undefined}
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
            className={compact ? 'mb-0' : undefined}
          />
        );

      case 'composite':
        if (!prop.compositeFields) {
          return <div className="text-red-500 text-xs">Composite property missing field definitions</div>;
        }
        
        const compositeValue = value || {};
        return (
          <div className={compact ? 'mb-0' : 'mb-2.5'}>
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

  // Smart layout: Group related properties for efficient space usage
  const renderPropertyGroup = (properties: PropertyMetadata[]) => {
    // Detect common patterns for grouping
    const layoutGroups: Record<string, PropertyMetadata[]> = {};
    const standalone: PropertyMetadata[] = [];

    properties.forEach(prop => {
      // Check for layout hints
      if (prop.layoutHint?.layoutGroupId) {
        const groupId = prop.layoutHint.layoutGroupId;
        if (!layoutGroups[groupId]) {
          layoutGroups[groupId] = [];
        }
        layoutGroups[groupId].push(prop);
      } else {
        // Auto-detect common patterns
        const id = prop.id.toLowerCase();
        
        // Position pairs: x/y
        if (id === 'x' || id === 'y') {
          if (!layoutGroups['position']) {
            layoutGroups['position'] = [];
          }
          layoutGroups['position'].push(prop);
        }
        // Size pairs: width/height
        else if (id === 'width' || id === 'height') {
          if (!layoutGroups['size']) {
            layoutGroups['size'] = [];
          }
          layoutGroups['size'].push(prop);
        }
        // Validation triple: min/max/maxlength
        else if (id === 'min' || id === 'max' || id === 'maxlength') {
          if (!layoutGroups['validation']) {
            layoutGroups['validation'] = [];
          }
          layoutGroups['validation'].push(prop);
        }
        // Spacing pairs: padding/margin
        else if (id === 'padding' || id === 'margin') {
          if (!layoutGroups['spacing']) {
            layoutGroups['spacing'] = [];
          }
          layoutGroups['spacing'].push(prop);
        }
        // Border pairs: borderWidth/borderColor
        else if (id === 'borderwidth' || id === 'bordercolor') {
          if (!layoutGroups['border']) {
            layoutGroups['border'] = [];
          }
          layoutGroups['border'].push(prop);
        }
        else {
          standalone.push(prop);
        }
      }
    });

    const elements: React.ReactNode[] = [];

    // Helper function to get max width from property layout hint
    const getMaxWidth = (prop: PropertyMetadata): string | undefined => {
      return prop.layoutHint?.maxWidth;
    };

    // Render position group (X, Y) - Responsive 2 columns that wrap with max width
    if (layoutGroups['position'] && layoutGroups['position'].length === 2) {
      const [xProp, yProp] = layoutGroups['position'].sort((a, b) => {
        if (a.id === 'x') return -1;
        if (b.id === 'x') return 1;
        return 0;
      });
      const xMaxWidth = getMaxWidth(xProp);
      const yMaxWidth = getMaxWidth(yProp);
      const minWidth = xMaxWidth || yMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="position" className="flex flex-wrap gap-2.5 mb-2.5">
          <div style={{ flex: xMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: xMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(xProp, true)}
          </div>
          <div style={{ flex: yMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: yMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(yProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['position']) {
      // If only one, render standalone
      layoutGroups['position'].forEach(prop => standalone.push(prop));
    }

    // Render size group (Width, Height) - Responsive 2 columns that wrap with max width
    if (layoutGroups['size'] && layoutGroups['size'].length === 2) {
      const [widthProp, heightProp] = layoutGroups['size'].sort((a, b) => {
        if (a.id === 'width') return -1;
        if (b.id === 'width') return 1;
        return 0;
      });
      const widthMaxWidth = getMaxWidth(widthProp);
      const heightMaxWidth = getMaxWidth(heightProp);
      const minWidth = widthMaxWidth || heightMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="size" className="flex flex-wrap gap-2.5 mb-2.5">
          <div style={{ flex: widthMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: widthMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(widthProp, true)}
          </div>
          <div style={{ flex: heightMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: heightMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(heightProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['size']) {
      layoutGroups['size'].forEach(prop => standalone.push(prop));
    }

    // Render validation group (Min, Max, MaxLength) - Responsive columns that wrap with max width
    if (layoutGroups['validation'] && layoutGroups['validation'].length > 0) {
      const sorted = layoutGroups['validation'].sort((a, b) => {
        const order = ['maxlength', 'min', 'max'];
        const aIdx = order.indexOf(a.id.toLowerCase());
        const bIdx = order.indexOf(b.id.toLowerCase());
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
      
      if (sorted.length === 3) {
        elements.push(
          <div key="validation" className="flex flex-wrap gap-2.5 mb-2.5">
            {sorted.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: '100px' }}>
                  {renderPropertyInput(prop, true)}
                </div>
              );
            })}
          </div>
        );
      } else if (sorted.length === 2) {
        // If 2 properties, use responsive 2 columns
        elements.push(
          <div key="validation" className="flex flex-wrap gap-2.5 mb-2.5">
            {sorted.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: '150px' }}>
                  {renderPropertyInput(prop, true)}
                </div>
              );
            })}
          </div>
        );
      } else {
        // If 1 property, render standalone
        sorted.forEach(prop => standalone.push(prop));
      }
    }

    // Render spacing group (Padding, Margin) - Responsive 2 columns that wrap with max width
    if (layoutGroups['spacing'] && layoutGroups['spacing'].length === 2) {
      const [paddingProp, marginProp] = layoutGroups['spacing'].sort((a, b) => {
        if (a.id === 'padding') return -1;
        if (b.id === 'padding') return 1;
        return 0;
      });
      const paddingMaxWidth = getMaxWidth(paddingProp);
      const marginMaxWidth = getMaxWidth(marginProp);
      const minWidth = paddingMaxWidth || marginMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="spacing" className="flex flex-wrap gap-2.5 mb-2.5">
          <div style={{ flex: paddingMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: paddingMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(paddingProp, true)}
          </div>
          <div style={{ flex: marginMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: marginMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(marginProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['spacing']) {
      layoutGroups['spacing'].forEach(prop => standalone.push(prop));
    }

    // Render border group (BorderWidth, BorderColor) - Responsive 2 columns that wrap with max width
    if (layoutGroups['border'] && layoutGroups['border'].length === 2) {
      const [widthProp, colorProp] = layoutGroups['border'].sort((a, b) => {
        if (a.id.toLowerCase().includes('width')) return -1;
        if (b.id.toLowerCase().includes('width')) return 1;
        return 0;
      });
      const borderWidthMaxWidth = getMaxWidth(widthProp);
      const borderColorMaxWidth = getMaxWidth(colorProp);
      const minWidth = borderWidthMaxWidth || borderColorMaxWidth ? '100px' : '150px';
      elements.push(
        <div key="border" className="flex flex-wrap gap-2.5 mb-2.5">
          <div style={{ flex: borderWidthMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: borderWidthMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(widthProp, true)}
          </div>
          <div style={{ flex: borderColorMaxWidth ? '0 1 auto' : '1 1 0%', maxWidth: borderColorMaxWidth, minWidth: minWidth }}>
            {renderPropertyInput(colorProp, true)}
          </div>
        </div>
      );
    } else if (layoutGroups['border']) {
      layoutGroups['border'].forEach(prop => standalone.push(prop));
    }

    // Render custom layout groups - Responsive wrapping with max width
    Object.keys(layoutGroups).forEach(groupId => {
      if (!['position', 'size', 'validation', 'spacing', 'border'].includes(groupId)) {
        const groupProps = layoutGroups[groupId];
        const minWidth = groupProps.length <= 2 ? '150px' : '100px';
        elements.push(
          <div key={groupId} className="flex flex-wrap gap-2.5 mb-2.5">
            {groupProps.map(prop => {
              const maxWidth = getMaxWidth(prop);
              return (
                <div key={prop.id} style={{ flex: maxWidth ? '0 1 auto' : '1 1 0%', maxWidth: maxWidth, minWidth: minWidth }}>
                  {renderPropertyInput(prop, true)}
                </div>
              );
            })}
          </div>
        );
      }
    });

    // Render standalone properties (full width)
    standalone.forEach(prop => {
      elements.push(
        <React.Fragment key={prop.id}>
          {renderPropertyInput(prop, false)}
        </React.Fragment>
      );
    });

    return <>{elements}</>;
  };

  // Use custom renderer if provided
  if (group.customGroupRenderer) {
    const CustomRenderer = group.customGroupRenderer;
    return (
      <div className="border-b border-gray-200 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center text-left font-semibold text-gray-700 text-sm hover:bg-gray-50 p-1 rounded-md"
          aria-expanded={isOpen}
          aria-controls={sectionId}
        >
          <span>{group.label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {isOpen && (
          <div id={sectionId} className="p-1 mt-2">
            <CustomRenderer
              group={group}
              properties={sortedProperties}
              context={context}
              onUpdate={onUpdate}
              onOpenExpressionEditor={onOpenExpressionEditor}
              getValue={getValue}
              getError={getError}
              isMixed={isMixed}
            />
          </div>
        )}
      </div>
    );
  }

  if (group.collapsible === false) {
    return (
      <div className="border-b border-gray-200 py-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 px-1">{group.label}</h4>
        <div className="p-1">
          {renderPropertyGroup(sortedProperties)}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-semibold text-gray-700 text-sm hover:bg-gray-50 p-1 rounded-md"
        aria-expanded={isOpen}
        aria-controls={sectionId}
      >
        <span>{group.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {isOpen && (
        <div id={sectionId} className="p-1 mt-2">
          {renderPropertyGroup(sortedProperties)}
        </div>
      )}
    </div>
  );
};
