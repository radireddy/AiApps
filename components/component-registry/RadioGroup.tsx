

import React, { useState, useEffect, useRef } from 'react';
import { ComponentType, RadioGroupProps, ComponentPlugin, InputActionType } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';
import { handleChangeEvent, handleFocusEvent, handleBlurEvent, handleEnterKeyPressEvent } from './event-handlers';
import { EventsGroupRenderer } from './EventsGroupRenderer';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const RadioGroupRenderer: React.FC<{
  component: { id: string; props: RadioGroupProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const options = p.options.split(',').map(opt => opt.trim());
  const radioRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
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
  const groupLabelId = `${component.id}-group-label`;
  
  // Evaluate defaultValue for radio group
  const evaluatedDefaultValue = useJavaScriptRenderer(p.defaultValue || '', evaluationScope, '');
  const valueProp = useJavaScriptRenderer(p.value, evaluationScope, undefined);
  const hasValueProp = p.value !== undefined && p.value !== null && p.value !== '';
  
  // Use local state to track selected value
  // Check dataStore first (for persistence), then value prop, then defaultValue
  const [selectedValue, setSelectedValue] = useState<string>(() => {
    // First check if value exists in dataStore (from previous interactions)
    const storedValue = get(dataStore, component.id);
    if (storedValue !== undefined && storedValue !== null) {
      return String(storedValue);
    }
    // Then check value prop
    if (hasValueProp && valueProp !== undefined && valueProp !== null) {
      return String(valueProp);
    } else if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
      return String(evaluatedDefaultValue);
    }
    return '';
  });
  
  // Update local state when prop value changes
  // But only if there's no stored value in dataStore
  useEffect(() => {
    const storedValue = get(dataStore, component.id);
    if (storedValue === undefined || storedValue === null) {
      if (hasValueProp && valueProp !== undefined && valueProp !== null) {
        setSelectedValue(String(valueProp));
      } else if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
        setSelectedValue(String(evaluatedDefaultValue));
      }
    } else {
      // Use stored value from dataStore
      setSelectedValue(String(storedValue));
    }
  }, [hasValueProp, valueProp, p.defaultValue, evaluatedDefaultValue, dataStore, component.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Update local state for interactivity
    if (mode === 'preview') {
      setSelectedValue(newValue);
      // Also update dataStore using component ID as key
      if (onUpdateDataStore) {
        onUpdateDataStore(component.id, newValue);
      }
    }
    
    // Record click time to prevent focus/blur from firing during click
    lastClickTimeRef.current = Date.now();
    
    handleChangeEvent(
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
    if (relatedTarget && relatedTarget.tagName === 'LABEL') {
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
    if (relatedTarget && relatedTarget.tagName === 'LABEL') {
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
    <div 
        className="w-full h-full flex flex-col justify-center p-2"
        style={{ ...pointerEventsStyle, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }}
        role="radiogroup"
        aria-labelledby={groupLabelId}
        aria-disabled={isDisabledInPreview}
    >
      <span id={groupLabelId} className="sr-only">{p.groupLabel}</span>
      {options.map(option => (
        <div key={option} className="flex items-center mb-2">
            <input
            type="radio"
            id={`${component.id}-${option}`}
            name={component.id}
            value={option}
            checked={selectedValue === option}
            onChange={mode === 'preview' ? handleChange : () => {}}
            onFocus={mode === 'preview' ? handleFocus : undefined}
            onBlur={mode === 'preview' ? handleBlur : undefined}
            onKeyDown={mode === 'preview' ? handleKeyDown : undefined}
            ref={(el) => { radioRefs.current[option] = el; }}
            className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}
            disabled={isDisabledInPreview}
          />
          <label htmlFor={`${component.id}-${option}`} className={`text-gray-800 ${isDisabledInPreview ? 'pointer-events-none' : ''}`}>{option}</label>
        </div>
      ))}
    </div>
  );
};

const RadioGroupProperties: React.FC<{
  component: { id: string, props: RadioGroupProps };
  updateProp: (key: keyof RadioGroupProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const eventsGroup: PropertyGroup = {
    id: 'radiogroup-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'radiogroup-accessibility',
    title: 'Accessibility',
    order: 5,
    collapsible: true,
    defaultCollapsed: false,
    properties: [
      {
        key: 'groupLabel',
        label: 'Group Label',
        type: 'text',
        placeholder: 'A label for the whole group',
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'input-value', 'data'],
    customGroups: [eventsGroup, accessibilityGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.RADIO_GROUP }}
      updateProp={(key: string, value: any) => updateProp(key as keyof RadioGroupProps, value)}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const RadioGroupPlugin: ComponentPlugin = {
  type: ComponentType.RADIO_GROUP,
  paletteConfig: {
    label: 'Radio Group',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg"}, React.createElement('path', {d:"M12 16a4 4 0 100-8 4 4 0 000 8z", stroke:"currentColor", strokeWidth:"2"}), React.createElement('path', {d:"M12 4v2m0 12v2m8-10h-2M6 12H4", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round"})),
    defaultProps: {
      options: 'Option 1,Option 2',
      groupLabel: 'Choose an option',
      width: 150,
      height: 80,
      disabled: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: RadioGroupRenderer,
  properties: RadioGroupProperties,
};