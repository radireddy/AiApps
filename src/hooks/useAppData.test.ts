
// FIX: Import jest globals to resolve test-related type errors.
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from './useAppData';
import { AppDefinition, ComponentType, AppVariableType } from '../types';

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
  theme: {} as any,
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
    expect(result.current.selectedComponentId).toBeNull();
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
});