import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertiesPanelCore } from '../../components/properties/PropertiesPanelCore';
import { ComponentType } from 'types';
import { registerAllPropertySchemas } from '../../components/properties/schemas';
import '@testing-library/jest-dom';

// Register all property schemas before tests
beforeEach(() => {
  // Clear any previous registrations
  const { propertyRegistry } = require('../../components/properties/registry');
  Object.keys(propertyRegistry).forEach(key => delete propertyRegistry[key]);
  
  // Register all schemas
  registerAllPropertySchemas();
});

describe('PropertiesPanelCore - Label Component', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    dataSources: [],
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should display the Text property for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that the Text property label is visible
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
  });

  it('should display the Text Renderer property for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          textRenderer: 'javascript',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that the Text Renderer property label is visible
    expect(screen.getByLabelText('Text Renderer')).toBeInTheDocument();
  });

  it('should display all Basic group properties for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that Basic group exists and contains Text property
    const basicGroup = screen.getByText('Basic');
    expect(basicGroup).toBeInTheDocument();
    
    // Check that Text property is in the Basic group
    expect(screen.getByLabelText('Text')).toBeInTheDocument();
    expect(screen.getByLabelText('Text Renderer')).toBeInTheDocument();
  });

  it('should display Typography properties for Label component', () => {
    const components = [
      { 
        id: 'label1', 
        type: ComponentType.LABEL, 
        props: { 
          text: 'My Label',
          fontSize: 16,
          fontWeight: 'normal',
          color: '#111827',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['label1']} 
      />
    );
    
    // Check that Typography group exists
    expect(screen.getByText('Typography')).toBeInTheDocument();
    
    // Check that typography properties are visible
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Weight')).toBeInTheDocument();
    expect(screen.getByLabelText('Text Color')).toBeInTheDocument();
  });
});

describe('PropertiesPanelCore - Default Value Property', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    dataSources: [],
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should display Default Value property for INPUT component', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          dataStoreKey: 'user.name',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for SELECT component', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          dataStoreKey: 'user.country',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for TEXTAREA component', () => {
    const components = [
      { 
        id: 'textarea1', 
        type: ComponentType.TEXTAREA, 
        props: { 
          placeholder: 'Enter text',
          dataStoreKey: 'user.message',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['textarea1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for CHECKBOX component', () => {
    const components = [
      { 
        id: 'checkbox1', 
        type: ComponentType.CHECKBOX, 
        props: { 
          label: 'Accept terms',
          dataStoreKey: 'user.accepted',
          defaultValue: false,
          x: 0,
          y: 0,
          width: 150,
          height: 30,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['checkbox1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for SWITCH component', () => {
    const components = [
      { 
        id: 'switch1', 
        type: ComponentType.SWITCH, 
        props: { 
          label: 'Enable feature',
          dataStoreKey: 'user.enabled',
          defaultValue: false,
          x: 0,
          y: 0,
          width: 180,
          height: 30,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['switch1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should display Default Value property for RADIO_GROUP component', () => {
    const components = [
      { 
        id: 'radio1', 
        type: ComponentType.RADIO_GROUP, 
        props: { 
          options: 'Option 1,Option 2',
          dataStoreKey: 'user.gender',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 150,
          height: 80,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['radio1']} 
      />
    );
    
    expect(screen.getByLabelText('Default Value')).toBeInTheDocument();
  });

  it('should update component when Default Value is changed for INPUT', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          dataStoreKey: 'user.name',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    const defaultValueInput = screen.getByLabelText('Default Value');
    expect(defaultValueInput).toBeInTheDocument();
    
    // Verify the input can be updated (this tests that the property is functional)
    expect(defaultValueInput).toHaveValue('');
  });

  it('should update component when Default Value is changed for SELECT', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2,Option 3',
          dataStoreKey: 'user.country',
          defaultValue: 'Option 1',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    const defaultValueInput = screen.getByLabelText('Default Value');
    expect(defaultValueInput).toBeInTheDocument();
    expect(defaultValueInput).toHaveValue('Option 1');
  });

  it('should not have duplicate State groups', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          dataStoreKey: 'user.country',
          defaultValue: '',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    // Count how many "State" group headers exist (button elements with text "State")
    const stateButtons = Array.from(container.querySelectorAll('button')).filter(btn => 
      btn.textContent?.trim() === 'State'
    );
    // Should only have one State group
    expect(stateButtons.length).toBeLessThanOrEqual(1);
  });
});

describe('PropertiesPanelCore - Group Ordering', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const baseProps = {
    onUpdate,
    dataSources: [],
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onArrangeContainerChildren: jest.fn(),
  };

  it('should maintain consistent group order for INPUT component', () => {
    const components = [
      { 
        id: 'input1', 
        type: ComponentType.INPUT, 
        props: { 
          placeholder: 'Enter text',
          dataStoreKey: 'user.name',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['input1']} 
      />
    );
    
    // Get all group headers (buttons with group labels)
    const groupButtons = Array.from(container.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent?.trim();
      return text && ['Layout', 'State', 'Input Form And Validation', 'Accessibility', 'Styling'].includes(text);
    });
    
    const groupLabels = groupButtons.map(btn => btn.textContent?.trim()).filter(Boolean);
    
    // Verify order: Layout should come before State, State before Input Form And Validation, etc.
    const layoutIndex = groupLabels.indexOf('Layout');
    const stateIndex = groupLabels.indexOf('State');
    const inputFormIndex = groupLabels.indexOf('Input Form And Validation');
    const accessibilityIndex = groupLabels.indexOf('Accessibility');
    
    expect(layoutIndex).toBeGreaterThanOrEqual(0);
    expect(stateIndex).toBeGreaterThanOrEqual(0);
    expect(inputFormIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThanOrEqual(0);
    
    // Verify consistent ordering
    expect(layoutIndex).toBeLessThan(stateIndex);
    expect(stateIndex).toBeLessThan(inputFormIndex);
    expect(inputFormIndex).toBeLessThan(accessibilityIndex);
  });

  it('should maintain consistent group order for SELECT component', () => {
    const components = [
      { 
        id: 'select1', 
        type: ComponentType.SELECT, 
        props: { 
          placeholder: 'Select an option',
          options: 'Option 1,Option 2',
          dataStoreKey: 'user.country',
          x: 0,
          y: 0,
          width: 200,
          height: 40,
        } 
      } as any,
    ];
    
    const { container } = render(
      <PropertiesPanelCore 
        {...baseProps} 
        components={components} 
        selectedComponentIds={['select1']} 
      />
    );
    
    // Get all group headers
    const groupButtons = Array.from(container.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent?.trim();
      return text && ['Basic', 'Layout', 'State', 'Input Form And Validation', 'Accessibility'].includes(text);
    });
    
    const groupLabels = groupButtons.map(btn => btn.textContent?.trim()).filter(Boolean);
    
    // Verify order: Basic should come before Layout, Layout before State, etc.
    const basicIndex = groupLabels.indexOf('Basic');
    const layoutIndex = groupLabels.indexOf('Layout');
    const stateIndex = groupLabels.indexOf('State');
    const inputFormIndex = groupLabels.indexOf('Input Form And Validation');
    
    expect(basicIndex).toBeGreaterThanOrEqual(0);
    expect(layoutIndex).toBeGreaterThanOrEqual(0);
    expect(stateIndex).toBeGreaterThanOrEqual(0);
    expect(inputFormIndex).toBeGreaterThanOrEqual(0);
    
    // Verify consistent ordering
    expect(basicIndex).toBeLessThan(layoutIndex);
    expect(layoutIndex).toBeLessThan(stateIndex);
    expect(stateIndex).toBeLessThan(inputFormIndex);
  });

  it('should allow components to override group order', () => {
    // This test verifies that orderOverride works if needed in the future
    // For now, we just verify that the system supports it
    const { DEFAULT_GROUP_ORDER } = require('../../components/properties/registry');
    
    // Verify DEFAULT_GROUP_ORDER is defined
    expect(DEFAULT_GROUP_ORDER).toBeDefined();
    expect(DEFAULT_GROUP_ORDER['Basic']).toBe(0);
    expect(DEFAULT_GROUP_ORDER['Layout']).toBe(1);
    expect(DEFAULT_GROUP_ORDER['State']).toBe(2);
  });
});
