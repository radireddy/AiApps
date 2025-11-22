# Adding Common Properties to All Components

This guide explains how to add a common property that will be available to all components using the new properties architecture.

## Where to Add Common Properties

Common properties are defined in **`components/property-groups/base-groups.tsx`**. This file contains base property groups that are available to all components.

## Step-by-Step Guide

### Option 1: Add to an Existing Base Group

If your property fits into an existing category, add it to the appropriate base group:

#### Example: Adding a "zIndex" property to LayoutGroup

```typescript
// In components/property-groups/base-groups.tsx

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
    // NEW: Add your common property here
    {
      key: 'zIndex',
      label: 'Z-Index',
      type: 'number',
      defaultValue: 0,
    },
  ],
};
```

#### Example: Adding a "cursor" property to StylingGroup

```typescript
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
    // NEW: Add cursor property
    {
      key: 'cursor',
      label: 'Cursor',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'pointer', label: 'Pointer' },
        { value: 'not-allowed', label: 'Not Allowed' },
        { value: 'wait', label: 'Wait' },
      ],
    },
  ],
};
```

### Option 2: Create a New Base Group

If your property doesn't fit into existing groups, create a new base group:

#### Example: Adding an "Animation" group

```typescript
// In components/property-groups/base-groups.tsx

/**
 * Animation Property Group
 * Handles animation-related properties
 */
export const AnimationGroup: PropertyGroup = {
  id: 'animation',
  title: 'Animation',
  order: 12,
  properties: [
    {
      key: 'transition',
      label: 'Transition',
      type: 'expression',
      placeholder: 'e.g. all 0.3s ease',
    },
    {
      key: 'animation',
      label: 'Animation',
      type: 'expression',
      placeholder: 'e.g. fadeIn 0.5s',
    },
  ],
};

// Don't forget to add it to the basePropertyGroups array
export const basePropertyGroups: PropertyGroup[] = [
  LayoutGroup,
  StateGroup,
  StylingGroup,
  BorderGroup,
  TypographyGroup,
  BackgroundGroup,
  AnimationGroup, // NEW: Add your new group here
];
```

### Option 3: Add Conditional Common Property

If the property should only appear for certain components, use a condition:

#### Example: Adding "tooltip" property that only shows for interactive components

```typescript
export const InteractionGroup: PropertyGroup = {
  id: 'interaction',
  title: 'Interaction',
  order: 7,
  // Only show for components that have interactive properties
  condition: (props: ComponentProps) => {
    return 'onClick' in props || 'onHover' in props || 'tooltip' in props;
  },
  properties: [
    {
      key: 'tooltip',
      label: 'Tooltip',
      type: 'text',
      placeholder: 'Hover tooltip text',
      // Only show if component supports tooltips
      condition: (props: ComponentProps) => 'tooltip' in props,
    },
  ],
};
```

## Updating Type Definitions

After adding a property, you may need to update the TypeScript types:

### 1. Update BaseProps Interface

If it's a property that applies to ALL components, add it to `BaseProps`:

```typescript
// In types.ts

export interface BaseProps {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number | string;
  boxShadow?: string;
  disabled?: boolean | string;
  hidden?: boolean | string;
  // NEW: Add your common property
  zIndex?: number | string;
  cursor?: 'default' | 'pointer' | 'not-allowed' | 'wait';
}
```

### 2. Update Component-Specific Props (if needed)

If the property is only for specific component types, add it to those specific interfaces:

```typescript
// In types.ts

export interface ButtonProps extends BaseProps, BorderProps {
  // ... existing properties
  tooltip?: string; // NEW: Only for buttons
}
```

## Making Properties Available to Components

Once you've added a property to a base group, it will automatically be available to all components that include that base group in their `PropertyConfig`.

### Components Already Using Base Groups

Most components already include base groups. For example:

```typescript
// In Button.tsx, Label.tsx, etc.
const config: PropertyConfig = {
  baseGroups: ['layout', 'state', 'styling'], // Your new property will appear here
  // ...
};
```

### If a Component Doesn't Include the Base Group

If a component doesn't include the base group you modified, you can:

1. **Add it to their config:**
```typescript
const config: PropertyConfig = {
  baseGroups: ['layout', 'state', 'styling', 'animation'], // Add your new group
  // ...
};
```

2. **Or it will be automatically included if it's in the basePropertyGroups array** and the component uses `extendedGroups` or includes all base groups.

## Examples

### Example 1: Adding "padding" to LayoutGroup

```typescript
// In base-groups.tsx
export const LayoutGroup: PropertyGroup = {
  id: 'layout',
  title: 'Layout',
  order: 1,
  properties: [
    // ... existing properties
    {
      key: 'padding',
      label: 'Padding',
      type: 'expression',
      placeholder: 'e.g. 10px or {{theme.spacing.md}}',
    },
  ],
};
```

### Example 2: Adding "ariaLabel" to StateGroup

```typescript
export const StateGroup: PropertyGroup = {
  id: 'state',
  title: 'State',
  order: 2,
  properties: [
    // ... existing properties
    {
      key: 'ariaLabel',
      label: 'ARIA Label',
      type: 'text',
      placeholder: 'Accessibility label for screen readers',
    },
  ],
};
```

### Example 3: Creating a "Spacing" Group

```typescript
export const SpacingGroup: PropertyGroup = {
  id: 'spacing',
  title: 'Spacing',
  order: 8,
  properties: [
    {
      key: 'margin',
      label: 'Margin',
      type: 'expression',
      placeholder: 'e.g. 10px 20px',
    },
    {
      key: 'padding',
      label: 'Padding',
      type: 'expression',
      placeholder: 'e.g. 10px 20px',
    },
  ],
};

// Add to basePropertyGroups array
export const basePropertyGroups: PropertyGroup[] = [
  // ... existing groups
  SpacingGroup,
];
```

## Best Practices

1. **Choose the Right Group**: Add properties to the most appropriate existing group
2. **Use Conditions**: If a property only applies to certain components, use conditions
3. **Update Types**: Always update TypeScript interfaces when adding new properties
4. **Document**: Add comments explaining what the property does
5. **Default Values**: Provide sensible default values when appropriate
6. **Order Matters**: Use the `order` property to control display order

## Summary

- **Location**: `components/property-groups/base-groups.tsx`
- **Add to existing group**: Modify the appropriate `PropertyGroup` object
- **Create new group**: Add a new `PropertyGroup` and include it in `basePropertyGroups` array
- **Update types**: Modify `BaseProps` or component-specific interfaces in `types.ts`
- **Automatic availability**: Properties in base groups are automatically available to components that include those groups

The beauty of this architecture is that once you add a property to a base group, it's immediately available to all components that use that group - no need to modify individual component files!

