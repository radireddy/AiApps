import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputPlugin } from '@/components/component-registry/Input';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const InputRenderer = InputPlugin.renderer;
const InputProperties = InputPlugin.properties;

describe('InputPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'input1',
      type: ComponentType.INPUT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Enter text...',
        accessibilityLabel: 'Name input',
      },
    };

    it('should render with placeholder and empty value', () => {
      render(<InputRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const input = screen.getByPlaceholderText('Enter text...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });


    it('should be disabled based on an expression', () => {
        const component = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
        render(<InputRenderer component={component} mode="preview" dataStore={{}} evaluationScope={{}} />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should render dynamic placeholder from expression', () => {
      const component = { ...baseComponent, props: { ...baseComponent.props, placeholder: '{{ "Dynamic Placeholder" }}' } };
      render(<InputRenderer component={component} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByPlaceholderText('Dynamic Placeholder')).toBeInTheDocument();
    });
  });

  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: {
        id: 'input1',
        props: {
          placeholder: 'User Name',
          accessibilityLabel: 'User name input',
        } as any
      },
      updateProp,
      onOpenExpressionEditor
    };

    it('should render properties correctly', () => {
      render(<InputProperties {...baseProps} />);
      expect(screen.getByLabelText('Placeholder')).toHaveValue('User Name');
      expect(screen.getByLabelText('Accessibility Label')).toHaveValue('User name input');
    });

    it('should call updateProp when placeholder is changed', async () => {
        render(<InputProperties {...baseProps} />);
        const input = screen.getByLabelText('Placeholder');
        // Use fireEvent to directly set the value for reliability
        fireEvent.change(input, { target: { value: 'New Placeholder' } });
        // PropInput calls updateProp on change, check that it was called with the new value
        expect(updateProp).toHaveBeenCalledWith('placeholder', 'New Placeholder');
    });
  });
});