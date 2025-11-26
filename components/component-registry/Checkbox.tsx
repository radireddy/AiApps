

import React, { useState, useEffect, useRef } from 'react';
import { ComponentType, CheckboxProps, ComponentPlugin, InputActionType } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';
import { handleChangeEvent, handleFocusEvent, handleBlurEvent, handleEnterKeyPressEvent } from './event-handlers';
import { EventsGroupRenderer } from './EventsGroupRenderer';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const CheckboxRenderer: React.FC<{
  component: { id: string; props: CheckboxProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const checkboxRef = useRef<HTMLInputElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const isHandlingFocusRef = useRef<boolean>(false);
  const lastFocusActionTimeRef = useRef<number>(0);
  const lastBlurTimeRef = useRef<number>(0);
  const isHandlingBlurRef = useRef<boolean>(false);
  const lastBlurActionTimeRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const focusBlurCycleRef = useRef<{ focusTime: number; blurTime: number | null } | null>(null);
  
  // Evaluate disabled property - handle both boolean and string values correctly
  const disabledValue = useJavaScriptRenderer(p.disabled, evaluationScope, false);
  const isDisabled = (() => {
    if (typeof disabledValue === 'string') {
      const lower = disabledValue.toLowerCase().trim();
      return lower === 'true' || lower === '1';
    }
    return !!disabledValue;
  })();
  // In edit mode, allow interaction for selection; in preview mode, disable if needed
  const isDisabledInPreview = mode === 'preview' && isDisabled;
  // Evaluate opacity and boxShadow
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  // Calculate final opacity: use component opacity, but reduce if disabled
  const finalOpacity = isDisabled ? 0.6 : (typeof opacityValue === 'number' ? opacityValue : (typeof opacityValue === 'string' && opacityValue.trim() ? parseFloat(opacityValue) || 1 : 1));
  // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
  const pointerEventsStyle = mode === 'edit' && isDisabled ? { pointerEvents: 'none' as const } : {};
  
  // Evaluate defaultValue for checkbox
  const evaluatedDefaultValue = useJavaScriptRenderer(p.defaultValue, evaluationScope, false);
  const valueProp = useJavaScriptRenderer(p.value, evaluationScope, undefined);
  const hasValueProp = p.value !== undefined && p.value !== null && p.value !== '';
  
  // Use local state to track checkbox checked state
  // Check dataStore first (for persistence), then value prop, then defaultValue
  const [isChecked, setIsChecked] = useState<boolean>(() => {
    // First check if value exists in dataStore (from previous interactions)
    const storedValue = get(dataStore, component.id);
    if (storedValue !== undefined && storedValue !== null) {
      return !!storedValue;
    }
    // Then check value prop
    if (hasValueProp && valueProp !== undefined && valueProp !== null) {
      return !!valueProp;
    } else if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
      return !!evaluatedDefaultValue;
    }
    return false;
  });
  
  // Update local state when prop value changes
  // But only if there's no stored value in dataStore
  useEffect(() => {
    const storedValue = get(dataStore, component.id);
    if (storedValue === undefined || storedValue === null) {
      if (hasValueProp && valueProp !== undefined && valueProp !== null) {
        setIsChecked(!!valueProp);
      } else if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
        setIsChecked(!!evaluatedDefaultValue);
      }
    } else {
      // Use stored value from dataStore
      setIsChecked(!!storedValue);
    }
  }, [hasValueProp, valueProp, p.defaultValue, evaluatedDefaultValue, dataStore, component.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    
    // Update local state for interactivity
    if (mode === 'preview') {
      setIsChecked(newValue);
      // Also update dataStore using component ID as key
      if (onUpdateDataStore) {
        onUpdateDataStore(component.id, newValue);
      }
    }
    
    // Record click time to prevent focus/blur from firing during click
    lastClickTimeRef.current = Date.now();
    
    // Use shared event handler with custom event object for checkbox
    const customEvent = {
      ...e,
      target: { ...e.target, value: newValue, checked: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleChangeEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      customEvent,
      newValue
    );
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const now = Date.now();
    
    // Ignore focus events that occur within 300ms of a click (click-related focus)
    if (now - lastClickTimeRef.current < 300) {
      // Track this as part of a potential focus/blur cycle
      if (!focusBlurCycleRef.current) {
        focusBlurCycleRef.current = { focusTime: now, blurTime: null };
      }
      return;
    }
    
    // Check if this is part of a focus/blur cycle (focus -> blur -> focus within short time)
    if (focusBlurCycleRef.current) {
      const cycle = focusBlurCycleRef.current;
      const timeSinceCycleStart = now - cycle.focusTime;
      
      // If we had a blur in this cycle and focus is happening again quickly, it's a cycle
      if (cycle.blurTime !== null && timeSinceCycleStart < 200) {
        // This is part of a focus/blur cycle, ignore it
        focusBlurCycleRef.current = null; // Reset cycle
        return;
      }
      
      // If focus happens again after a cycle started but no blur yet, reset
      if (timeSinceCycleStart > 200) {
        focusBlurCycleRef.current = null;
      }
    }
    
    // Check if this focus is coming from the label (relatedTarget might be the label)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && relatedTarget.tagName === 'LABEL' && relatedTarget.htmlFor === component.id) {
      // This is a focus from label click - check if we just had a blur
      const timeSinceBlur = now - lastBlurTimeRef.current;
      if (timeSinceBlur < 100) {
        // This is part of a label click cycle, ignore it
        return;
      }
    }
    
    handleFocusEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      e,
      {
        lastFocusTime: lastFocusTimeRef,
        lastFocusActionTime: lastFocusActionTimeRef,
        isHandlingFocus: isHandlingFocusRef,
      }
    );
    
    // Reset cycle tracking after successful focus
    focusBlurCycleRef.current = null;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const now = Date.now();
    
    // Ignore blur events that occur within 300ms of a click (click-related blur)
    if (now - lastClickTimeRef.current < 300) {
      // Track this as part of a potential focus/blur cycle
      if (focusBlurCycleRef.current) {
        focusBlurCycleRef.current.blurTime = now;
      } else {
        focusBlurCycleRef.current = { focusTime: lastFocusTimeRef.current || now, blurTime: now };
      }
      return;
    }
    
    // Check if blur is going to the label - if so, ignore it as it's part of label click cycle
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && relatedTarget.tagName === 'LABEL' && relatedTarget.htmlFor === component.id) {
      // Blur is going to the label, this is part of a label click cycle - ignore it
      return;
    }
    
    // Check if we just had a focus event - if blur happens immediately after focus, it might be a label click cycle
    const timeSinceFocus = now - lastFocusTimeRef.current;
    if (timeSinceFocus < 50) {
      // Blur happened very quickly after focus, likely part of a label click cycle
      // Track this as a cycle
      if (!focusBlurCycleRef.current) {
        focusBlurCycleRef.current = { focusTime: lastFocusTimeRef.current, blurTime: now };
      } else {
        focusBlurCycleRef.current.blurTime = now;
      }
      return;
    }
    
    handleBlurEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      e,
      {
        lastBlurTime: lastBlurTimeRef,
        lastBlurActionTime: lastBlurActionTimeRef,
        isHandlingBlur: isHandlingBlurRef,
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleEnterKeyPressEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
      },
      e
    );
  };
  
  return (
    <div className="flex items-center w-full h-full" style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}>
      <input
        type="checkbox"
        id={component.id}
        ref={checkboxRef}
        checked={isChecked}
        onChange={handleChange}
        onFocus={mode === 'preview' ? handleFocus : undefined}
        onBlur={mode === 'preview' ? handleBlur : undefined}
        onKeyDown={mode === 'preview' ? handleKeyDown : undefined}
        className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
        disabled={isDisabledInPreview}
        aria-disabled={isDisabledInPreview}
      />
      <label htmlFor={component.id} className={`text-gray-800 ${isDisabledInPreview ? 'pointer-events-none' : ''} ${isDisabled ? 'opacity-60' : ''}`}>{p.label}</label>
    </div>
  );
};

const CheckboxProperties: React.FC<{
  component: { id: string, props: CheckboxProps };
  updateProp: (key: keyof CheckboxProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const eventsGroup: PropertyGroup = {
    id: 'checkbox-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'input-value'],
    customGroups: [eventsGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.CHECKBOX }}
      updateProp={(key: string, value: any) => updateProp(key as keyof CheckboxProps, value)}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const CheckboxPlugin: ComponentPlugin = {
  type: ComponentType.CHECKBOX,
  paletteConfig: {
    label: 'Checkbox',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M9 12L11 14L15 10", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), React.createElement('rect', { x: "4", y: "4", width: "16", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" })),
    defaultProps: {
      label: 'Accept terms',
      width: 150,
      height: 30,
      opacity: 1,
      boxShadow: '',
      disabled: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: CheckboxRenderer,
  properties: CheckboxProperties,
};