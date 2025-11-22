import { ComponentType, ComponentProps } from '../../types';

/**
 * Helper functions to check component types and determine which properties are applicable
 */

export interface ComponentTypeInfo {
  componentType?: ComponentType;
  componentTypes?: ComponentType[]; // For multiple selection
}

/**
 * Check if a component type matches any of the provided types
 */
export const isComponentType = (
  componentType: ComponentType | undefined,
  types: ComponentType[]
): boolean => {
  if (!componentType) return false;
  return types.includes(componentType);
};

/**
 * Check if any of the selected component types match the provided types
 */
export const hasAnyComponentType = (
  componentTypes: ComponentType[] | undefined,
  types: ComponentType[]
): boolean => {
  if (!componentTypes || componentTypes.length === 0) return false;
  return componentTypes.some(type => types.includes(type));
};

/**
 * Component type groups for property visibility
 */
export const ComponentTypeGroups = {
  // All components
  ALL: [
    ComponentType.LABEL,
    ComponentType.INPUT,
    ComponentType.BUTTON,
    ComponentType.IMAGE,
    ComponentType.PANEL,
    ComponentType.FORM,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.DIVIDER,
    ComponentType.H_STACK,
    ComponentType.V_STACK,
    ComponentType.RADIO_GROUP,
    ComponentType.SWITCH,
    ComponentType.TABLE,
    ComponentType.MODAL,
  ],

  // Text-based components
  TEXT_BASED: [
    ComponentType.LABEL,
    ComponentType.BUTTON,
    ComponentType.INPUT,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.RADIO_GROUP,
    ComponentType.SWITCH,
    ComponentType.TABLE,
  ],

  // Input components
  INPUT_COMPONENTS: [
    ComponentType.INPUT,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.RADIO_GROUP,
    ComponentType.SWITCH,
  ],

  // Form components
  FORM_COMPONENTS: [
    ComponentType.INPUT,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.RADIO_GROUP,
    ComponentType.SWITCH,
  ],

  // Container/Layout components
  CONTAINER_COMPONENTS: [
    ComponentType.PANEL,
    ComponentType.FORM,
    ComponentType.H_STACK,
    ComponentType.V_STACK,
    ComponentType.MODAL,
  ],

  // Components with tooltip support
  TOOLTIP_COMPONENTS: [
    ComponentType.BUTTON,
    ComponentType.INPUT,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.IMAGE,
    ComponentType.TABLE,
  ],

  // Components with text content
  TEXT_CONTENT_COMPONENTS: [
    ComponentType.LABEL,
    ComponentType.BUTTON,
    ComponentType.CHECKBOX,
  ],

  // Components with placeholder
  PLACEHOLDER_COMPONENTS: [
    ComponentType.INPUT,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
  ],

  // Components with data binding
  DATA_BINDING_COMPONENTS: [
    ComponentType.INPUT,
    ComponentType.TEXTAREA,
    ComponentType.SELECT,
    ComponentType.CHECKBOX,
    ComponentType.RADIO_GROUP,
    ComponentType.SWITCH,
  ],

  // Components with data source
  DATA_SOURCE_COMPONENTS: [
    ComponentType.TABLE,
    ComponentType.SELECT,
  ],

  // Media components
  MEDIA_COMPONENTS: [
    ComponentType.IMAGE,
  ],

  // Components with alignment
  ALIGNMENT_COMPONENTS: [
    ComponentType.LABEL,
    ComponentType.BUTTON,
    ComponentType.IMAGE,
    ComponentType.PANEL,
    ComponentType.FORM,
    ComponentType.H_STACK,
    ComponentType.V_STACK,
  ],
};

/**
 * Get component type from context
 */
export const getComponentType = (context?: Record<string, any>): ComponentType | undefined => {
  return context?.componentType as ComponentType | undefined;
};

/**
 * Get component types from context (for multiple selection)
 */
export const getComponentTypes = (context?: Record<string, any>): ComponentType[] | undefined => {
  return context?.componentTypes as ComponentType[] | undefined;
};

/**
 * Check if property should be shown based on component type(s)
 */
export const shouldShowProperty = (
  supportedTypes: ComponentType[],
  context?: Record<string, any>
): boolean => {
  const componentType = getComponentType(context);
  const componentTypes = getComponentTypes(context);

  // If single component selected
  if (componentType) {
    return supportedTypes.includes(componentType);
  }

  // If multiple components selected, show if any match
  if (componentTypes && componentTypes.length > 0) {
    return componentTypes.some(type => supportedTypes.includes(type));
  }

  // Default: show for all if no type info
  return true;
};

