import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '@/hooks/useAppData';
import { AppDefinition, ComponentType, AppVariableType } from 'types';

const mockAppDef: AppDefinition = {
  id: 'app1', name: 'Test App', createdAt: '', lastModifiedAt: '',
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [
    { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello' } as any },
    { id: 'panel1', type: ComponentType.PANEL, pageId: 'page1', props: { x:100, y:100, width:200, height:200 } as any },
  ],
  dataStore: {},
  dataSources: [],
  variables: [],
  theme: {
    colors: {
      primary: '#000000',
      onPrimary: '#ffffff',
      secondary: '#000000',
      onSecondary: '#ffffff',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      border: '#e5e5e5',
    },
    font: {
      family: 'Arial',
    },
    border: {
      width: '1px',
      style: 'solid',
    },
    radius: {
      default: '4px',
    },
    spacing: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
  },
};

describe('useAppData', () => {
  let onSave: jest.Mock;

  beforeEach(() => {
    onSave = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with the provided app definition', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    expect(result.current.appDefinition.id).toBe('app1');
    expect(result.current.components.length).toBe(2);
  });

  it('should trigger onSave with a debounce', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.addComponent(ComponentType.BUTTON, {x: 0, y: 0}, null, 'page1');
    });

    expect(onSave).not.toHaveBeenCalled();
    act(() => {
        jest.advanceTimersByTime(1500);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should add a component', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.addComponent(ComponentType.INPUT, { x: 10, y: 10 }, null, 'page1');
    });

    expect(result.current.components.length).toBe(3);
    const newComp = result.current.components[2];
    expect(newComp.type).toBe(ComponentType.INPUT);
    expect(newComp.props.x).toBe(10);
    expect(newComp.pageId).toBe('page1');
  });

  it('should update a component', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.updateComponent('comp1', { text: 'World' } as any);
    });

    const updatedComp = result.current.components.find(c => c.id === 'comp1');
    expect((updatedComp?.props as any).text).toBe('World');
  });

  it('should delete a component and its children', () => {
    const appDefWithChild = { ...mockAppDef, components: [
        ...mockAppDef.components,
        { id: 'child1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'panel1', props: {} as any }
    ]};
    const { result } = renderHook(() => useAppData(appDefWithChild, onSave));
    expect(result.current.components.length).toBe(3);

    act(() => {
      result.current.deleteComponent('panel1');
    });

    expect(result.current.components.length).toBe(1);
    expect(result.current.components.find(c => c.id === 'panel1')).toBeUndefined();
    expect(result.current.components.find(c => c.id === 'child1')).toBeUndefined();
    expect(result.current.selectedComponentIds.length).toBe(0);
  });

  it('should update the data store', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    
    act(() => {
      result.current.updateDataStore('user.name', 'Alice');
    });
    
    expect(result.current.dataStore.user.name).toBe('Alice');
  });

  it('should add a variable and initialize variableState', () => {
    const { result } = renderHook(() => useAppData(mockAppDef, onSave));
    const newVar = { id: 'var1', name: 'isLoading', type: AppVariableType.BOOLEAN, initialValue: 'true' };

    act(() => {
      result.current.addVariable(newVar);
    });
    
    expect(result.current.variables.length).toBe(1);
    expect(result.current.variableState['isLoading']).toBe(true);
  });

  it('should prevent adding a variable with a duplicate name', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const appDefWithVar = { ...mockAppDef, variables: [
        { id: 'var1', name: 'isLoading', type: AppVariableType.BOOLEAN, initialValue: 'false' }
    ]};
    const { result } = renderHook(() => useAppData(appDefWithVar, onSave));

    const newVar = { id: 'var2', name: 'isLoading', type: AppVariableType.STRING, initialValue: 'abc' };
    act(() => {
      result.current.addVariable(newVar);
    });

    expect(result.current.variables.length).toBe(1);
    expect(alertSpy).toHaveBeenCalledWith('A variable with this name already exists.');
    alertSpy.mockRestore();
  });

  it('should reparent a component when it is dropped inside a container', () => {
    const appDef = { ...mockAppDef, components: [
        { id: 'label1', type: ComponentType.LABEL, pageId: 'page1', props: { x: 150, y: 150, width: 50, height: 30 } as any },
        { id: 'panel1', type: ComponentType.PANEL, pageId: 'page1', props: { x: 100, y: 100, width: 200, height: 200 } as any },
    ]};
    const { result } = renderHook(() => useAppData(appDef, onSave));
    
    act(() => {
        result.current.reparentComponent('label1');
    });
    
    const reparented = result.current.components.find(c => c.id === 'label1');
    expect(reparented?.parentId).toBe('panel1');
    expect(reparented?.props.x).toBe(50); // 150 (abs) - 100 (parent abs) = 50 (rel)
    expect(reparented?.props.y).toBe(50); // 150 (abs) - 100 (parent abs) = 50 (rel)
  });

  it('should unparent a component when it is dropped outside all containers', () => {
    const appDef = { ...mockAppDef, components: [
        { id: 'label1', type: ComponentType.LABEL, pageId: 'page1', parentId: 'panel1', props: { x: 50, y: 50, width: 50, height: 30 } as any },
        { id: 'panel1', type: ComponentType.PANEL, pageId: 'page1', props: { x: 100, y: 100, width: 200, height: 200 } as any },
        // Update label1 to be outside the panel
    ]};
    const { result, rerender } = renderHook(({app}) => useAppData(app, onSave), { initialProps: { app: appDef }});
    
    const updatedAppDef = { ...appDef, components: appDef.components.map(c => 
        c.id === 'label1' ? { ...c, props: { ...c.props, x: 500, y: 500 } } : c
    )};
    
    rerender({ app: updatedAppDef });
    
    act(() => {
        result.current.reparentComponent('label1');
    });

    const unparented = result.current.components.find(c => c.id === 'label1');
    expect(unparented?.parentId).toBeNull();
    // It should now have absolute coordinates. Since we didn't update the props in the test state, we just check parentId.
    // The actual hook calculates the new absolute position.
  });

  it('should append children horizontally by default and stack when direction changes', () => {
    const panelApp = { ...mockAppDef, components: [
      { id: 'panel1', type: ComponentType.PANEL, pageId: 'page1', props: { x: 0, y: 0, width: 300, height: 100, direction: 'horizontal' } as any }
    ]};

    const { result } = renderHook(() => useAppData(panelApp, onSave));

    act(() => {
      result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, 'panel1', 'page1');
    });
    act(() => {
      // advance fake timers slightly so Date.now() and similar timers differ between adds
      jest.advanceTimersByTime(1);
    });
    act(() => {
      result.current.addComponent(ComponentType.BUTTON, { x: 0, y: 0 }, 'panel1', 'page1');
    });

    // ensure arrangement is applied (in the real app Editor calls arrange on drops)
    console.log('hook keys:', Object.keys(result.current));
    act(() => {
      // arrangeContainerChildren should be exposed by the hook
      // @ts-ignore - runtime check
      result.current.arrangeContainerChildren('panel1', {});
    });

    const children = result.current.components.filter(c => c.parentId === 'panel1');
    // debug log
    console.log('children props after adds:', children.map(c => ({ id: c.id, props: c.props })));
    expect(children.length).toBe(2);
    const [first, second] = children;
    expect(first.props.y).toBe(second.props.y);
    expect(second.props.x).toBeGreaterThan(first.props.x);

    // Now change direction to vertical and rearrange
    act(() => {
      result.current.updateComponent('panel1', { direction: 'vertical' } as any);
      result.current.arrangeContainerChildren('panel1', { direction: 'vertical' });
    });

    const updatedChildren = result.current.components.filter(c => c.parentId === 'panel1');
    const [u1, u2] = updatedChildren.sort((a, b) => (a.props as any).y - (b.props as any).y);
    expect(u2.props.y).toBeGreaterThan(u1.props.y);
    expect(u1.props.x).toBe(u2.props.x);
  });

  it('should rearrange existing children when direction changes via arrangeContainerChildren', () => {
    // Create a panel with existing children already positioned horizontally
    const panelApp = { 
      ...mockAppDef, 
      components: [
        { 
          id: 'panel1', 
          type: ComponentType.PANEL, 
          pageId: 'page1', 
          props: { 
            x: 0, 
            y: 0, 
            width: 300, 
            height: 200, 
            direction: 'horizontal' 
          } as any 
        },
        // Two children positioned side by side (horizontal layout)
        { 
          id: 'child1', 
          type: ComponentType.BUTTON, 
          pageId: 'page1', 
          parentId: 'panel1',
          props: { 
            x: 10, 
            y: 50, 
            width: 100, 
            height: 50 
          } as any 
        },
        { 
          id: 'child2', 
          type: ComponentType.BUTTON, 
          pageId: 'page1', 
          parentId: 'panel1',
          props: { 
            x: 120, 
            y: 50, 
            width: 100, 
            height: 50 
          } as any 
        }
      ]
    };

    const { result } = renderHook(() => useAppData(panelApp, onSave));

    // Verify initial horizontal layout
    let children = result.current.components.filter(c => c.parentId === 'panel1');
    expect(children.length).toBe(2);
    const [child1, child2] = children;
    // Children are side by side (same Y, different X)
    expect((child1.props as any).y).toBe((child2.props as any).y);
    expect((child2.props as any).x).toBeGreaterThan((child1.props as any).x);

    // Change direction to vertical and rearrange
    act(() => {
      result.current.updateComponent('panel1', { direction: 'vertical' } as any);
      result.current.arrangeContainerChildren('panel1', { direction: 'vertical' });
    });

    // Verify children are now stacked vertically
    children = result.current.components.filter(c => c.parentId === 'panel1');
    expect(children.length).toBe(2);
    const sortedChildren = [...children].sort((a, b) => (a.props as any).y - (b.props as any).y);
    const [topChild, bottomChild] = sortedChildren;
    
    // Children should be stacked (same X, different Y)
    expect((topChild.props as any).x).toBe((bottomChild.props as any).x);
    expect((bottomChild.props as any).y).toBeGreaterThan((topChild.props as any).y);
    
    // Verify children are properly positioned within panel bounds
    expect((topChild.props as any).x).toBeGreaterThanOrEqual(0);
    expect((topChild.props as any).y).toBeGreaterThanOrEqual(0);
    expect((bottomChild.props as any).x + (bottomChild.props as any).width).toBeLessThanOrEqual(300);
    expect((bottomChild.props as any).y + (bottomChild.props as any).height).toBeLessThanOrEqual(200);
  });

  it('should rearrange children when switching from vertical to horizontal', () => {
    // Create a panel with existing children already positioned vertically
    const panelApp = { 
      ...mockAppDef, 
      components: [
        { 
          id: 'panel1', 
          type: ComponentType.PANEL, 
          pageId: 'page1', 
          props: { 
            x: 0, 
            y: 0, 
            width: 300, 
            height: 200, 
            direction: 'vertical' 
          } as any 
        },
        // Two children positioned vertically (stacked)
        { 
          id: 'child1', 
          type: ComponentType.BUTTON, 
          pageId: 'page1', 
          parentId: 'panel1',
          props: { 
            x: 100, 
            y: 10, 
            width: 100, 
            height: 50 
          } as any 
        },
        { 
          id: 'child2', 
          type: ComponentType.BUTTON, 
          pageId: 'page1', 
          parentId: 'panel1',
          props: { 
            x: 100, 
            y: 70, 
            width: 100, 
            height: 50 
          } as any 
        }
      ]
    };

    const { result } = renderHook(() => useAppData(panelApp, onSave));

    // Verify initial vertical layout
    let children = result.current.components.filter(c => c.parentId === 'panel1');
    expect(children.length).toBe(2);
    const [child1, child2] = children;
    // Children are stacked (same X, different Y)
    expect((child1.props as any).x).toBe((child2.props as any).x);
    expect((child2.props as any).y).toBeGreaterThan((child1.props as any).y);

    // Change direction to horizontal and rearrange
    act(() => {
      result.current.updateComponent('panel1', { direction: 'horizontal' } as any);
      result.current.arrangeContainerChildren('panel1', { direction: 'horizontal' });
    });

    // Verify children are now side by side
    children = result.current.components.filter(c => c.parentId === 'panel1');
    expect(children.length).toBe(2);
    const sortedChildren = [...children].sort((a, b) => (a.props as any).x - (b.props as any).x);
    const [leftChild, rightChild] = sortedChildren;
    
    // Children should be side by side (same Y, different X)
    expect((leftChild.props as any).y).toBe((rightChild.props as any).y);
    expect((rightChild.props as any).x).toBeGreaterThan((leftChild.props as any).x);
    
    // Verify children are properly positioned within panel bounds
    expect((leftChild.props as any).x).toBeGreaterThanOrEqual(0);
    expect((leftChild.props as any).y).toBeGreaterThanOrEqual(0);
    expect((rightChild.props as any).x + (rightChild.props as any).width).toBeLessThanOrEqual(300);
    expect((rightChild.props as any).y + (rightChild.props as any).height).toBeLessThanOrEqual(200);
  });
});