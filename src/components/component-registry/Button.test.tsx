
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ButtonPlugin } from './Button';
// FIX: Import ButtonProps type to resolve TypeScript error.
import { ComponentType, ActionHandlers, ButtonProps } from '../../types';

const ButtonRenderer = ButtonPlugin.renderer;
const ButtonProperties = ButtonPlugin.properties;

describe('ButtonPlugin', () => {
  describe('Renderer', () => {
    const mockActions: ActionHandlers = {
      createRecord: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
      selectRecord: jest.fn(),
      updateVariable: jest.fn(),
    };

    const baseComponent = {
      id: 'button1',
      type: ComponentType.BUTTON,
      props: {
        x: 0, y: 0, width: 100, height: 40,
        text: 'Click Me',
        backgroundColor: 'blue',
        textColor: 'white',
        actionType: 'none' as const,
      },
    };

    it('should render the button with text', () => {
      render(<ButtonRenderer component={baseComponent} mode="preview" evaluationScope={{}} />);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should be disabled based on an expression', () => {
      const component = {
        ...baseComponent,
        props: { ...baseComponent.props, disabled: '{{ 1 === 1 }}' },
      };
      render(<ButtonRenderer component={component} mode="preview" evaluationScope={{}} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should trigger an alert action on click', () => {
      const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const component = {
        ...baseComponent,
        props: {
          ...baseComponent.props,
          actionType: 'alert' as const,
          actionAlertMessage: 'Hello {{user.name}}',
        },
      };
      const scope = { user: { name: 'World' } };

      render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
      fireEvent.click(screen.getByRole('button'));
      expect(spy).toHaveBeenCalledWith('Hello World');
      spy.mockRestore();
    });

    it('should trigger an updateVariable action on click', () => {
        const component = {
            ...baseComponent,
            props: {
                ...baseComponent.props,
                actionType: 'updateVariable' as const,
                actionVariableName: 'isLoading',
                actionVariableValue: '{{!isLoading}}'
            }
        };
        const scope = { isLoading: false };
        render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockActions.updateVariable).toHaveBeenCalledWith('isLoading', true);
    });

    it('should trigger a createRecord action with evaluated data', () => {
       const component = {
            ...baseComponent,
            props: {
                ...baseComponent.props,
                actionType: 'createRecord' as const,
                dataSourceName: 'users',
                newRecordData: '{{ ({ name: inputName.value }) }}'
            }
        };
        const scope = { inputName: { value: 'John Doe' } };
        render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={scope} />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockActions.createRecord).toHaveBeenCalledWith('users', { name: 'John Doe' });
    });
    
    it('should show an alert if createRecord expression is invalid', () => {
        const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
        const component = {
             ...baseComponent,
             props: {
                 ...baseComponent.props,
                 actionType: 'createRecord' as const,
                 dataSourceName: 'users',
                 newRecordData: '{{ "not an object" }}'
             }
         };
         render(<ButtonRenderer component={component} mode="preview" actions={mockActions} evaluationScope={{}} />);
         fireEvent.click(screen.getByRole('button'));
         expect(spy).toHaveBeenCalledWith(expect.stringContaining("invalid or did not produce an object"));
         spy.mockRestore();
    });
  });

  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: { 
        id: 'btn1',
        props: { 
          text: 'My Button',
          actionType: 'none',
        } as ButtonProps 
      },
      updateProp,
      dataSources: [{ id: 'users', providerId: 'MOCK', config: {} }],
      variables: [{ id: 'var1', name: 'isLoading', type: 'boolean', initialValue: false }],
      onOpenExpressionEditor,
    };

    it('should render basic properties', () => {
      render(<ButtonProperties {...baseProps} />);
      expect(screen.getByLabelText('Text')).toHaveValue('My Button');
    });

    it('should update text prop on change', async () => {
      render(<ButtonProperties {...baseProps} />);
      const textInput = screen.getByLabelText('Text');
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'New Text');
      expect(updateProp).toHaveBeenLastCalledWith('text', 'New Text');
    });

    it('should show alert message field when actionType is "alert"', async () => {
      const props = { ...baseProps, component: { ...baseProps.component, props: { ...baseProps.component.props, actionType: 'alert' as const } } };
      render(<ButtonProperties {...props} />);
      expect(screen.getByLabelText('Action Type')).toHaveValue('alert');
      expect(screen.getByLabelText('Alert Message')).toBeInTheDocument();
    });
  });
});