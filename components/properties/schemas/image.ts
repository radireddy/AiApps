import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonProperties, commonTabs, commonGroups, createPropertySchema } from '../registry';

/**
 * Image-specific property definitions
 */
const imageProperties: PropertyMetadata[] = [
  // Basic properties
  {
    id: 'src',
    label: 'Image URL',
    type: 'expression',
    defaultValue: 'https://picsum.photos/200/200',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 0,
    applicableTo: [ComponentType.IMAGE],
    tooltip: 'Image source URL or expression',
    placeholder: 'e.g. https://example.com/image.png or {{imageUrl}}',
  },
  {
    id: 'alt',
    label: 'Alt Text',
    type: 'expression',
    defaultValue: 'Placeholder Image',
    supportsExpression: true,
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 1,
    applicableTo: [ComponentType.IMAGE],
    tooltip: 'Alternative text for accessibility',
    placeholder: 'e.g. Product image',
  },
  {
    id: 'objectFit',
    label: 'Object Fit',
    type: 'dropdown',
    defaultValue: 'cover',
    group: 'Basic',
    tab: 'General',
    tabOrder: 0,
    groupOrder: 0,
    propertyOrder: 2,
    applicableTo: [ComponentType.IMAGE],
    options: [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
      { value: 'fill', label: 'Fill' },
      { value: 'none', label: 'None' },
      { value: 'scale-down', label: 'Scale Down' },
    ],
    tooltip: 'How the image should fit within its container',
  },
];

/**
 * Image-specific groups
 * Order values use DEFAULT_GROUP_ORDER from registry for consistency
 */
const imageGroups: PropertyGroup[] = [];

/**
 * Image property schema
 */
export const imageSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.IMAGE,
  imageProperties,
  commonTabs,
  [...commonGroups, ...imageGroups]
);



