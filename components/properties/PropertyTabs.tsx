import React, { useState } from 'react';
import { PropertyTab, PropertyGroup, PropertyMetadata, PropertyContext } from './metadata';
import { PropertyGroup as PropertyGroupComponent } from './PropertyGroup';
import { PropFxInput, PropInput, PropSelect } from '../component-registry/common';
import { DEFAULT_GROUP_ORDER } from './registry';

interface PropertyTabsProps {
  tabs: PropertyTab[];
  groups: PropertyGroup[];
  properties: PropertyMetadata[];
  context: PropertyContext;
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}

export const PropertyTabs: React.FC<PropertyTabsProps> = ({
  tabs,
  groups,
  properties,
  context,
  onUpdate,
  onOpenExpressionEditor,
  getValue,
  getError,
  isMixed,
}) => {
  // Helper function to render a property using PropFxInput, PropInput, PropSelect
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
          key={prop.id}
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
            key={prop.id}
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
            className="mb-2.5"
          />
        );

      case 'number':
        return (
          <PropInput
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="number"
            placeholder={prop.placeholder}
            className="mb-2.5"
          />
        );

      case 'boolean':
        return (
          <div key={prop.id} className="mb-2.5">
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
            key={prop.id}
            label={prop.label}
            value={displayValue}
            onChange={(val) => onUpdate(prop.id, val)}
            type="color"
            onOpenEditor={prop.supportsExpression && onOpenExpressionEditor ? (val) => {
              const currentValue = String(value || prop.defaultValue || '#000000');
              onOpenExpressionEditor(currentValue, (newVal) => onUpdate(prop.id, newVal));
            } : undefined}
            className="mb-2.5"
          />
        );

      case 'dropdown':
        const options = prop.options
          ? (typeof prop.options === 'function' ? prop.options(context) : prop.options)
          : [];
        
        return (
          <PropSelect
            key={prop.id}
            label={prop.label}
            value={mixed ? '' : (value ?? prop.defaultValue ?? (options[0]?.value || ''))}
            onChange={(val) => onUpdate(prop.id, val)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            className="mb-2.5"
          />
        );

      case 'composite':
        if (!prop.compositeFields) {
          return <div key={prop.id} className="text-red-500 text-xs mb-2.5">Composite property missing field definitions</div>;
        }
        
        const compositeValue = value || {};
        return (
          <div key={prop.id} className="mb-2.5">
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
          <div key={prop.id} className="text-red-500 text-xs mb-2.5">
            Unsupported property type: {prop.type}
          </div>
        );
    }
  };

  // Sort tabs by order
  const sortedTabs = [...tabs].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const [activeTab, setActiveTab] = useState(sortedTabs[0]?.id || '');

  // Deduplicate properties by id (first occurrence wins)
  const uniqueProperties = Array.from(
    new Map(properties.map(p => [p.id, p])).values()
  );

  // Group properties by tab and then by group
  const propertiesByTab = sortedTabs.reduce((acc, tab) => {
    const tabProperties = uniqueProperties.filter((p) => p.tab === tab.id);
    const propertiesByGroup = groups
      .filter((g) => g.tab === tab.id)
      .reduce((groupAcc, group) => {
        const groupProperties = tabProperties.filter((p) => p.group === group.id);
        if (groupProperties.length > 0) {
          groupAcc[group.id] = groupProperties;
        }
        return groupAcc;
      }, {} as Record<string, PropertyMetadata[]>);

    // Properties without a group go into a default group
    const ungroupedProperties = tabProperties.filter((p) => !p.group);
    if (ungroupedProperties.length > 0) {
      propertiesByGroup['__ungrouped__'] = ungroupedProperties;
    }

    acc[tab.id] = {
      properties: tabProperties,
      groups: groups.filter((g) => g.tab === tab.id),
      propertiesByGroup,
    };
    return acc;
  }, {} as Record<string, { properties: PropertyMetadata[]; groups: PropertyGroup[]; propertiesByGroup: Record<string, PropertyMetadata[]> }>);

  const activeTabData = propertiesByTab[activeTab];

  // If no tabs, render all properties in a single view
  if (sortedTabs.length === 0) {
    // Group properties by group
    const propertiesByGroup = groups.reduce((acc, group) => {
      const groupProperties = uniqueProperties.filter((p) => p.group === group.id);
      if (groupProperties.length > 0) {
        acc[group.id] = groupProperties;
      }
      return acc;
    }, {} as Record<string, PropertyMetadata[]>);

    // Ungrouped properties
    const ungroupedProperties = uniqueProperties.filter((p) => !p.group);

    return (
      <div className="flex flex-col h-full overflow-y-auto p-2">
        {groups
          .sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            return orderA - orderB;
          })
          .map((group) => {
            const groupProperties = propertiesByGroup[group.id] || [];
            if (groupProperties.length === 0) return null;
            return (
              <PropertyGroupComponent
                key={group.id}
                group={group}
                properties={groupProperties}
                context={context}
                onUpdate={onUpdate}
                onOpenExpressionEditor={onOpenExpressionEditor}
                getValue={getValue}
                getError={getError}
                isMixed={isMixed}
              />
            );
          })}
        {ungroupedProperties.length > 0 && (
          <div className="py-2">
            {ungroupedProperties.map((prop) => renderProperty(prop))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {sortedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2" role="tabpanel">
        {activeTabData && (
          <>
            {/* Render grouped properties */}
            {activeTabData.groups
              .sort((a, b) => {
                // Use orderOverride if provided, otherwise use order, otherwise use default order
                const orderA = a.orderOverride ?? a.order ?? DEFAULT_GROUP_ORDER[a.id] ?? 999;
                const orderB = b.orderOverride ?? b.order ?? DEFAULT_GROUP_ORDER[b.id] ?? 999;
                return orderA - orderB;
              })
              .map((group) => {
                const groupProperties = activeTabData.propertiesByGroup[group.id] || [];
                if (groupProperties.length === 0) return null;
                return (
                  <PropertyGroupComponent
                    key={group.id}
                    group={group}
                    properties={groupProperties}
                    context={context}
                    onUpdate={onUpdate}
                    onOpenExpressionEditor={onOpenExpressionEditor}
                    getValue={getValue}
                    getError={getError}
                    isMixed={isMixed}
                  />
                );
              })}

            {/* Render ungrouped properties */}
            {activeTabData.propertiesByGroup['__ungrouped__'] && (
              <div className="py-2">
                {activeTabData.propertiesByGroup['__ungrouped__'].map((prop) => renderProperty(prop))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

