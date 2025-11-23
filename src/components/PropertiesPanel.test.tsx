import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

// Mock the component registry and a dummy properties renderer.
// Use a runtime require for `types` inside the factory to avoid circular-init issues.
jest.mock('components/component-registry/registry', () => {
  const types = require('types');
  return {
    componentRegistry: {
      [types.ComponentType.LABEL]: {
        properties: ({ component }: any) => <div>Properties for {component.props.text}</div>,
        paletteConfig: { label: 'Label' },
      },
    },
  };
});

describe('PropertiesPanel', () => {
  const onUpdate = jest.fn();
  const onOpenExpressionEditor = jest.fn();
  const onAlignAndDistribute = jest.fn();
  const baseProps = {
    onUpdate,
    width: 288,
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
    dataSources: [],
    variables: [],
    evaluationScope: {},
    onOpenExpressionEditor,
    onAlignAndDistribute,
  };

  it('should show a message when no component is selected', () => {
    render(<PropertiesPanel {...baseProps} components={[]} selectedComponentIds={[]} />);
    expect(screen.getByText('Select a component to see its properties.')).toBeInTheDocument();
  });

  it('should render the properties for a single selected component', () => {
    const components = [
      { id: 'comp1', type: ComponentType.LABEL, props: { text: 'My Label', x: 0, y: 0, width: 100, height: 40 } } as any,
    ];
    render(<PropertiesPanel {...baseProps} components={components} selectedComponentIds={['comp1']} />);
    // With the new metadata-driven system, check for the component ID and property tabs
    expect(screen.getByText('ID: comp1')).toBeInTheDocument();
    // Check that property tabs are rendered (General tab should be present)
    expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
  });

  it('should render the alignment UI for multiple selected components', () => {
    render(<PropertiesPanel {...baseProps} components={[]} selectedComponentIds={['comp1', 'comp2']} />);
    expect(screen.getByText('2 components selected.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Align' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Distribute' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Match Size' })).toBeInTheDocument();
  });

  it('should call onAlignAndDistribute when an alignment button is clicked', async () => {
    render(<PropertiesPanel {...baseProps} components={[]} selectedComponentIds={['comp1', 'comp2']} />);
    
    // Tooltip text is used as the accessible name for the button
    const alignLeftButton = screen.getByLabelText('Align left edges & stack vertically');
    await userEvent.click(alignLeftButton);
    
    expect(onAlignAndDistribute).toHaveBeenCalledWith('align-left');
  });
});