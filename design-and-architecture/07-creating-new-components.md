# Creating a New Component

This guide walks you through creating a new component using the new properties architecture.

## Step-by-Step Process

### Step 1: Define Component Type

Add your component type to the `ComponentType` enum in `types.ts`:

```typescript
// In types.ts

export enum ComponentType {
  LABEL = 'LABEL',
  INPUT = 'INPUT',
  BUTTON = 'BUTTON',
  // ... existing types
  YOUR_COMPONENT = 'YOUR_COMPONENT', // NEW: Add your component type
}
```

### Step 2: Define Component Props Interface

Create a props interface that extends `BaseProps` (and optionally `BorderProps`):

```typescript
// In types.ts

export interface YourComponentProps extends BaseProps, BorderProps {
  // Component-specific properties
  label: string;
  value?: string;
  placeholder?: string;
  // ... other properties
}
```

Add it to the `ComponentProps` union type:

```typescript
export type ComponentProps = 
  LabelProps | 
  InputProps | 
  // ... existing types
  YourComponentProps; // NEW: Add your component
```

### Step 3: Create Component File

Create a new file: `components/component-registry/YourComponent.tsx`

### Step 4: Create the Renderer

The renderer is what displays the component on the canvas:

```typescript
import React from 'react';
import { ComponentType, YourComponentProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const YourComponentRenderer: React.FC<{
  component: { props: YourComponentProps };
  mode: 'edit' | 'preview';
  evaluationScope: Record<string, any>;
  // Add other props as needed (dataStore, onUpdateDataStore, actions, etc.)
}> = ({ component, mode, evaluationScope }) => {
  const p = component.props;
  
  // Evaluate dynamic properties
  const label = useJavaScriptRenderer(p.label, evaluationScope, '');
  const value = useJavaScriptRenderer(p.value, evaluationScope, '');
  
  // Build styles
  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    boxShadow: useJavaScriptRenderer(p.boxShadow, evaluationScope, ''),
    // ... other styles
  };

  return (
    <div style={style} className="w-full h-full">
      {/* Your component JSX */}
      <label>{label}</label>
      <input value={value} placeholder={p.placeholder} />
    </div>
  );
};
```

### Step 5: Create Properties Using New Architecture

Use the new `BasePropertiesRenderer` with `PropertyConfig`:

```typescript
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const YourComponentProperties: React.FC<{
  component: { props: YourComponentProps, id: string };
  updateProp: (key: keyof YourComponentProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
  // Add context props if needed (dataSources, variables, etc.)
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  
  // Define custom property groups
  const settingsGroup: PropertyGroup = {
    id: 'yourcomponent-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'label',
        label: 'Label',
        type: 'text',
      },
      {
        key: 'value',
        label: 'Value',
        type: 'expression',
      },
      {
        key: 'placeholder',
        label: 'Placeholder',
        type: 'text',
      },
    ],
  };

  // Create property configuration
  const config: PropertyConfig = {
    baseGroups: ['layout', 'state'],        // Common properties
    extendedGroups: ['border', 'styling'],  // Conditional common properties
    customGroups: [settingsGroup],          // Component-specific properties
    groupOrder: ['layout', 'state', 'yourcomponent-settings', 'border', 'styling'],
  };

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

### Step 6: Create the Plugin

Define the component plugin with all required parts:

```typescript
export const YourComponentPlugin: ComponentPlugin = {
  type: ComponentType.YOUR_COMPONENT,
  paletteConfig: {
    label: 'Your Component',
    icon: React.createElement('svg', { 
      style: iconStyle, 
      viewBox: "0 0 24 24", 
      fill: "none", 
      xmlns: "http://www.w3.org/2000/svg" 
    }, 
      // Your SVG icon elements
      React.createElement('path', { d: "M12 2L2 7v10l10 5 10-5V7l-10-5z" })
    ),
    defaultProps: {
      ...commonStylingProps,  // Include common styling defaults
      label: 'New Component',
      value: '',
      placeholder: 'Enter value...',
      width: 200,
      height: 40,
      // ... other default props
    },
  },
  renderer: YourComponentRenderer,
  properties: YourComponentProperties,
  // Optional: Set isContainer if other components can be dropped inside
  // isContainer: false,
};
```

### Step 7: Register the Component

Add your component to the registry in `components/component-registry/registry.ts`:

```typescript
import { YourComponentPlugin } from './YourComponent';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
  // ... existing components
  [ComponentType.YOUR_COMPONENT]: YourComponentPlugin,
};
```

## Complete Example: Creating a "Slider" Component

Here's a complete example:

### 1. Types (`types.ts`)

```typescript
export enum ComponentType {
  // ... existing
  SLIDER = 'SLIDER',
}

export interface SliderProps extends BaseProps, BorderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value?: number | string;
  dataStoreKey: string;
}

export type ComponentProps = 
  // ... existing
  SliderProps;
```

### 2. Component File (`components/component-registry/Slider.tsx`)

```typescript
import React from 'react';
import { ComponentType, SliderProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { get } from '../../utils/data-helpers';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SliderRenderer: React.FC<{
  component: { props: SliderProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope }) => {
  const p = component.props;
  const label = useJavaScriptRenderer(p.label, evaluationScope, '');
  const min = useJavaScriptRenderer(p.min, evaluationScope, 0);
  const max = useJavaScriptRenderer(p.max, evaluationScope, 100);
  const step = useJavaScriptRenderer(p.step, evaluationScope, 1);
  const currentValue = get(dataStore, p.dataStoreKey, min);

  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useJavaScriptRenderer(p.opacity, evaluationScope, 1),
    padding: '1rem',
  };

  return (
    <div style={style} className="w-full h-full flex flex-col">
      <label className="mb-2 text-sm font-medium">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onUpdateDataStore?.(p.dataStoreKey, parseFloat(e.target.value))}
        className="w-full"
        disabled={mode === 'edit'}
      />
      <span className="mt-1 text-xs text-gray-500">{currentValue}</span>
    </div>
  );
};

const SliderProperties: React.FC<{
  component: { props: SliderProps, id: string };
  updateProp: (key: keyof SliderProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const settingsGroup: PropertyGroup = {
    id: 'slider-settings',
    title: 'Settings',
    order: 3,
    collapsible: true,
    properties: [
      {
        key: 'label',
        label: 'Label',
        type: 'text',
      },
      {
        key: 'dataStoreKey',
        label: 'Data Store Key',
        type: 'text',
        placeholder: 'e.g. sliderValue',
      },
      {
        key: 'min',
        label: 'Min',
        type: 'number',
        defaultValue: 0,
      },
      {
        key: 'max',
        label: 'Max',
        type: 'number',
        defaultValue: 100,
      },
      {
        key: 'step',
        label: 'Step',
        type: 'number',
        defaultValue: 1,
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['layout', 'state'],
    extendedGroups: ['border', 'styling'],
    customGroups: [settingsGroup],
  };

  return (
    <BasePropertiesRenderer
      component={component}
      updateProp={updateProp}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const SliderPlugin: ComponentPlugin = {
  type: ComponentType.SLIDER,
  paletteConfig: {
    label: 'Slider',
    icon: React.createElement('svg', { 
      style: iconStyle, 
      viewBox: "0 0 24 24", 
      fill: "none", 
      xmlns: "http://www.w3.org/2000/svg" 
    }, 
      React.createElement('line', { x1: "4", y1: "12", x2: "20", y2: "12", stroke: "currentColor", strokeWidth: "2" }),
      React.createElement('circle', { cx: "12", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "2" })
    ),
    defaultProps: {
      ...commonStylingProps,
      label: 'Slider',
      min: 0,
      max: 100,
      step: 1,
      dataStoreKey: 'sliderValue',
      width: 300,
      height: 60,
    },
  },
  renderer: SliderRenderer,
  properties: SliderProperties,
};
```

### 3. Register (`components/component-registry/registry.ts`)

```typescript
import { SliderPlugin } from './Slider';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
  // ... existing
  [ComponentType.SLIDER]: SliderPlugin,
};
```

## Advanced Features

### Conditional Properties

Properties that only show under certain conditions:

```typescript
const actionGroup: PropertyGroup = {
  id: 'component-action',
  title: 'Action',
  properties: [
    {
      key: 'actionType',
      label: 'Action Type',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'alert', label: 'Alert' },
      ],
    },
    {
      key: 'actionMessage',
      label: 'Message',
      type: 'text',
      // Only show when actionType is 'alert'
      condition: (props) => (props as YourComponentProps).actionType === 'alert',
    },
  ],
};
```

### Dynamic Options

Options that come from context:

```typescript
{
  key: 'dataSource',
  label: 'Data Source',
  type: 'select',
  options: () => dataSources.map(ds => ({ value: ds.id, label: ds.id })),
}
```

### Container Components

If your component can contain other components:

```typescript
export const YourComponentPlugin: ComponentPlugin = {
  // ... other config
  isContainer: true,  // Allow children
};
```

Then in your renderer, accept and render children:

```typescript
const YourComponentRenderer: React.FC<{
  component: { props: YourComponentProps };
  children?: React.ReactNode;  // Add children
  // ... other props
}> = ({ component, children, ... }) => {
  return (
    <div>
      {/* Your component content */}
      {children}  {/* Render children */}
    </div>
  );
};
```

## Checklist

- [ ] Add `ComponentType` enum value
- [ ] Create props interface extending `BaseProps`
- [ ] Add props to `ComponentProps` union type
- [ ] Create component file with renderer
- [ ] Create properties using `BasePropertiesRenderer`
- [ ] Define property groups (use base groups when possible)
- [ ] Create plugin with palette config, renderer, and properties
- [ ] Register component in registry
- [ ] Test the component in the editor

## Best Practices

1. **Reuse Base Groups**: Use `baseGroups: ['layout', 'state', 'styling']` instead of recreating common properties
2. **Use Conditions**: Hide properties that don't apply to the current state
3. **Provide Defaults**: Always provide sensible default values
4. **Type Safety**: Use TypeScript properly - extend `BaseProps` and add to `ComponentProps`
5. **Expression Support**: Use `type: 'expression'` for properties that should support dynamic values
6. **Accessibility**: Consider adding accessibility properties (ariaLabel, etc.)
7. **Icon Design**: Create a clear, recognizable icon for the palette

## Summary

Creating a new component involves:
1. **Types** - Define ComponentType and Props interface
2. **Renderer** - Component visual representation
3. **Properties** - Use BasePropertiesRenderer with PropertyConfig
4. **Plugin** - Combine everything into ComponentPlugin
5. **Registry** - Register in componentRegistry

The new architecture makes it easy to create components with consistent property panels and reusable common properties!

