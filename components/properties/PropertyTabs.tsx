import React, { useState } from 'react';
import { PropertyTab, PropertyGroup, PropertyMetadata } from './metadata';
import { PropertyGroup as PropertyGroupComponent } from './PropertyGroup';
import { PropertyInput, PropertyInputProps } from './PropertyInput';

interface PropertyTabsProps {
  tabs: PropertyTab[];
  groups: PropertyGroup[];
  properties: PropertyMetadata[];
  context: PropertyInputProps['context'];
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
  // Sort tabs by order
  const sortedTabs = [...tabs].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const [activeTab, setActiveTab] = useState(sortedTabs[0]?.id || '');

  // Group properties by tab and then by group
  const propertiesByTab = sortedTabs.reduce((acc, tab) => {
    const tabProperties = properties.filter((p) => p.tab === tab.id);
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
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
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
                {activeTabData.propertiesByGroup['__ungrouped__'].map((prop) => (
                  <PropertyInput
                    key={prop.id}
                    metadata={prop}
                    value={getValue(prop.id)}
                    onChange={(value) => onUpdate(prop.id, value)}
                    context={context}
                    onOpenExpressionEditor={onOpenExpressionEditor}
                    error={getError(prop.id)}
                    isMixed={isMixed(prop.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

