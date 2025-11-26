import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckboxPlugin } from '@/components/component-registry/Checkbox';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const CheckboxRenderer = CheckboxPlugin.renderer;
const CheckboxProperties = CheckboxPlugin.properties;

describe('CheckboxPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'checkbox1',
      type: ComponentType.CHECKBOX,
      props: {
        x: 0, y: 0, width: 150, height: 30,
        label: 'Accept Terms',
      },
    };

    it('should render with label and be unchecked by default', () => {
      render(<CheckboxRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const checkbox = screen.getByLabelText('Accept Terms');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });


    it('should be selectable in edit mode (not disabled)', () => {
        render(<CheckboxRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
        const checkbox = screen.getByLabelText('Accept Terms');
        // In edit mode, components should be selectable, so they should NOT be disabled
        expect(checkbox).not.toBeDisabled();
    });

    it('should be disabled based on expression', () => {
        const component = { ...baseComponent, props: { ...baseComponent.props, disabled: '{{true}}' } };
        render(<CheckboxRenderer component={component} mode="preview" dataStore={{}} evaluationScope={{}} />);
        const checkbox = screen.getByLabelText('Accept Terms');
        expect(checkbox).toBeDisabled();
    });
  });

  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: {
        id: 'chk1',
        props: {
          label: 'My Checkbox',
        } as any
      },
      updateProp,
      onOpenExpressionEditor,
    };

    it('should render properties correctly', () => {
      render(<CheckboxProperties {...baseProps} />);
      expect(screen.getByLabelText('Label')).toHaveValue('My Checkbox');
    });

    it('should call updateProp when label is changed', async () => {
        render(<CheckboxProperties {...baseProps} />);
        const labelInput = screen.getByLabelText('Label');
        // Use fireEvent to directly set the value for reliability
        fireEvent.change(labelInput, { target: { value: 'New Label' } });
        // PropInput calls updateProp on change, check that it was called with the new value
        expect(updateProp).toHaveBeenCalledWith('label', 'New Label');
    });
  });
});