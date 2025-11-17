import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwitchPlugin } from './Switch';
import { ComponentType } from '../../types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const SwitchRenderer = SwitchPlugin.renderer;
const SwitchProperties = SwitchPlugin.properties;

describe('SwitchPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'switch1',
      type: ComponentType.SWITCH,
      props: {
        x: 0, y: 0, width: 180, height: 30,
        label: 'Enable Feature',
        dataStoreKey: 'feature.enabled',
      },
    };

    it('should render with label and be unchecked by default', () => {
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      expect(switchEl).toBeInTheDocument();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should be checked if the dataStore value is true', () => {
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{ feature: { enabled: true } }} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should call onUpdateDataStore when clicked', async () => {
      const onUpdateDataStore = jest.fn();
      render(<SwitchRenderer component={baseComponent} mode="preview" dataStore={{ feature: { enabled: false } }} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      await userEvent.click(switchEl);

      expect(onUpdateDataStore).toHaveBeenCalledWith('feature.enabled', true);
    });

    it('should be disabled in edit mode', () => {
      render(<SwitchRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      const switchEl = screen.getByRole('switch', { name: 'Enable Feature' });
      expect(switchEl).toBeDisabled();
    });
  });

  describe('Properties', () => {
    it('should render properties and call updateProp', async () => {
      const updateProp = jest.fn();
      const props = {
        component: {
          id: 'sw1',
          props: { label: 'My Switch', dataStoreKey: 'isSet' } as any,
        },
        updateProp,
        onOpenExpressionEditor: jest.fn(),
      };
      render(<SwitchProperties {...props} />);

      const labelInput = screen.getByLabelText('Label');
      expect(labelInput).toHaveValue('My Switch');

      await userEvent.clear(labelInput);
      await userEvent.type(labelInput, 'New Switch');
      expect(updateProp).toHaveBeenLastCalledWith('label', 'New Switch');
    });
  });
});