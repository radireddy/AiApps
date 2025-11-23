import React from 'react';
import { PropertyGroup, PropertyMetadata } from '../metadata';
import { PropertyInputProps } from '../PropertyInput';
import { Tooltip } from '../../component-registry/common';
import { typography } from '../../../constants';

/**
 * Custom renderer for Container Layout group
 * Preserves the original icon-based UI design
 */
export const ContainerLayoutRenderer: React.FC<{
  group: PropertyGroup;
  properties: PropertyMetadata[];
  context: PropertyInputProps['context'];
  onUpdate: (propertyId: string, value: any) => void;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  getValue: (propertyId: string) => any;
  getError: (propertyId: string) => string | undefined;
  isMixed: (propertyId: string) => boolean;
}> = ({
  properties,
  context,
  onUpdate,
  getValue,
  isMixed,
}) => {
  const component = context.component;
  const componentId = component?.id;
  const onArrangeChildren = context.onArrangeContainerChildren;
  
  const dir = getValue('direction') || 'horizontal';
  const justify = getValue('justifyContent') || 'start';
  const align = getValue('alignItems') || 'center';
  
  const isDirectionMixed = isMixed('direction');
  const isJustifyMixed = isMixed('justifyContent');
  const isAlignMixed = isMixed('alignItems');

  // Direction icons - black and white, twice as wide as tall
  const HorizontalDirectionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="17" y="4" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  );

  const VerticalDirectionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
      <rect x="9" y="1" width="14" height="6" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="9" y="9" width="14" height="6" rx="1" fill="currentColor" fillOpacity="0.6"/>
    </svg>
  );

  // Justify options - black and white, twice as wide as tall
  const JustifyOptions = [
    { 
      value: 'start', 
      title: 'Start', 
      description: 'Align items to the start',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="1" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'center', 
      title: 'Center', 
      description: 'Center items',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="13" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="11.5" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'end', 
      title: 'End', 
      description: 'Align items to the end',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="25" y="6" width="6" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="22" y="11" width="9" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'space-between', 
      title: 'Space Between', 
      description: 'Distribute with space between',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="1" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="13.5" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="26" y="6" width="5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
  ];

  // Align options - black and white, twice as wide as tall
  const AlignOptions = [
    { 
      value: 'start', 
      title: 'Start', 
      description: 'Align items to the start',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="1" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="1" width="8" height="6" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'center', 
      title: 'Center', 
      description: 'Center items',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="12" y="6" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="10" y="10" width="12" height="5" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'end', 
      title: 'End', 
      description: 'Align items to the end',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="11" width="8" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="9" width="8" height="6" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
    { 
      value: 'stretch', 
      title: 'Stretch', 
      description: 'Stretch items to fill space',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-8" viewBox="0 0 32 16" fill="none" aria-hidden="true">
          <rect x="10" y="1" width="8" height="14" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
          <rect x="18" y="1" width="8" height="14" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      ) 
    },
  ];

  const handleDirectionChange = (value: string) => {
    onUpdate('direction', value);
    if (onArrangeChildren && componentId) {
      onArrangeChildren(componentId, { direction: value });
    }
  };

  const handleJustifyChange = (value: string) => {
    onUpdate('justifyContent', value);
    if (onArrangeChildren && componentId) {
      onArrangeChildren(componentId, { justifyContent: value });
    }
  };

  const handleAlignChange = (value: string) => {
    onUpdate('alignItems', value);
    if (onArrangeChildren && componentId) {
      onArrangeChildren(componentId, { alignItems: value });
    }
  };

  return (
    <div>
      {/* Direction */}
      <div className="mb-3">
        <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Direction</label>
        <div className="flex gap-2">
          <Tooltip text="Arrange horizontally">
            <button 
              onClick={() => handleDirectionChange('horizontal')}
              disabled={isDirectionMixed}
              className={`p-2 rounded-md border transition-colors ${
                isDirectionMixed 
                  ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
                  : dir === 'horizontal' 
                    ? 'bg-blue-50 border-blue-400' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
              }`} 
              aria-pressed={dir === 'horizontal'} 
              aria-label="Set direction to horizontal"
            >
              {HorizontalDirectionIcon}
            </button>
          </Tooltip>
          <Tooltip text="Arrange vertically">
            <button 
              onClick={() => handleDirectionChange('vertical')}
              disabled={isDirectionMixed}
              className={`p-2 rounded-md border transition-colors ${
                isDirectionMixed 
                  ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
                  : dir === 'vertical' 
                    ? 'bg-blue-50 border-blue-400' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
              }`} 
              aria-pressed={dir === 'vertical'} 
              aria-label="Set direction to vertical"
            >
              {VerticalDirectionIcon}
            </button>
          </Tooltip>
        </div>
        {isDirectionMixed && (
          <p className="text-xs text-gray-400 mt-1 italic">— Mixed —</p>
        )}
      </div>

      {/* Justify */}
      <div className="mb-3">
        <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Justify</label>
        <div className="flex gap-2">
          {JustifyOptions.map(opt => (
            <Tooltip key={opt.value} text={opt.description || opt.title}>
              <button 
                onClick={() => handleJustifyChange(opt.value)}
                disabled={isJustifyMixed}
                className={`p-2 rounded-md border transition-colors ${
                  isJustifyMixed 
                    ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
                    : justify === opt.value 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`} 
                aria-pressed={justify === opt.value} 
                aria-label={`Justify content: ${opt.title} - ${opt.description || ''}`}
              >
                {opt.icon}
              </button>
            </Tooltip>
          ))}
        </div>
        {isJustifyMixed && (
          <p className="text-xs text-gray-400 mt-1 italic">— Mixed —</p>
        )}
      </div>

      {/* Align */}
      <div className="mb-0">
        <label className={`block ${typography.body} ${typography.medium} text-gray-600 mb-2`}>Align</label>
        <div className="flex gap-2">
          {AlignOptions.map(opt => (
            <Tooltip key={opt.value} text={opt.description || opt.title}>
              <button 
                onClick={() => handleAlignChange(opt.value)}
                disabled={isAlignMixed}
                className={`p-2 rounded-md border transition-colors ${
                  isAlignMixed 
                    ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed' 
                    : align === opt.value 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`} 
                aria-pressed={align === opt.value} 
                aria-label={`Align items: ${opt.title} - ${opt.description || ''}`}
              >
                {opt.icon}
              </button>
            </Tooltip>
          ))}
        </div>
        {isAlignMixed && (
          <p className="text-xs text-gray-400 mt-1 italic">— Mixed —</p>
        )}
      </div>
    </div>
  );
};

