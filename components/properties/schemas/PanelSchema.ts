import { ComponentType } from '../../../types';
import { PropertyMetadata } from '../metadata';
import { createPropertySchema } from '../registry';

export const panelProperties: PropertyMetadata[] = [
  {
    id: 'backgroundColor',
    label: 'Background Color',
    type: 'color',
    defaultValue: '#ffffff',
    supportsExpression: true,
    group: 'Background',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 4,
    propertyOrder: 0,
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
  },
  {
    id: 'backgroundGradient',
    label: 'Background Gradient',
    type: 'expression',
    defaultValue: '',
    supportsExpression: true,
    group: 'Background',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 4,
    propertyOrder: 1,
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
    placeholder: 'e.g. linear-gradient(...)',
  },
  {
    id: 'direction',
    label: 'Direction',
    type: 'dropdown',
    defaultValue: 'horizontal',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 4,
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
    options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
    ],
  },
  {
    id: 'justifyContent',
    label: 'Justify Content',
    type: 'dropdown',
    defaultValue: 'start',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 5,
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
    options: [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
      { value: 'space-between', label: 'Space Between' },
    ],
  },
  {
    id: 'alignItems',
    label: 'Align Items',
    type: 'dropdown',
    defaultValue: 'center',
    group: 'Layout',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 6,
    applicableTo: [ComponentType.PANEL, ComponentType.FORM, ComponentType.H_STACK, ComponentType.V_STACK, ComponentType.MODAL],
    options: [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
      { value: 'stretch', label: 'Stretch' },
    ],
  },
];

export const panelSchema = createPropertySchema(ComponentType.PANEL, panelProperties);

