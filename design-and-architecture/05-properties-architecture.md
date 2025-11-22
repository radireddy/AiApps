# Properties Panel Architecture

## Overview

The Properties Panel architecture is designed to provide a flexible, extensible, and maintainable system for managing component properties. It follows industry best practices and design patterns to ensure reusability, ease of understanding, performance, and simplicity.

## Design Principles

1. **Composition over Inheritance**: Property groups are composed rather than inherited
2. **Single Responsibility**: Each property group handles a specific concern (layout, styling, state, etc.)
3. **Open/Closed Principle**: Open for extension, closed for modification
4. **DRY (Don't Repeat Yourself)**: Common properties are defined once and reused
5. **Separation of Concerns**: Property definitions are separate from rendering logic

## Architecture Patterns

### 1. Property Group Pattern (Strategy Pattern)

Property groups are self-contained units that define:
- Which properties they handle
- How to render those properties
- When they should be shown (conditions)

```typescript
interface PropertyGroup {
  id: string;
  title: string;
  properties: PropertyDefinition[];
  condition?: (props: ComponentProps) => boolean;
  order?: number;
}
```

### 2. Base Properties System (Template Method Pattern)

A base property renderer that:
- Composes property groups in a consistent order
- Handles common concerns (expression editing, validation)
- Provides hooks for customization

### 3. Property Registry (Registry Pattern)

A centralized registry that:
- Maps component types to their property configurations
- Allows dynamic property group registration
- Supports property group inheritance and composition

### 4. Factory Pattern for Property Configurations

Factory functions that create property configurations:
- `createBaseProperties()` - Creates base property groups
- `createComponentProperties()` - Creates component-specific properties
- `extendProperties()` - Extends existing property configurations

## Property Group Hierarchy

```
BasePropertyGroups (All Components)
├── LayoutGroup (x, y, width, height)
├── StateGroup (disabled, hidden)
└── StylingGroup (opacity, boxShadow, borders)

ExtendedPropertyGroups (Many Components)
├── BorderGroup (borderRadius, borderWidth, borderColor, borderStyle)
├── TypographyGroup (fontSize, fontWeight, fontFamily, textAlign, color)
└── BackgroundGroup (backgroundColor, backgroundGradient)

ComponentSpecificGroups (Specific Components)
├── ButtonActionGroup (actionType, actionAlertMessage, etc.)
├── InputDataGroup (dataStoreKey, placeholder, accessibilityLabel)
└── LabelContentGroup (text, textRenderer)
```

## Implementation Structure

### Core Files

1. **`property-groups/base.tsx`** - Base property groups (Layout, State, Styling)
2. **`property-groups/extended.tsx`** - Extended property groups (Border, Typography, Background)
3. **`property-groups/registry.ts`** - Property group registry
4. **`property-groups/factory.ts`** - Factory functions for creating property configurations
5. **`BasePropertiesRenderer.tsx`** - Base renderer that composes property groups

### Property Group Definition

```typescript
interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'expression';
  options?: { value: any; label: string }[];
  placeholder?: string;
  condition?: (props: ComponentProps) => boolean;
  renderer?: React.FC<PropertyRendererProps>;
}
```

## Benefits

1. **Reusability**: Property groups can be reused across components
2. **Maintainability**: Changes to common properties are made in one place
3. **Extensibility**: New property groups can be added without modifying existing code
4. **Consistency**: All components use the same property rendering logic
5. **Performance**: Property groups are memoized and only re-render when needed
6. **Type Safety**: Full TypeScript support with proper typing
7. **Testability**: Property groups can be tested in isolation

## Migration Strategy

1. Create new property system alongside existing one
2. Migrate components one by one
3. Update documentation
4. Remove old system once all components are migrated

## Usage Examples

### Basic Usage

```typescript
import { BasePropertiesRenderer, createPropertyConfig } from '../property-groups';

// Simple component with base properties
const SimpleComponentProperties: React.FC<Props> = ({ component, updateProp, onOpenExpressionEditor }) => {
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

### Advanced Usage with Custom Groups

```typescript
import { BasePropertiesRenderer, createPropertyConfig, PropertyGroup } from '../property-groups';
import { ButtonProps, ButtonActionType } from '../../types';

// Component with custom property groups
const ButtonProperties: React.FC<Props> = ({ 
  component, 
  updateProp, 
  dataSources, 
  variables, 
  onOpenExpressionEditor 
}) => {
  // Custom content group
  const contentGroup: PropertyGroup = {
    id: 'button-content',
    title: 'Content',
    order: 3,
    collapsible: true,
    properties: [
      { key: 'text', label: 'Text', type: 'expression' },
      { key: 'backgroundColor', label: 'Background', type: 'expression', inputProps: { type: 'color' } },
      { key: 'textColor', label: 'Text Color', type: 'expression', inputProps: { type: 'color' } },
    ],
  };

  // Action group with conditional properties
  const actionGroup: PropertyGroup = {
    id: 'button-action',
    title: 'On Click Action',
    order: 4,
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
          // ... more options
        ],
      },
      // Conditional property - only shows when actionType is 'alert'
      {
        key: 'actionAlertMessage',
        label: 'Alert Message',
        type: 'expression',
        condition: (props) => (props as ButtonProps).actionType === 'alert',
      },
      // Dynamic options from context
      {
        key: 'dataSourceName',
        label: 'Data Source',
        type: 'select',
        options: () => dataSources.map(ds => ({ value: ds.id, label: ds.id })),
        condition: (props) => {
          const actionType = (props as ButtonProps).actionType;
          return actionType === 'createRecord' || actionType === 'updateRecord';
        },
      },
    ],
  };

  const config = createPropertyConfig({
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border'],
    customGroups: [contentGroup, actionGroup],
    groupOrder: ['layout', 'state', 'button-content', 'button-action', 'border', 'styling'],
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

### Using in Component Plugin

```typescript
export const ButtonPlugin: ComponentPlugin = {
  type: ComponentType.BUTTON,
  paletteConfig: {
    label: 'Button',
    icon: ButtonIcon,
    defaultProps: { /* ... */ },
  },
  renderer: ButtonRenderer,
  properties: (props) => (
    <ButtonProperties
      component={props.component}
      updateProp={props.updateProp}
      dataSources={props.dataSources}
      variables={props.variables}
      onOpenExpressionEditor={props.onOpenExpressionEditor}
    />
  ),
};
```

## Property Group Types

### Base Groups (Available to All Components)

- **layout**: Position and size (x, y, width, height)
- **state**: Component state (disabled, hidden)
- **styling**: Visual styling (opacity, boxShadow)

### Extended Groups (Conditionally Available)

- **border**: Border properties (borderRadius, borderWidth, borderColor, borderStyle)
- **typography**: Text styling (fontSize, fontWeight, fontFamily, textAlign, color)
- **background**: Background properties (backgroundColor, backgroundGradient)

### Custom Groups

Component-specific property groups defined in the component's property configuration.

## Property Types

- **text**: Simple text input
- **number**: Numeric input
- **color**: Color picker
- **select**: Dropdown select (supports static or dynamic options)
- **expression**: Expression input with editor button
- **custom**: Custom renderer component

## Conditional Properties

Properties can be conditionally shown based on:
- Component props values
- Context values (dataSources, variables, etc.)

```typescript
{
  key: 'actionAlertMessage',
  label: 'Alert Message',
  type: 'expression',
  condition: (props) => (props as ButtonProps).actionType === 'alert',
}
```

## Dynamic Options

Select properties can have dynamic options based on context:

```typescript
{
  key: 'dataSourceName',
  label: 'Data Source',
  type: 'select',
  options: () => dataSources.map(ds => ({ value: ds.id, label: ds.id })),
}
```

## Migration Guide

### Before (Old System)

```typescript
const ButtonProperties: React.FC<Props> = ({ component, updateProp, onOpenExpressionEditor }) => {
  return (
    <>
      <LayoutProps props={component.props} updateProp={updateProp} />
      <StateProps props={component.props} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
      <CollapsibleSection title="Content">
        <PropFxInput label="Text" value={component.props.text} onChange={val => updateProp('text', val)} />
      </CollapsibleSection>
      <StylingProps props={component.props} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};
```

### After (New System)

```typescript
const ButtonProperties: React.FC<Props> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const config = createPropertyConfig({
    baseGroups: ['layout', 'state', 'styling'],
    customGroups: [{
      id: 'content',
      title: 'Content',
      collapsible: true,
      properties: [
        { key: 'text', label: 'Text', type: 'expression' },
      ],
    }],
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

## Benefits Summary

1. **Reusability**: Property groups are defined once and reused across components
2. **Maintainability**: Changes to common properties are made in one place
3. **Consistency**: All components use the same property rendering logic
4. **Type Safety**: Full TypeScript support with proper typing
5. **Extensibility**: Easy to add new property groups or extend existing ones
6. **Performance**: Property groups are memoized and only re-render when needed
7. **Declarative**: Properties are defined declaratively, making them easier to understand
8. **Testable**: Property groups can be tested in isolation

