import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const TextareaRenderer = TextareaPlugin.renderer;
const TextareaProperties = TextareaPlugin.properties;

describe('TextareaPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'textarea1',
      type: ComponentType.TEXTAREA,
      props: {
        x: 0, y: 0, width: 250, height: 100,
        placeholder: 'Enter long text...',
        dataStoreKey: 'user.bio',
      },
    };

    it('should render with placeholder and empty value', () => {
      render(<TextareaRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const textarea = screen.getByPlaceholderText('Enter long text...');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('');
    });

    it('should display value from dataStore', () => {
      render(<TextareaRenderer component={baseComponent} mode="preview" dataStore={{ user: { bio: 'A detailed bio.' } }} evaluationScope={{}} />);
      expect(screen.getByDisplayValue('A detailed bio.')).toBeInTheDocument();
    });

    it('should call onUpdateDataStore on change', async () => {
      const onUpdateDataStore = jest.fn();
      render(<TextareaRenderer component={baseComponent} mode="preview" dataStore={{}} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      const textarea = screen.getByPlaceholderText('Enter long text...');
      await userEvent.type(textarea, 'Typing a bio');
      expect(onUpdateDataStore).toHaveBeenLastCalledWith('user.bio', 'Typing a bio');
    });

    it('should be disabled based on an expression', () => {
      const component = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
      render(<TextareaRenderer component={component} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Properties', () => {
    it('should render properties and call updateProp', async () => {
      const updateProp = jest.fn();
      const props = {
        component: {
          id: 'ta1',
          props: { placeholder: 'My Placeholder', dataStoreKey: 'myKey' } as any,
        },
        updateProp,
        onOpenExpressionEditor: jest.fn(),
      };
      render(<TextareaProperties {...props} />);

      const placeholderInput = screen.getByLabelText('Placeholder');
      expect(placeholderInput).toHaveValue('My Placeholder');

      // Select all text first, then type
      await userEvent.click(placeholderInput);
      await userEvent.keyboard('{Control>}a{/Control}');
      await userEvent.type(placeholderInput, 'New Placeholder');
      expect(updateProp).toHaveBeenLastCalledWith('placeholder', 'New Placeholder');
    });
  });
});