
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectPlugin } from './Select';
import { ComponentType } from '../../types';

const SelectRenderer = SelectPlugin.renderer;
const SelectProperties = SelectPlugin.properties;

describe('SelectPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'select1',
      type: ComponentType.SELECT,
      props: {
        x: 0, y: 0, width: 200, height: 40,
        placeholder: 'Choose one...',
        dataStoreKey: 'selection',
        options: 'Apple,Banana,Orange',
      },
    };

    it('should render with placeholder and options', () => {
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{}} evaluationScope={{}} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Choose one...')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('should show the selected value from dataStore', () => {
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{ selection: 'Banana' }} evaluationScope={{}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('Banana');
    });

    it('should call onUpdateDataStore when an option is selected', async () => {
      const onUpdateDataStore = jest.fn();
      render(<SelectRenderer component={baseComponent} mode="preview" dataStore={{}} onUpdateDataStore={onUpdateDataStore} evaluationScope={{}} />);
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'Orange');
      expect(onUpdateDataStore).toHaveBeenCalledWith('selection', 'Orange');
    });
  });
  
  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: {
        id: 'select1',
        props: {
          placeholder: 'My Placeholder',
          dataStoreKey: 'myKey',
          options: 'A,B,C',
        } as any
      },
      updateProp,
      onOpenExpressionEditor
    };

    it('should render properties correctly', () => {
      render(<SelectProperties {...baseProps} />);
      expect(screen.getByLabelText('Placeholder')).toHaveValue('My Placeholder');
      expect(screen.getByLabelText('Data Store Key')).toHaveValue('myKey');
      expect(screen.getByLabelText('Options (CSV)')).toHaveValue('A,B,C');
    });
  });
});