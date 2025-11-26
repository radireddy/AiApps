import { PropertyGroup, PropertyDefinition } from './types';
import { ComponentProps, BorderProps } from '../../types';
import { ComponentType } from '../../types';
import { shouldShowProperty, ComponentTypeGroups } from './component-helpers';

/**
 * (1) Basic Properties
 * Common to almost every component.
 */
export const BasicPropertiesGroup: PropertyGroup = {
  id: 'basic',
  title: 'Basic Properties',
  order: 1,
  collapsible: true,
  defaultCollapsed: false,
  properties: [
    {
      key: 'hidden',
      label: 'Visible',
      type: 'expression',
      placeholder: 'e.g. {{!showAlert}} (false = visible, true = hidden)',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all components - visibility is always available
        return true;
      },
    },
    {
      key: 'disabled',
      label: 'Enabled / Disabled',
      type: 'expression',
      placeholder: 'e.g. {{table1.selectedRecord == null}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        // Show for all components - disabled is always available
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
  ],
};

/**
 * (2) Layout & Position
 * Controls arrangement and spacing.
 */
export const LayoutPositionGroup: PropertyGroup = {
  id: 'layout-position',
  title: 'Layout & Position',
  order: 2,
  collapsible: true,
  defaultCollapsed: false,
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
 * (3) Color & Typography
 * Styling inbound to theming systems.
 */
export const ColorTypographyGroup: PropertyGroup = {
  id: 'color-typography',
  title: 'Color & Typography',
  order: 3,
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

/**
 * (4) Border Properties
 * Reusable across many components.
 */
export const BorderPropertiesGroup: PropertyGroup = {
  id: 'border',
  title: 'Border Properties',
  order: 4,
  collapsible: true,
  defaultCollapsed: true,
  condition: (props: ComponentProps) => {
    const borderProps = props as BorderProps;
    return borderProps.borderStyle !== undefined;
  },
  properties: [
    {
      key: 'borderColor',
      label: 'Border Color',
      type: 'expression',
      inputProps: { type: 'color' },
    },
    {
      key: 'borderWidth',
      label: 'Border Width',
      type: 'expression',
      inputProps: { type: 'number' },
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      type: 'expression',
      inputProps: { type: 'number' },
    },
    {
      key: 'borderStyle',
      label: 'Border Style',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
      ],
    },
  ],
};

/**
 * (5) Text Content Properties
 * Only for components that display text.
 */
export const TextContentGroup: PropertyGroup = {
  id: 'text-content',
  title: 'Text Content Properties',
  order: 5,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.TEXT_CONTENT_COMPONENTS, context) || 
           shouldShowProperty(ComponentTypeGroups.PLACEHOLDER_COMPONENTS, context);
  },
  properties: [
    {
      key: 'text',
      label: 'Text',
      type: 'expression',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.TEXT_CONTENT_COMPONENTS, context) || 'text' in props;
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
  ],
};

/**
 * (6) Input & Value Properties
 * For fields accepting user input.
 */
export const InputValueGroup: PropertyGroup = {
  id: 'input-value',
  title: 'Input & Value Properties',
  order: 6,
  collapsible: true,
  defaultCollapsed: false,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.INPUT_COMPONENTS, context);
  },
  properties: [
    {
      key: 'dataStoreKey',
      label: 'Value (Data Store Key)',
      type: 'text',
      placeholder: 'e.g. user.name',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.DATA_BINDING_COMPONENTS, context) || 'dataStoreKey' in props;
      },
    },
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

/**
 * (7) Form & Validation Properties
 * Only for form elements.
 */
export const FormValidationGroup: PropertyGroup = {
  id: 'form-validation',
  title: 'Form & Validation Properties',
  order: 7,
  collapsible: true,
  defaultCollapsed: true,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.FORM_COMPONENTS, context);
  },
  properties: [
    // required - needs to be added if not present
    {
      key: 'required',
      label: 'Required',
      type: 'expression',
      placeholder: 'e.g. {{true}}',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.FORM_COMPONENTS, context);
      },
    },
    // errorMessage - needs to be added if not present
    {
      key: 'errorMessage',
      label: 'Error Message',
      type: 'text',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty(ComponentTypeGroups.FORM_COMPONENTS, context);
      },
    },
  ],
};

/**
 * (8) Event Properties
 * Action triggers.
 */
export const EventPropertiesGroup: PropertyGroup = {
  id: 'events',
  title: 'Event Properties',
  order: 8,
  collapsible: true,
  defaultCollapsed: true,
  properties: [
    // onClick - Button actions are handled via actionType, but we can show action-related props
    {
      key: 'actionType',
      label: 'On Click Action',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'alert', label: 'Show Alert' },
        { value: 'updateData', label: 'Update Data Store' },
        { value: 'updateVariable', label: 'Update Variable' },
        { value: 'executeCode', label: 'Execute Code' },
        { value: 'createRecord', label: 'Create Record' },
        { value: 'updateRecord', label: 'Update Record' },
        { value: 'deleteRecord', label: 'Delete Record' },
        { value: 'navigate', label: 'Navigate' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.BUTTON], context) || 'actionType' in props;
      },
    },
    // onChange - handled via dataStoreKey for inputs
    // onSelect - handled via rowSelectAction for Table
    {
      key: 'rowSelectAction',
      label: 'On Select Action',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'updateDataStore', label: 'Update Data Store' },
      ],
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return shouldShowProperty([ComponentType.TABLE], context) || 'rowSelectAction' in props;
      },
    },
  ],
};

/**
 * (9) Data Properties
 * Data binding and dynamic content.
 */
export const DataPropertiesGroup: PropertyGroup = {
  id: 'data',
  title: 'Data Properties',
  order: 9,
  collapsible: true,
  defaultCollapsed: true,
  condition: (props: ComponentProps, context?: Record<string, any>) => {
    return shouldShowProperty(ComponentTypeGroups.DATA_SOURCE_COMPONENTS, context);
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
  title: 'Media Properties',
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
 * (11) Container / Layout-Specific
 * Only for layout components.
 */
export const ContainerLayoutGroup: PropertyGroup = {
  id: 'container-layout',
  title: 'Container / Layout-Specific',
  order: 11,
  collapsible: true,
  defaultCollapsed: true,
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
 * (12) Styling Properties (Opacity, Shadow)
 * Visual styling properties that don't fit in other categories.
 */
export const StylingPropertiesGroup: PropertyGroup = {
  id: 'styling',
  title: 'Styling',
  order: 12,
  collapsible: true,
  defaultCollapsed: true,
  properties: [
    {
      key: 'opacity',
      label: 'Opacity',
      type: 'expression',
      placeholder: 'e.g. 0.5 or {{theme.opacity}}',
    },
    {
      key: 'boxShadow',
      label: 'Shadow',
      type: 'expression',
      placeholder: 'e.g. 2px 2px 5px #ccc',
    },
    {
      key: 'backgroundGradient',
      label: 'Background Gradient',
      type: 'expression',
      placeholder: 'e.g. linear-gradient(...)',
      condition: (props: ComponentProps, context?: Record<string, any>) => {
        return 'backgroundGradient' in props;
      },
    },
  ],
};

/**
 * All base property groups in the new organization
 */
export const basePropertyGroups: PropertyGroup[] = [
  BasicPropertiesGroup,
  LayoutPositionGroup,
  ColorTypographyGroup,
  BorderPropertiesGroup,
  TextContentGroup,
  InputValueGroup,
  FormValidationGroup,
  EventPropertiesGroup,
  DataPropertiesGroup,
  MediaPropertiesGroup,
  ContainerLayoutGroup,
  StylingPropertiesGroup,
];

