import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
        dataStoreKey: 'termsAccepted',
      },
    };

    it('should render with label and be unchecked by default', () => {
      render(<CheckboxRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const checkbox = screen.getByLabelText('Accept Terms');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should be checked if the dataStore value is true', () => {
      render(<CheckboxRenderer component={baseComponent} mode="preview" dataStore={{ termsAccepted: true }} evaluationScope={{}} />);
      const checkbox = screen.getByLabelText('Accept Terms');
      expect(checkbox).toBeChecked();
    });

    it('should call onUpdateDataStore when clicked', async () => {
      const onUpdateDataStore = jest.fn();
      render(<CheckboxRenderer component={baseComponent} mode="preview" dataStore={{ termsAccepted: false }} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      
      const checkbox = screen.getByLabelText('Accept Terms');
      await userEvent.click(checkbox);

      expect(onUpdateDataStore).toHaveBeenCalledWith('termsAccepted', true);
    });

    it('should be disabled in edit mode', () => {
        render(<CheckboxRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
        const checkbox = screen.getByLabelText('Accept Terms');
        expect(checkbox).toBeDisabled();
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
          dataStoreKey: 'isChecked',
        } as any
      },
      updateProp,
      onOpenExpressionEditor,
    };

    it('should render properties correctly', () => {
      render(<CheckboxProperties {...baseProps} />);
      expect(screen.getByLabelText('Label')).toHaveValue('My Checkbox');
      expect(screen.getByLabelText('Data Store Key')).toHaveValue('isChecked');
    });

    it('should call updateProp when label is changed', async () => {
        render(<CheckboxProperties {...baseProps} />);
        const labelInput = screen.getByLabelText('Label');
        await userEvent.clear(labelInput);
        await userEvent.type(labelInput, 'New Label');
        expect(updateProp).toHaveBeenLastCalledWith('label', 'New Label');
    });
  });
});