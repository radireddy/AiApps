import React, { useState } from 'react';
import { PropertyGroup as PropertyGroupType, PropertyMetadata } from './metadata';
import { PropertyInput, PropertyInputProps } from './PropertyInput';

interface PropertyGroupProps {
  group: PropertyGroupType;
  properties: PropertyMetadata[];
  context: PropertyInputProps['context'];
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
  const sortedProperties = [...properties].sort((a, b) => {
    const orderA = a.propertyOrder ?? 999;
    const orderB = b.propertyOrder ?? 999;
    return orderA - orderB;
  });

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
          {sortedProperties.map((prop) => (
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
          {sortedProperties.map((prop) => (
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
    </div>
  );
};

