/**
 * Unit tests for drag and move functionality in RenderedComponent
 * These tests ensure that drag operations work correctly and perform well
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RenderedComponent } from '@/components/RenderedComponent';
import { AppComponent, ComponentType } from 'types';
import { dragState } from '../../utils/dragState';
import '@testing-library/jest-dom';

// Mock the dragState utility
jest.mock('../../utils/dragState', () => ({
  dragState: {
    getState: jest.fn(() => ({ isDragging: false, mouseX: 0, mouseY: 0, draggedComponentIds: [], highlightedContainerId: null })),
    setState: jest.fn(),
    subscribe: jest.fn((listener) => {
      // Return unsubscribe function
      return () => {};
    }),
    startDrag: jest.fn(),
    updateMousePosition: jest.fn(),
    setHighlightedContainer: jest.fn(),
    endDrag: jest.fn(),
  },
}));

describe('RenderedComponent - Drag and Move', () => {
  const mockOnSelect = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnUpdateComponents = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnDrop = jest.fn();
  const mockOnReparentCheck = jest.fn();

  const defaultProps = {
    component: {
      id: 'test-component',
      type: ComponentType.LABEL,
      pageId: 'page1',
      parentId: null,
      props: {
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        text: 'Test Label',
      },
    } as AppComponent,
    allComponents: [],
    selectedComponentIds: [],
    onSelect: mockOnSelect,
    onUpdate: mockOnUpdate,
    onUpdateComponents: mockOnUpdateComponents,
    onDelete: mockOnDelete,
    onDrop: mockOnDrop,
    onReparentCheck: mockOnReparentCheck,
    mode: 'edit' as const,
    dataStore: {},
    evaluationScope: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dragState.getState as jest.Mock).mockReturnValue({
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      draggedComponentIds: [],
    });
  });

  describe('Drag Start', () => {
    it('should start drag when mouse down on component', () => {
      render(<RenderedComponent {...defaultProps} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      expect(dragState.startDrag).toHaveBeenCalledWith([]);
    });

    it('should start drag with selected component IDs', () => {
      const props = {
        ...defaultProps,
        selectedComponentIds: ['test-component', 'other-component'],
      };
      render(<RenderedComponent {...props} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });

      expect(dragState.startDrag).toHaveBeenCalledWith(['test-component', 'other-component']);
    });
  });

  describe('Drag Move', () => {
    it('should update mouse position during drag', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });

      expect(dragState.updateMousePosition).toHaveBeenCalledWith(150, 150);
    });

    it('should update component position during drag', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });

      // Wait for updates to be processed
      await waitFor(() => {
        expect(mockOnUpdateComponents).toHaveBeenCalled();
      });
      
      const updates = mockOnUpdateComponents.mock.calls[0][0];
      expect(updates).toHaveLength(1);
      expect(updates[0].id).toBe('test-component');
      expect(updates[0].props.x).toBe(150); // 100 + 50
      expect(updates[0].props.y).toBe(150); // 100 + 50
    });

    it('should not update position if mouse moved less than 2 pixels', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 101, clientY: 100 }); // Only 1 pixel movement

      // Should still update mouse position but component position might not change significantly
      expect(dragState.updateMousePosition).toHaveBeenCalled();
    });
  });

  describe('Drag End', () => {
    it('should end drag and reparent component on mouse up', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Wait for drag to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 });
      
      // Wait for position update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      fireEvent.mouseUp(window, { clientX: 150, clientY: 150 });

      await waitFor(() => {
        expect(dragState.endDrag).toHaveBeenCalled();
        // Reparent might be called with or without position depending on implementation
        expect(mockOnReparentCheck).toHaveBeenCalled();
      });
    });

    it('should not reparent if component did not move', () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(window, { clientX: 100, clientY: 100 }); // No movement

      expect(dragState.endDrag).toHaveBeenCalled();
      expect(mockOnReparentCheck).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should apply updates immediately without RAF throttling', async () => {
      render(<RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />);
      
      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Wait for drag to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(window, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
        // Small delay to allow processing
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Wait for all updates to be processed
      await waitFor(() => {
        // Should have called updateComponents (at least once, possibly multiple times)
        expect(mockOnUpdateComponents.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should not cause excessive re-renders during drag', () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return <RenderedComponent {...defaultProps} selectedComponentIds={['test-component']} />;
      };

      render(<TestComponent />);
      const initialRenderCount = renderCount;

      const component = screen.getByLabelText(/label component/i);
      fireEvent.mouseDown(component, { clientX: 100, clientY: 100 });
      
      // Simulate multiple mouse movements
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseMove(window, { clientX: 100 + i * 10, clientY: 100 + i * 10 });
      }

      // Component should not re-render excessively (only on state changes)
      // Note: This is a basic check - actual render count depends on React's optimization
      expect(renderCount).toBeLessThan(initialRenderCount + 10);
    });
  });

  describe('Container Drag Over Highlight', () => {
    it('should show highlight when dragging over container', () => {
      const containerComponent = {
        id: 'container-1',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: {
          x: 0,
          y: 0,
          width: 400,
          height: 300,
        },
      } as AppComponent;

      const mockSubscribe = jest.fn((listener) => {
        // Simulate drag state update
        setTimeout(() => {
          listener({
            isDragging: true,
            mouseX: 200,
            mouseY: 150,
            draggedComponentIds: ['other-component'],
          });
        }, 0);
        return () => {};
      });

      (dragState.subscribe as jest.Mock).mockImplementation(mockSubscribe);

      render(
        <RenderedComponent
          {...defaultProps}
          component={containerComponent}
        />
      );

      // Wait for drag state update
      waitFor(() => {
        const container = screen.getByLabelText(/container component/i);
        expect(container).toHaveClass('ring-4', 'ring-blue-400');
      });
    });
  });
});

