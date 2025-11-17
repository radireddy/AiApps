import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroupPlugin } from './RadioGroup';
import { ComponentType } from '../../types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const RadioGroupRenderer = RadioGroupPlugin.renderer;
const RadioGroupProperties = RadioGroupPlugin.properties;

describe('RadioGroupPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'radio1',
      type: ComponentType.RADIO_GROUP,
      props: {
        x: 0, y: 0, width: 150, height: 80,
        options: 'Admin,Editor,Viewer',
        dataStoreKey: 'user.role',
        groupLabel: 'User Role',
      },
    };

    it('should render all options', () => {
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByLabelText('Admin')).toBeInTheDocument();
      expect(screen.getByLabelText('Editor')).toBeInTheDocument();
      expect(screen.getByLabelText('Viewer')).toBeInTheDocument();
    });

    it('should have the correct option checked based on dataStore', () => {
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{ user: { role: 'Editor' } }} evaluationScope={{}} />);
      expect(screen.getByLabelText('Editor')).toBeChecked();
      expect(screen.getByLabelText('Admin')).not.toBeChecked();
    });

    it('should call onUpdateDataStore when a different option is clicked', async () => {
      const onUpdateDataStore = jest.fn();
      render(<RadioGroupRenderer component={baseComponent} mode="preview" dataStore={{ user: { role: 'Editor' } }} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      
      const adminRadio = screen.getByLabelText('Admin');
      await userEvent.click(adminRadio);

      expect(onUpdateDataStore).toHaveBeenCalledWith('user.role', 'Admin');
    });

    it('should be disabled in edit mode', () => {
      render(<RadioGroupRenderer component={baseComponent} mode="edit" dataStore={{}} evaluationScope={{}} />);
      expect(screen.getByLabelText('Admin')).toBeDisabled();
    });
  });

  describe('Properties', () => {
    it('should render properties correctly and call updateProp', async () => {
      const updateProp = jest.fn();
      const props = {
        component: {
          id: 'rg1',
          props: { dataStoreKey: 'role', options: 'A,B' } as any,
        },
        updateProp,
        onOpenExpressionEditor: jest.fn(),
      };
      render(<RadioGroupProperties {...props} />);

      expect(screen.getByLabelText('Data Store Key')).toHaveValue('role');
      const optionsInput = screen.getByLabelText('Options (CSV)');
      expect(optionsInput).toHaveValue('A,B');

      await userEvent.clear(optionsInput);
      await userEvent.type(optionsInput, 'X,Y,Z');
      expect(updateProp).toHaveBeenLastCalledWith('options', 'X,Y,Z');
    });
  });
});