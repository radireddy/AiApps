import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabelPlugin } from '@/components/component-registry/Label';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const LabelRenderer = LabelPlugin.renderer;
const LabelProperties = LabelPlugin.properties;

describe('LabelPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'label1',
      type: ComponentType.LABEL,
      props: {
        x: 0, y: 0, width: 100, height: 30,
        text: 'Static Label',
        fontSize: 16,
        fontWeight: 'normal' as const,
        color: 'black',
      },
    };

    it('should render static text', () => {
      render(<LabelRenderer component={baseComponent} evaluationScope={{}} />);
      expect(screen.getByText('Static Label')).toBeInTheDocument();
    });

    it('should render text from an expression', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, text: 'Hello, {{user.name}}' },
      };
      const scope = { user: { name: 'Alice' } };
      render(<LabelRenderer component={component} evaluationScope={scope} />);
      expect(screen.getByText('Hello, Alice')).toBeInTheDocument();
    });

    it('should apply styles correctly', () => {
        const component = {
            ...baseComponent,
            props: { ...baseComponent.props, color: '{{theme.colors.primary}}', fontSize: 20 },
          };
        const scope = { theme: { colors: { primary: 'rgb(255, 0, 0)' } } };
        render(<LabelRenderer component={component} evaluationScope={scope} />);
        const label = screen.getByText('Static Label');
        expect(label).toHaveStyle('color: rgb(255, 0, 0)');
        expect(label).toHaveStyle('font-size: 20px');
    });
  });

  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: {
        id: 'lbl1',
        props: {
          text: 'My Label',
          fontSize: 18,
        } as any,
      },
      updateProp,
      onOpenExpressionEditor
    };

    it('should render properties correctly', () => {
      render(<LabelProperties {...baseProps} />);
      expect(screen.getByLabelText('Text')).toHaveValue('My Label');
      expect(screen.getByLabelText('Font Size')).toHaveValue(18);
    });

    it('should call updateProp when text is changed', async () => {
        render(<LabelProperties {...baseProps} />);
        const input = screen.getByLabelText('Text');
        // Use fireEvent to directly set the value for reliability
        fireEvent.change(input, { target: { value: 'New Text' } });
        // PropFxInput calls updateProp on change, check that it was called with the new value
        expect(updateProp).toHaveBeenCalledWith('text', 'New Text');
    });

    it('should call updateProp when font size is changed', async () => {
        render(<LabelProperties {...baseProps} />);
        const input = screen.getByLabelText('Font Size');
        // Use fireEvent to directly set the value for reliability
        fireEvent.change(input, { target: { value: '24' } });
        // The input converts to number, check that it was called with the new value
        expect(updateProp).toHaveBeenCalledWith('fontSize', 24);
    });
  });
});