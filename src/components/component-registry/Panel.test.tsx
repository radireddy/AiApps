import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelPlugin } from '@/components/component-registry/Panel';
import { ComponentType } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const PanelRenderer = PanelPlugin.renderer;
const PanelProperties = PanelPlugin.properties;

describe('PanelPlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'panel1',
      type: ComponentType.PANEL,
      props: {
        x: 10, y: 10, width: 300, height: 200,
        backgroundColor: '{{theme.colors.surface}}',
      },
    };

    it('should render children passed to it', () => {
      const scope = { theme: { colors: { surface: 'rgb(240, 240, 240)' } } };
      render(
        <PanelRenderer component={baseComponent} evaluationScope={scope}>
          <div>Child Element</div>
        </PanelRenderer>
      );
      expect(screen.getByText('Child Element')).toBeInTheDocument();
    });

    it('should apply background color from expression', () => {
      const scope = { theme: { colors: { surface: 'rgb(255, 0, 0)' } } };
      render(<PanelRenderer component={baseComponent} evaluationScope={scope} />);
      
      const panel = screen.getByText('', { selector: '.w-full.h-full' });
      expect(panel).toHaveStyle('background-color: rgb(255, 0, 0)');
    });
  });

  describe('Properties', () => {
     it('should render properties UI', () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor
        };
        render(<PanelProperties {...props} />);
        expect(screen.getByLabelText('Background Color')).toHaveValue('#ffffff');
     });

     it('should have all sections expanded by default', () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor
        };
        render(<PanelProperties {...props} />);
        
        // Check that Basic section is expanded
        const basicSection = screen.getByRole('button', { name: 'Basic' });
        expect(basicSection).toHaveAttribute('aria-expanded', 'true');

        // Check that Container Layout Specific section is expanded
        const containerLayoutSection = screen.getByRole('button', { name: 'Container Layout Specific' });
        expect(containerLayoutSection).toHaveAttribute('aria-expanded', 'true');
     });

     it('should call arrangeChildren when direction is changed from horizontal to vertical', async () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const arrangeChildren = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    direction: 'horizontal',
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor,
            arrangeChildren
        };
        render(<PanelProperties {...props} />);
        
        // Container Layout Specific section is expanded by default, so buttons should be visible immediately
        const verticalButton = await screen.findByLabelText('Set direction to vertical');
        fireEvent.click(verticalButton);
        
        // Verify updateProp was called with the new direction
        expect(updateProp).toHaveBeenCalledWith('direction', 'vertical');
        
        // Verify arrangeChildren was called with the new direction
        expect(arrangeChildren).toHaveBeenCalledWith('panel1', { direction: 'vertical' });
     });

     it('should call arrangeChildren when direction is changed from vertical to horizontal', async () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const arrangeChildren = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    direction: 'vertical',
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor,
            arrangeChildren
        };
        render(<PanelProperties {...props} />);
        
        // Container Layout Specific section is expanded by default, so buttons should be visible immediately
        const horizontalButton = await screen.findByLabelText('Set direction to horizontal');
        fireEvent.click(horizontalButton);
        
        // Verify updateProp was called with the new direction
        expect(updateProp).toHaveBeenCalledWith('direction', 'horizontal');
        
        // Verify arrangeChildren was called with the new direction
        expect(arrangeChildren).toHaveBeenCalledWith('panel1', { direction: 'horizontal' });
     });

     it('should call arrangeChildren when justifyContent is changed', async () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const arrangeChildren = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    direction: 'horizontal',
                    justifyContent: 'start',
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor,
            arrangeChildren
        };
        render(<PanelProperties {...props} />);
        
        // Container Layout Specific section is expanded by default, so buttons should be visible immediately
        const centerButton = await screen.findByLabelText('Justify content: Center - Center items', {}, { timeout: 2000 });
        fireEvent.click(centerButton);
        
        // Verify updateProp was called
        expect(updateProp).toHaveBeenCalledWith('justifyContent', 'center');
        
        // Verify arrangeChildren was called with the new justifyContent
        expect(arrangeChildren).toHaveBeenCalledWith('panel1', { justifyContent: 'center' });
     });

     it('should call arrangeChildren when alignItems is changed', async () => {
        const updateProp = jest.fn();
        const onOpenExpressionEditor = jest.fn();
        const arrangeChildren = jest.fn();
        const props = {
            component: {
                id: 'panel1',
                props: {
                    direction: 'horizontal',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF'
                } as any
            },
            updateProp,
            onOpenExpressionEditor,
            arrangeChildren
        };
        render(<PanelProperties {...props} />);
        
        // Container Layout Specific section is expanded by default, so buttons should be visible immediately
        const stretchButton = await screen.findByLabelText('Align items: Stretch - Stretch items to fill space');
        fireEvent.click(stretchButton);
        
        // Verify updateProp was called
        expect(updateProp).toHaveBeenCalledWith('alignItems', 'stretch');
        
        // Verify arrangeChildren was called with the new alignItems
        expect(arrangeChildren).toHaveBeenCalledWith('panel1', { alignItems: 'stretch' });
     });
  });
});
