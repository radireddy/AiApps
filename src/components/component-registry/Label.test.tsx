
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabelPlugin } from './Label';
import { ComponentType } from '../../types';

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
        await userEvent.clear(input);
        await userEvent.type(input, 'New Text');
        expect(updateProp).toHaveBeenLastCalledWith('text', 'New Text');
    });

    it('should call updateProp when font size is changed', async () => {
        render(<LabelProperties {...baseProps} />);
        const input = screen.getByLabelText('Font Size');
        await userEvent.clear(input);
        await userEvent.type(input, '24');
        expect(updateProp).toHaveBeenLastCalledWith('fontSize', 24);
    });
  });
});