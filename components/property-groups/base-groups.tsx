/* @refresh reset */
import { PropertyGroup, PropertyDefinition, PropertyGroupRendererProps, PropertyRendererProps } from './types';
import { ComponentProps, BorderProps } from '../../types';
import { ComponentType } from '../../types';
import { shouldShowProperty, ComponentTypeGroups } from './component-helpers';
import { PropInput, PropFxInput, PropSelect } from '../component-registry/common';
import React from 'react';

/**
 * (1) Basic Properties
 * Common to almost every component.
 */
export const BasicPropertiesGroup: PropertyGroup = {
  id: 'basic',
  title: 'Basic',
  order: 1,
  collapsible: true,
  defaultCollapsed: false,
  properties: [
    {
      key: 'hidden',
      label: 'Hide',
      type: 'expression',
      placeholder: 'e.g. {{!showAlert}} (use ! to invert: false = visible, true = hidden)',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all components - visibility is always available
        return true;
      },
    },
    {
      key: 'disabled',
      label: 'Disabled',
      type: 'expression',
      placeholder: 'e.g. {{table1.selectedRecord == null}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Don't show for panel/container components
        const componentType = context?.componentType;
        if (componentType && [
          ComponentType.PANEL,
          ComponentType.H_STACK,
          ComponentType.V_STACK,
        ].includes(componentType)) {
          return false;
        }
        // Show for all other components
        return true;
      },
    },
    // Tooltip - needs to be added to component types if not present
    // For now, show for components that support it
    {
      key: 'tooltip',
      label: 'Tooltip',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.TOOLTIP_COMPONENTS, context);
      },
    },
    // Text content properties moved here
    {
      key: 'text',
      label: 'Text',
      type: 'expression',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        const componentType = context?.componentType;
        // Don't show 'text' for checkbox/switch - they use 'label' instead
        if (componentType && [ComponentType.CHECKBOX, ComponentType.SWITCH].includes(componentType)) {
          return false;
        }
        return shouldShowProperty(ComponentTypeGroups.TEXT_CONTENT_COMPONENTS, context) || 'text' in props;
      },
    },
    {
      key: 'label',
      label: 'Label',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        const componentType = context?.componentType;
        // Show 'label' for checkbox and switch components
        return componentType && [ComponentType.CHECKBOX, ComponentType.SWITCH].includes(componentType);
      },
    },
    {
      key: 'placeholder',
      label: 'Placeholder',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.PLACEHOLDER_COMPONENTS, context) || 'placeholder' in props;
      },
    },
    // Content properties (component-specific like textRenderer)
    {
      key: 'textRenderer',
      label: 'Text Renderer',
      type: 'select',
      options: [
        { value: 'javascript', label: 'JavaScript Expression' },
        { value: 'markdown', label: 'Markdown' },
        { value: 'literal', label: 'Plain Text' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.LABEL], context) || 'textRenderer' in props;
      },
    },
  ],
};

/**
 * Custom renderer for Layout & Position group
 * Shows X/Y and Width/Height in grid rows
 */
const LayoutPositionGroupRenderer: React.FC<PropertyGroupRendererProps> = ({ group, rendererProps }) => {
  const { props, updateProp } = rendererProps;
  const p = props as any;
  
  return (
    <div className="mb-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <PropInput label="X" value={p.x} onChange={val => updateProp('x', val)} type="number" />
        <PropInput label="Y" value={p.y} onChange={val => updateProp('y', val)} type="number" />
        <PropInput label="Width" value={p.width} onChange={val => updateProp('width', val)} type="number" />
        <PropInput label="Height" value={p.height} onChange={val => updateProp('height', val)} type="number" />
      </div>
    </div>
  );
};

/**
 * (3) Layout & Position
 * Controls arrangement and spacing.
 */
export const LayoutPositionGroup: PropertyGroup = {
  id: 'layout-position',
  title: 'Layout And Position',
  order: 3,
  collapsible: true,
  defaultCollapsed: false,
  customGroupRenderer: LayoutPositionGroupRenderer,
  properties: [
    {
      key: 'x',
      label: 'X',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all canvas-based components
        return true;
      },
    },
    {
      key: 'y',
      label: 'Y',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all canvas-based components
        return true;
      },
    },
    {
      key: 'width',
      label: 'Width',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all components
        return true;
      },
    },
    {
      key: 'height',
      label: 'Height',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all components
        return true;
      },
    },
    // Padding - needs to be added if not present
    {
      key: 'padding',
      label: 'Padding',
      type: 'expression',
      placeholder: 'e.g. 8px or {{theme.spacing.md}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
      },
    },
    // Margin - needs to be added if not present
    {
      key: 'margin',
      label: 'Margin',
      type: 'expression',
      placeholder: 'e.g. 8px or {{theme.spacing.md}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
      },
    },
    {
      key: 'textAlign',
      label: 'Alignment',
      type: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.ALIGNMENT_COMPONENTS, context);
      },
    },
    {
      key: 'direction',
      label: 'Flex Direction',
      type: 'select',
      options: [
        { value: 'horizontal', label: 'Row' },
        { value: 'vertical', label: 'Column' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
      },
    },
  ],
};

/**
 * (4) Color & Typography
 * Styling inbound to theming systems.
 */
export const ColorTypographyGroup: PropertyGroup = {
  id: 'color-typography',
  title: 'Color And Typography',
  order: 4,
  collapsible: true,
  defaultCollapsed: false,
  properties: [
    {
      key: 'color',
      label: 'Color / Text Color',
      type: 'expression',
      inputProps: { type: 'color' },
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for text-based components
        return shouldShowProperty(ComponentTypeGroups.TEXT_BASED, context) || 'color' in props;
      },
    },
    {
      key: 'textColor',
      label: 'Text Color',
      type: 'expression',
      inputProps: { type: 'color' },
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for Button and other components with textColor
        return 'textColor' in props;
      },
    },
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'expression',
      inputProps: { type: 'color' },
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return 'backgroundColor' in props;
      },
    },
    {
      key: 'fontFamily',
      label: 'Font Family',
      type: 'expression',
      placeholder: 'Inter, sans-serif',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.TEXT_BASED, context) || 'fontFamily' in props;
      },
    },
    {
      key: 'fontSize',
      label: 'Font Size',
      type: 'expression',
      inputProps: { type: 'number' },
      placeholder: 'e.g. 16 or {{theme.font.size}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.TEXT_BASED, context) || 'fontSize' in props;
      },
    },
    {
      key: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.TEXT_BASED, context) || 'fontWeight' in props;
      },
    },
    {
      key: 'textAlign',
      label: 'Text Align',
      type: 'select',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for Label, Text Input, Table Columns
        return shouldShowProperty([ComponentType.LABEL, ComponentType.INPUT, ComponentType.TEXTAREA, ComponentType.TABLE], context) || 'textAlign' in props;
      },
    },
  ],
};

// Border Properties merged into StylingPropertiesGroup below

// Text Content Properties merged into BasicPropertiesGroup above

/**
 * Custom renderer for Input & Value Properties group
 * Shows Min, Max, and Max Length in the same row to save space
 */
const InputValueGroupRenderer: React.FC<PropertyGroupRendererProps> = ({ group, rendererProps }) => {
  const { props, updateProp, onOpenExpressionEditor, context } = rendererProps;
  const p = props as any;
  
  // Filter visible properties
  const visibleProperties = group.properties.filter(prop => {
    if (prop.condition) {
      return prop.condition(props, context);
    }
    return true;
  });

  // Separate properties
  const defaultValueProp = visibleProperties.find(p => p.key === 'defaultValue');
  const patternProp = visibleProperties.find(p => p.key === 'pattern');
  const inputTypeProp = visibleProperties.find(p => p.key === 'inputType');
  const minProp = visibleProperties.find(p => p.key === 'min');
  const maxProp = visibleProperties.find(p => p.key === 'max');
  const maxLengthProp = visibleProperties.find(p => p.key === 'maxLength');

  return (
    <div>
      {defaultValueProp && (
        <PropFxInput
          label={defaultValueProp.label}
          value={p[defaultValueProp.key] ?? ''}
          onChange={val => updateProp(defaultValueProp.key, val)}
          onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp(defaultValueProp.key, newVal)) : undefined}
        />
      )}
      {patternProp && (
        <PropInput
          label={patternProp.label}
          value={p[patternProp.key] ?? ''}
          onChange={val => updateProp(patternProp.key, val)}
          placeholder={patternProp.placeholder}
        />
      )}
      {inputTypeProp && (
        <PropSelect
          label={inputTypeProp.label}
          value={p[inputTypeProp.key] ?? inputTypeProp.defaultValue}
          onChange={val => updateProp(inputTypeProp.key, val)}
          options={typeof inputTypeProp.options === 'function' ? inputTypeProp.options(context) : (inputTypeProp.options || [])}
        />
      )}
      {(minProp || maxProp || maxLengthProp) && (
        <div className="grid grid-cols-3 gap-2.5">
          {maxLengthProp && (
            <PropInput
              label={maxLengthProp.label}
              value={p[maxLengthProp.key] ?? 0}
              onChange={val => updateProp(maxLengthProp.key, val)}
              type="number"
            />
          )}
          {minProp && (
            <PropInput
              label={minProp.label}
              value={p[minProp.key] ?? 0}
              onChange={val => updateProp(minProp.key, val)}
              type="number"
            />
          )}
          {maxProp && (
            <PropInput
              label={maxProp.label}
              value={p[maxProp.key] ?? 0}
              onChange={val => updateProp(maxProp.key, val)}
              type="number"
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * (5) Input Form and Validation Properties
 * For fields accepting user input, merged with form validation.
 */
export const InputValueGroup: PropertyGroup = {
  id: 'input-value',
  title: 'Input Form And Validation',
  order: 5,
  collapsible: true,
  defaultCollapsed: false,
  customGroupRenderer: InputValueGroupRenderer,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.INPUT_COMPONENTS, context);
  },
  properties: [
    // defaultValue - needs to be added if not present
    {
      key: 'defaultValue',
      label: 'Default Value',
      type: 'expression',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.INPUT_COMPONENTS, context);
      },
    },
    // maxLength - needs to be added if not present
    {
      key: 'maxLength',
      label: 'Max Length',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.INPUT, ComponentType.TEXTAREA], context);
      },
    },
    // pattern/regex - needs to be added if not present
    {
      key: 'pattern',
      label: 'Pattern / Regex',
      type: 'text',
      placeholder: 'e.g. [A-Za-z]+',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.INPUT, ComponentType.TEXTAREA], context);
      },
    },
    // inputType - needs to be added if not present
    {
      key: 'inputType',
      label: 'Input Type',
      type: 'select',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'email', label: 'Email' },
        { value: 'password', label: 'Password' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.INPUT], context);
      },
    },
    // min, max - needs to be added if not present
    {
      key: 'min',
      label: 'Min',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.INPUT], context);
      },
    },
    {
      key: 'max',
      label: 'Max',
      type: 'number',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.INPUT], context);
      },
    },
  ],
};

// Form & Validation Properties merged into InputValueGroup above
// Event Properties merged into Button's actionGroup (custom group)
// Table's rowSelectAction is in its custom group

/**
 * (9) Data Properties
 * Data binding and dynamic content.
 */
export const DataPropertiesGroup: PropertyGroup = {
  id: 'data',
  title: 'Data',
  order: 9,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    // Show group if component is a data source component OR has any of the properties in this group
    return shouldShowProperty(ComponentTypeGroups.DATA_SOURCE_COMPONENTS, context) ||
           'dataSourceName' in props ||
           'columns' in props ||
           'options' in props ||
           (context?.componentType && [ComponentType.SELECT, ComponentType.RADIO_GROUP].includes(context.componentType));
  },
  properties: [
    {
      key: 'dataSourceName',
      label: 'Data Source',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.DATA_SOURCE_COMPONENTS, context) || 'dataSourceName' in props;
      },
    },
    {
      key: 'columns',
      label: 'Columns',
      type: 'text',
      placeholder: 'e.g. Name:name,Email:email',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.TABLE], context) || 'columns' in props;
      },
    },
    {
      key: 'options',
      label: 'Options',
      type: 'text',
      placeholder: 'e.g. Option 1,Option 2,Option 3',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.SELECT, ComponentType.RADIO_GROUP], context) || 'options' in props;
      },
    },
  ],
};

/**
 * (10) Media Properties
 * For visual content.
 */
export const MediaPropertiesGroup: PropertyGroup = {
  id: 'media',
  title: 'Media',
  order: 10,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.MEDIA_COMPONENTS, context);
  },
  properties: [
    {
      key: 'src',
      label: 'Source (src)',
      type: 'expression',
      placeholder: 'e.g. https://example.com/image.jpg',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.IMAGE], context) || 'src' in props;
      },
    },
    {
      key: 'objectFit',
      label: 'Fit',
      type: 'select',
      options: [
        { value: 'cover', label: 'Cover' },
        { value: 'contain', label: 'Contain' },
        { value: 'fill', label: 'Fill' },
        { value: 'none', label: 'None' },
        { value: 'scale-down', label: 'Scale Down' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.IMAGE], context) || 'objectFit' in props;
      },
    },
    {
      key: 'alt',
      label: 'Alt Text',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.IMAGE], context) || 'alt' in props;
      },
    },
  ],
};

/**
 * (2) Container / Layout-Specific
 * Only for layout components.
 * Moved to top (order 2)
 */
export const ContainerLayoutGroup: PropertyGroup = {
  id: 'container-layout',
  title: 'Container Layout Specific',
  order: 2,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
  },
  properties: [
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context) || 'direction' in props;
      },
    },
    {
      key: 'justifyContent',
      label: 'Justify',
      type: 'select',
      options: [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'space-between', label: 'Space Between' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context) || 'justifyContent' in props;
      },
    },
    {
      key: 'alignItems',
      label: 'Align',
      type: 'select',
      options: [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
        { value: 'stretch', label: 'Stretch' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context) || 'alignItems' in props;
      },
    },
    // scrollable - needs to be added if not present
    {
      key: 'scrollable',
      label: 'Scrollable',
      type: 'expression',
      placeholder: 'e.g. {{true}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
      },
    },
    // wrap - needs to be added if not present
    {
      key: 'wrap',
      label: 'Wrap',
      type: 'expression',
      placeholder: 'e.g. {{true}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.CONTAINER_COMPONENTS, context);
      },
    },
  ],
};

/**
 * Custom renderer for border properties with consistent, responsive layout
 * All labels are on top, using responsive grid layouts
 */
const BorderPropertiesRenderer: React.FC<PropertyRendererProps> = ({ props, updateProp, onOpenExpressionEditor }) => {
  const borderProps = props as BorderProps;
  
  return (
    <div className="space-y-4">
      {/* Border Style - Full Width */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Style</label>
        <select
          value={borderProps.borderStyle || 'none'}
          onChange={(e) => updateProp('borderStyle', e.target.value)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7 bg-white text-gray-800"
        >
          <option value="none">None</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>

      {/* Border Width and Color - Responsive 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PropFxInput
          label="Width"
          value={borderProps.borderWidth || ''}
          onChange={(val) => updateProp('borderWidth', val)}
          type="number"
          placeholder="0"
          className="mb-0"
          onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderWidth', newVal)) : undefined}
        />
        <PropFxInput
          label="Color"
          value={borderProps.borderColor || '#000000'}
          onChange={(val) => updateProp('borderColor', val)}
          type="color"
          className="mb-0"
          onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderColor', newVal)) : undefined}
        />
      </div>

      {/* Individual Border Sides - Responsive 2x2 grid */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Individual Sides</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <PropFxInput
              label="Top"
              value={borderProps.borderTop || ''}
              onChange={(val) => {
                // Allow empty string to clear the property
                if (val === '' || val === null || val === undefined) {
                  updateProp('borderTop', undefined);
                } else {
                  updateProp('borderTop', val);
                }
              }}
              type="number"
              placeholder="0"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderTop', newVal === '' ? undefined : newVal)) : undefined}
            />
            {borderProps.borderTop !== undefined && borderProps.borderTop !== '' && String(borderProps.borderTop).trim() !== '' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateProp('borderTop', undefined);
                }}
                className="absolute right-8 top-[1.75rem] p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Top border"
                aria-label="Clear Top border"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <PropFxInput
              label="Right"
              value={borderProps.borderRight || ''}
              onChange={(val) => {
                // Allow empty string to clear the property
                if (val === '' || val === null || val === undefined) {
                  updateProp('borderRight', undefined);
                } else {
                  updateProp('borderRight', val);
                }
              }}
              type="number"
              placeholder="0"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderRight', newVal === '' ? undefined : newVal)) : undefined}
            />
            {borderProps.borderRight !== undefined && borderProps.borderRight !== '' && String(borderProps.borderRight).trim() !== '' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateProp('borderRight', undefined);
                }}
                className="absolute right-8 top-[1.75rem] p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Right border"
                aria-label="Clear Right border"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <PropFxInput
              label="Bottom"
              value={borderProps.borderBottom || ''}
              onChange={(val) => {
                // Allow empty string to clear the property
                if (val === '' || val === null || val === undefined) {
                  updateProp('borderBottom', undefined);
                } else {
                  updateProp('borderBottom', val);
                }
              }}
              type="number"
              placeholder="0"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderBottom', newVal === '' ? undefined : newVal)) : undefined}
            />
            {borderProps.borderBottom !== undefined && borderProps.borderBottom !== '' && String(borderProps.borderBottom).trim() !== '' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateProp('borderBottom', undefined);
                }}
                className="absolute right-8 top-[1.75rem] p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Bottom border"
                aria-label="Clear Bottom border"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <PropFxInput
              label="Left"
              value={borderProps.borderLeft || ''}
              onChange={(val) => {
                // Allow empty string to clear the property
                if (val === '' || val === null || val === undefined) {
                  updateProp('borderLeft', undefined);
                } else {
                  updateProp('borderLeft', val);
                }
              }}
              type="number"
              placeholder="0"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderLeft', newVal === '' ? undefined : newVal)) : undefined}
            />
            {borderProps.borderLeft !== undefined && borderProps.borderLeft !== '' && String(borderProps.borderLeft).trim() !== '' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateProp('borderLeft', undefined);
                }}
                className="absolute right-8 top-[1.75rem] p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Left border"
                aria-label="Clear Left border"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Border Radius - Full Width */}
      <PropFxInput
        label="Radius"
        value={borderProps.borderRadius || ''}
        onChange={(val) => updateProp('borderRadius', val)}
        type="number"
        placeholder="0"
        onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderRadius', newVal)) : undefined}
      />
    </div>
  );
};

/**
 * (6) Styling Properties
 * Visual styling properties including borders (merged from Border Properties).
 * Redesigned with space-efficient layout.
 */
export const StylingPropertiesGroup: PropertyGroup = {
  id: 'styling',
  title: 'Styling',
  order: 6,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps) => {
    // Always show styling group - borders are available for all components
    return true;
  },
  customGroupRenderer: ({ rendererProps }) => {
    const { props, updateProp, onOpenExpressionEditor } = rendererProps;

    return (
      <div className="space-y-5">
        {/* Border Properties Section */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide pb-1 border-b border-gray-200">Border</div>
          <BorderPropertiesRenderer {...rendererProps} />
        </div>

        {/* Spacing Properties Section */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide pb-1 border-b border-gray-200">Spacing</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <PropFxInput
              label="Padding"
              value={props.padding || ''}
              onChange={(val) => updateProp('padding', val)}
              placeholder="e.g. 8px"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('padding', newVal)) : undefined}
            />
            <PropFxInput
              label="Margin"
              value={props.margin || ''}
              onChange={(val) => updateProp('margin', val)}
              placeholder="e.g. 8px"
              className="mb-0"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('margin', newVal)) : undefined}
            />
          </div>
        </div>

        {/* Effects Properties Section */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide pb-1 border-b border-gray-200">Effects</div>
          <div className="space-y-3 mt-3">
            <PropFxInput
              label="Opacity"
              value={props.opacity || ''}
              onChange={(val) => updateProp('opacity', val)}
              placeholder="e.g. 0.5 or {{theme.opacity}}"
              propertyKey="opacity"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('opacity', newVal)) : undefined}
            />
            <PropFxInput
              label="Shadow"
              value={props.boxShadow || ''}
              onChange={(val) => updateProp('boxShadow', val)}
              placeholder="e.g. 2px 2px 5px #ccc"
              onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('boxShadow', newVal)) : undefined}
            />
            {'backgroundGradient' in props && (
              <PropFxInput
                label="Background Gradient"
                value={props.backgroundGradient || ''}
                onChange={(val) => updateProp('backgroundGradient', val)}
                placeholder="e.g. linear-gradient(...)"
                onOpenEditor={onOpenExpressionEditor ? (val) => onOpenExpressionEditor(val, (newVal) => updateProp('backgroundGradient', newVal)) : undefined}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
  properties: [],
};

/**
 * All base property groups in the new organization
 */
export const basePropertyGroups: PropertyGroup[] = [
  BasicPropertiesGroup,
  ContainerLayoutGroup, // Moved to top (order 2)
  LayoutPositionGroup,
  ColorTypographyGroup,
  InputValueGroup, // Merged with FormValidationGroup
  StylingPropertiesGroup, // Merged with BorderPropertiesGroup
  DataPropertiesGroup,
  MediaPropertiesGroup,
];

