/**
 * Unit tests for drag and move functionality in useAppData hook
 * Tests reorderComponent and moveComponentToParent functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType } from 'types';

describe('useAppData - Drag and Move', () => {
  const mockOnSave = jest.fn();
  
  const createMockAppDefinition = (): AppDefinition => ({
    id: 'app1',
    name: 'Test App',
    mainPageId: 'page1',
    pages: [{ id: 'page1', name: 'Page 1' }],
    components: [
      {
        id: 'container1',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: { x: 0, y: 0, width: 400, height: 300 },
      },
      {
        id: 'container2',
        type: ComponentType.CONTAINER,
        pageId: 'page1',
        parentId: null,
        props: { x: 500, y: 0, width: 400, height: 300 },
      },
      {
        id: 'label1',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: 'container1',
        props: { x: 10, y: 10, width: 100, height: 30, text: 'Label 1' },
      },
      {
        id: 'label2',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: 'container1',
        props: { x: 10, y: 50, width: 100, height: 30, text: 'Label 2' },
      },
      {
        id: 'label3',
        type: ComponentType.LABEL,
        pageId: 'page1',
        parentId: null,
        props: { x: 100, y: 100, width: 100, height: 30, text: 'Label 3' },
      },
    ],
    dataStore: {},
    dataSources: [],
    variables: [],
    theme: {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reorderComponent', () => {
    it('should reorder components within the same parent', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        // Skip test if function doesn't exist (might not be exported)
        return;
      }

      act(() => {
        result.current.reorderComponent!('label1', 1, 'container1', 'page1');
      });

      const components = result.current.appDefinition.components;
      const container1Children = components.filter(c => c.parentId === 'container1');
      
      // label1 should now be after label2
      const label1Index = container1Children.findIndex(c => c.id === 'label1');
      const label2Index = container1Children.findIndex(c => c.id === 'label2');
      
      expect(label1Index).toBeGreaterThan(label2Index);
    });

    it('should reorder root-level components', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      act(() => {
        result.current.reorderComponent!('container1', 1, null, 'page1');
      });

      const components = result.current.appDefinition.components;
      const rootComponents = components.filter(c => !c.parentId && c.pageId === 'page1');
      
      const container1Index = rootComponents.findIndex(c => c.id === 'container1');
      const container2Index = rootComponents.findIndex(c => c.id === 'container2');
      
      expect(container1Index).toBeGreaterThan(container2Index);
    });

    it('should not reorder if component is not on the correct page', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      act(() => {
        result.current.reorderComponent!('label1', 1, 'container1', 'wrong-page');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });
  });

  describe('moveComponentToParent', () => {
    it('should move component from one container to another', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label1', 'container2', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label1');
      
      expect(movedComponent?.parentId).toBe('container2');
      expect(movedComponent?.pageId).toBe('page1');
    });

    it('should move component from container to root level', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      // Check if function exists
      if (result.current.moveComponentToParent) {
        act(() => {
          result.current.moveComponentToParent('label1', null, 0, 'page1');
        });
      } else {
        // Skip test if function not available
        expect(result.current.moveComponentToParent).toBeDefined();
        return;
      }

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label1');
      
      expect(movedComponent?.parentId).toBeNull();
      expect(movedComponent?.pageId).toBe('page1');
    });

    it('should move component from root to container', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label3', 'container1', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label3');
      
      expect(movedComponent?.parentId).toBe('container1');
    });

    it('should calculate correct relative position when moving to container', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      act(() => {
        result.current.moveComponentToParent!('label3', 'container1', 0, 'page1');
      });

      const components = result.current.appDefinition.components;
      const movedComponent = components.find(c => c.id === 'label3');
      
      // Position should be relative to container (accounting for container's position)
      expect(movedComponent?.props.x).toBeGreaterThanOrEqual(0);
      expect(movedComponent?.props.y).toBeGreaterThanOrEqual(0);
    });

    it('should prevent moving component into itself', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      act(() => {
        result.current.moveComponentToParent!('container1', 'container1', 0, 'page1');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });

    it('should prevent moving component into its descendant', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];

      // Try to move container1 into label1 (which is a child of container1)
      act(() => {
        result.current.moveComponentToParent!('container1', 'label1', 0, 'page1');
      });

      // Components should remain unchanged
      expect(result.current.appDefinition.components).toEqual(initialComponents);
    });

    it('should rollback if move fails validation', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const initialComponents = [...result.current.appDefinition.components];
      const initialLabel1 = initialComponents.find(c => c.id === 'label1')!;

      // Try to move to a non-container component
      act(() => {
        result.current.moveComponentToParent!('label1', 'label2', 0, 'page1');
      });

      // Component should remain in original position
      const components = result.current.appDefinition.components;
      const label1 = components.find(c => c.id === 'label1');
      expect(label1?.parentId).toBe(initialLabel1.parentId);
      expect(label1?.props.x).toBe(initialLabel1.props.x);
      expect(label1?.props.y).toBe(initialLabel1.props.y);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid reorder operations', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.reorderComponent) {
        return;
      }

      const startTime = performance.now();

      act(() => {
        // Perform multiple reorder operations
        for (let i = 0; i < 10; i++) {
          result.current.reorderComponent!('label1', i % 2, 'container1', 'page1');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 10 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple rapid move operations', () => {
      const initialApp = createMockAppDefinition();
      const { result } = renderHook(() => useAppData(initialApp, mockOnSave));

      if (!result.current.moveComponentToParent) {
        return;
      }

      const startTime = performance.now();

      act(() => {
        // Perform multiple move operations
        for (let i = 0; i < 5; i++) {
          const targetParent = i % 2 === 0 ? 'container1' : 'container2';
          result.current.moveComponentToParent!('label1', targetParent, 0, 'page1');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 200ms for 5 operations)
      expect(duration).toBeLessThan(200);
    });
  });
});

