# Properties Panel Architecture - Summary

## Overview

A comprehensive, extensible architecture for managing component properties in the Properties Panel. This system follows industry best practices and design patterns to ensure reusability, maintainability, and ease of use.

## Key Design Patterns

### 1. **Composition Pattern**
- Property groups are composed rather than inherited
- Components select which property groups they need
- No deep inheritance hierarchies

### 2. **Registry Pattern**
- Centralized `PropertyGroupRegistry` manages all property groups
- Easy to register, retrieve, and manage property groups
- Similar to the component registry pattern

### 3. **Factory Pattern**
- `createPropertyConfig()` creates property configurations
- `createBasePropertyConfig()` for common configurations
- `extendPropertyConfig()` for extending configurations

### 4. **Template Method Pattern**
- `BasePropertiesRenderer` defines the structure
- Delegates specific rendering to specialized components
- Consistent rendering across all components

### 5. **Strategy Pattern**
- `PropertyRenderer` selects the appropriate input component based on property type
- Different strategies for text, number, color, select, expression, etc.

## Architecture Components

### Core Files

```
components/property-groups/
├── types.ts                    # Type definitions
├── base-groups.tsx            # Base property groups (layout, state, styling, etc.)
├── registry.ts                # Property group registry
├── factory.ts                 # Factory functions
├── BasePropertiesRenderer.tsx # Main renderer component
├── PropertyGroupRenderer.tsx  # Renders a single property group
├── PropertyRenderer.tsx      # Renders a single property
└── index.ts                   # Public API exports
```

### Property Group Hierarchy

```
BasePropertyGroups (All Components)
├── LayoutGroup (x, y, width, height)
├── StateGroup (disabled, hidden)
└── StylingGroup (opacity, boxShadow)

ExtendedPropertyGroups (Many Components)
├── BorderGroup (borderRadius, borderWidth, borderColor, borderStyle)
├── TypographyGroup (fontSize, fontWeight, fontFamily, textAlign, color)
└── BackgroundGroup (backgroundColor, backgroundGradient)

ComponentSpecificGroups (Component-Specific)
└── Custom groups defined per component
```

## Usage

### Basic Example

```typescript
import { BasePropertiesRenderer, createPropertyConfig } from '../property-groups';

const MyComponentProperties: React.FC<Props> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const config = createPropertyConfig({
    baseGroups: ['layout', 'state', 'styling'],
    extendedGroups: ['border'],
  });

  return (
    <BasePropertiesRenderer
      component={component}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};
```

### Advanced Example with Custom Groups

```typescript
const ButtonProperties: React.FC<Props> = ({ component, updateProp, dataSources, variables, onOpenExpressionEditor }) => {
  const contentGroup: PropertyGroup = {
    id: 'button-content',
    title: 'Content',
    collapsible: true,
    properties: [
      { key: 'text', label: 'Text', type: 'expression' },
      { key: 'backgroundColor', label: 'Background', type: 'expression', inputProps: { type: 'color' } },
    ],
  };

  const actionGroup: PropertyGroup = {
    id: 'button-action',
    title: 'On Click Action',
    collapsible: true,
    defaultCollapsed: true,
    properties: [
      {
        key: 'actionType',
        label: 'Action Type',
        type: 'select',
        options: [
          { value: 'alert', label: 'Show Alert' },
          { value: 'updateData', label: 'Update Data Store' },
        ],
      },
      // Conditional property
      {
        key: 'actionAlertMessage',
        label: 'Alert Message',
        type: 'expression',
        condition: (props) => (props as ButtonProps).actionType === 'alert',
      },
      // Dynamic options
      {
        key: 'dataSourceName',
        label: 'Data Source',
        type: 'select',
        options: () => dataSources.map(ds => ({ value: ds.id, label: ds.id })),
      },
    ],
  };

  const config = createPropertyConfig({
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border'],
    customGroups: [contentGroup, actionGroup],
  });

  return (
    <BasePropertiesRenderer
      component={component}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
      context={{ dataSources, variables }}
    />
  );
};
```

## Features

### ✅ Reusability
- Property groups are defined once and reused
- Base groups available to all components
- Extended groups conditionally available

### ✅ Maintainability
- Changes to common properties in one place
- Clear separation of concerns
- Easy to understand structure

### ✅ Extensibility
- Easy to add new property groups
- Can extend existing configurations
- Supports custom property renderers

### ✅ Type Safety
- Full TypeScript support
- Type-safe property definitions
- Compile-time error checking

### ✅ Performance
- Memoized property groups
- Only re-renders when needed
- Efficient filtering and rendering

### ✅ Flexibility
- Conditional properties
- Dynamic options
- Custom renderers
- Configurable group order

## Benefits Over Previous System

### Before
- Manual JSX composition in each component
- Duplicated property rendering logic
- Hard to maintain consistency
- Difficult to add new common properties

### After
- Declarative property definitions
- Centralized property groups
- Consistent rendering across components
- Easy to extend and maintain

## Migration Path

1. **Phase 1**: New system created alongside old system ✅
2. **Phase 2**: Migrate components one by one (in progress)
3. **Phase 3**: Update documentation
4. **Phase 4**: Remove old system once all components migrated

## Design Principles Applied

1. **Single Responsibility**: Each property group handles one concern
2. **Open/Closed**: Open for extension, closed for modification
3. **DRY**: Common properties defined once
4. **Separation of Concerns**: Property definitions separate from rendering
5. **Composition over Inheritance**: Groups are composed, not inherited

## Next Steps

1. Migrate existing components to use the new system
2. Add more base property groups as needed
3. Create helper functions for common property patterns
4. Add unit tests for property groups
5. Update component documentation

## Documentation

- Full architecture details: `design-and-architecture/05-properties-architecture.md`
- Example implementations: `components/property-groups/examples/`

