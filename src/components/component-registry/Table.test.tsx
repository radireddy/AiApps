
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablePlugin } from './Table';
import { ComponentType, ActionHandlers, DataSourceInstance } from '../../types';

const TableRenderer = TablePlugin.renderer;
const TableProperties = TablePlugin.properties;

const mockData = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

describe('TablePlugin', () => {
  describe('Renderer', () => {
    const mockActions: ActionHandlers = {
      createRecord: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
      selectRecord: jest.fn(),
      updateVariable: jest.fn(),
    };

    const baseComponent = {
      id: 'table1',
      type: ComponentType.TABLE,
      props: {
        x: 0, y: 0, width: 500, height: 300,
        dataSourceName: 'users',
        columns: 'Name:name,Email:email',
        rowSelectAction: 'updateDataStore' as const,
        selectedRecordKey: 'selectedUser',
      },
    };

    it('should render headers and data rows', () => {
      const scope = { users: mockData };
      render(<TableRenderer component={baseComponent} mode="preview" actions={mockActions} evaluationScope={scope} />);
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'bob@example.com' })).toBeInTheDocument();
    });

    it('should show "No records found" when data is empty', () => {
      const scope = { users: [] };
      render(<TableRenderer component={baseComponent} mode="preview" actions={mockActions} evaluationScope={scope} />);
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });

    it('should call selectRecord action on row click in preview mode', async () => {
      const scope = { users: mockData };
      render(<TableRenderer component={baseComponent} mode="preview" actions={mockActions} evaluationScope={scope} />);
      
      const row = screen.getByRole('cell', { name: 'Alice' }).closest('tr');
      await userEvent.click(row!);

      expect(mockActions.selectRecord).toHaveBeenCalledWith('selectedUser', mockData[0]);
    });

    it('should highlight the selected row', () => {
        const scope = { users: mockData, selectedUser: mockData[1] };
        render(<TableRenderer component={baseComponent} mode="preview" actions={mockActions} evaluationScope={scope} />);
        
        const selectedRow = screen.getByRole('cell', { name: 'Bob' }).closest('tr');
        const unselectedRow = screen.getByRole('cell', { name: 'Alice' }).closest('tr');

        expect(selectedRow).toHaveClass('bg-blue-100');
        expect(unselectedRow).not.toHaveClass('bg-blue-100');
    });
  });

  describe('Properties', () => {
    it('should render data source and column properties', () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const props = {
            component: {
                id: 'table1',
                props: {
                    dataSourceName: 'users',
                    columns: 'Name:name',
                    rowSelectAction: 'updateDataStore',
                    selectedRecordKey: 'selectedUser',
                } as any
            },
            updateProp,
            onOpenExpressionEditor,
            dataSources: [{ id: 'users', providerId: 'MOCK', config: {} }]
        };

        render(<TableProperties {...props} />);
        expect(screen.getByLabelText('Data Source')).toHaveValue('users');
        expect(screen.getByLabelText('Columns')).toHaveValue('Name:name');
        expect(screen.getByLabelText('Selected Record Key')).toHaveValue('selectedUser');
    });
  });
});