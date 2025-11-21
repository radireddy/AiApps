import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
  });
});