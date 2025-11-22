import { PropertyGroup, PropertyDefinition } from './types';
import { ComponentProps, BorderProps } from '../../types';

/**
 * Layout Property Group
 * Handles position and size properties (x, y, width, height)
 */
export const LayoutGroup: PropertyGroup = {
  id: 'layout',
  title: 'Layout',
  order: 1,
  properties: [
    {
      key: 'x',
      label: 'X',
      type: 'number',
    },
    {
      key: 'y',
      label: 'Y',
      type: 'number',
    },
    {
      key: 'width',
      label: 'Width',
      type: 'number',
    },
    {
      key: 'height',
      label: 'Height',
      type: 'number',
    },
  ],
};

/**
 * State Property Group
 * Handles component state properties (disabled, hidden)
 */
export const StateGroup: PropertyGroup = {
  id: 'state',
  title: 'State',
  order: 2,
  properties: [
    {
      key: 'disabled',
      label: 'Disabled',
      type: 'expression',
      placeholder: 'e.g. {{Table1.selectedRecord == null}}',
    },
    {
      key: 'hidden',
      label: 'Hidden',
      type: 'expression',
      placeholder: 'e.g. {{!showAlert}}',
    },
  ],
};

/**
 * Styling Property Group
 * Handles visual styling properties (opacity, boxShadow)
 */
export const StylingGroup: PropertyGroup = {
  id: 'styling',
  title: 'Styling',
  order: 10,
  properties: [
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'expression',
    },
    {
      key: 'boxShadow',
      label: 'Shadow',
      type: 'expression',
      placeholder: 'e.g. 2px 2px 5px #ccc',
    },
  ],
};

/**
 * Border Property Group
 * Handles border-related properties
 */
export const BorderGroup: PropertyGroup = {
  id: 'border',
  title: 'Border',
  order: 11,
  condition: (props: ComponentProps) => {
    const borderProps = props as BorderProps;
    return borderProps.borderStyle !== undefined;
  },
  properties: [
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'expression',
      inputProps: { type: 'number' },
    },
    {
      key: 'borderWidth',
      label: 'Border Width',
      type: 'expression',
      inputProps: { type: 'number' },
    },
    {
      key: 'borderStyle',
      label: 'Style',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ],
    },
    {
      key: 'borderColor',
      label: 'Border Color',
      type: 'expression',
      inputProps: { type: 'color' },
    },
  ],
};

/**
 * Typography Property Group
 * Handles text-related styling properties
 */
export const TypographyGroup: PropertyGroup = {
  id: 'typography',
  title: 'Typography',
  order: 5,
  condition: (props: ComponentProps) => {
    // Only show for components that have typography properties
    return 'fontSize' in props || 'fontWeight' in props || 'color' in props || 'textAlign' in props;
  },
  properties: [
    {
      key: 'fontSize',
      label: 'Font Size',
      type: 'expression',
      inputProps: { type: 'number' },
      condition: (props: ComponentProps) => 'fontSize' in props,
    },
    {
      key: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
      ],
      condition: (props: ComponentProps) => 'fontWeight' in props,
    },
    {
      key: 'color',
      label: 'Text Color',
      type: 'expression',
      inputProps: { type: 'color' },
      condition: (props: ComponentProps) => 'color' in props,
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
      condition: (props: ComponentProps) => 'textAlign' in props,
    },
    {
      key: 'fontFamily',
      label: 'Font Family',
      type: 'expression',
      placeholder: 'Inter, sans-serif',
      condition: (props: ComponentProps) => 'fontFamily' in props,
    },
  ],
};

/**
 * Background Property Group
 * Handles background-related properties
 */
export const BackgroundGroup: PropertyGroup = {
  id: 'background',
  title: 'Background',
  order: 6,
  condition: (props: ComponentProps) => {
    return 'backgroundColor' in props || 'backgroundGradient' in props;
  },
  properties: [
    {
      key: 'backgroundColor',
      label: 'Background Color',
      type: 'expression',
      inputProps: { type: 'color' },
      condition: (props: ComponentProps) => 'backgroundColor' in props,
    },
    {
      key: 'backgroundGradient',
      label: 'Background Gradient',
      type: 'expression',
      placeholder: 'e.g. linear-gradient(...)',
      condition: (props: ComponentProps) => 'backgroundGradient' in props,
    },
  ],
};

/**
 * All base property groups
 */
export const basePropertyGroups: PropertyGroup[] = [
  LayoutGroup,
  StateGroup,
  StylingGroup,
  BorderGroup,
  TypographyGroup,
  BackgroundGroup,
];

