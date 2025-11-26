

import React, { useEffect, useRef } from 'react';
import { ComponentType, TextareaProps, ComponentPlugin, InputActionType } from '../../types';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';
import { handleChangeEvent, handleFocusEvent, handleBlurEvent, handleEnterKeyPressEvent } from './event-handlers';
import { EventsGroupRenderer } from './EventsGroupRenderer';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TextareaRenderer: React.FC<{
  component: { props: TextareaProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const isHandlingFocusRef = useRef<boolean>(false);
  const lastFocusActionTimeRef = useRef<number>(0);
  const lastBlurTimeRef = useRef<number>(0);
  const isHandlingBlurRef = useRef<boolean>(false);
  const lastBlurActionTimeRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const focusBlurCycleRef = useRef<{ focusTime: number; blurTime: number | null } | null>(null);
  const p = component.props;
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
  
  const style: React.CSSProperties = {
    borderRadius: useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px'),
    borderColor: useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    textAlign: p.textAlign || 'left', // Apply textAlign property
    // In edit mode, if disabled, allow pointer events to pass through to wrapper for selection
    pointerEvents: (mode === 'edit' && isDisabled ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
  };
  // Evaluate defaultValue - always call hook unconditionally (React hooks rule)
  // Supports both static values and expressions
  const evaluatedDefaultValue = useJavaScriptRenderer(p.defaultValue || '', evaluationScope, '');
  
  // Get value from dataStore - try both direct key access and dot notation
  let dataStoreValue = dataStore[p.dataStoreKey];
  if (dataStoreValue === undefined) {
    // Try dot notation for nested paths like 'user.name'
    dataStoreValue = get(dataStore, p.dataStoreKey, undefined);
  }
  
  // Check if dataStore has a value (undefined means key doesn't exist, empty string means user cleared it)
  const hasDataStoreValue = dataStoreValue !== undefined;
  
  // Initialize dataStore with defaultValue if key doesn't exist and defaultValue is provided
  useEffect(() => {
    if (!hasDataStoreValue && p.defaultValue && onUpdateDataStore) {
      // Only initialize if defaultValue evaluates to a non-empty value
      const initValue = evaluatedDefaultValue;
      if (initValue !== undefined && initValue !== null && initValue !== '') {
        onUpdateDataStore(p.dataStoreKey, initValue);
      }
    }
  }, [hasDataStoreValue, p.defaultValue, p.dataStoreKey, evaluatedDefaultValue, onUpdateDataStore]);
  
  // Use dataStore value if key exists (even if empty), otherwise use evaluated defaultValue for display
  // Once dataStore is initialized, it will have the value and we'll use that
  const currentValue = hasDataStoreValue ? (dataStoreValue ?? '') : (p.defaultValue ? evaluatedDefaultValue : '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Record click time to prevent focus/blur from firing during click
    // Note: For textarea, this is mainly for programmatic changes, but helps with consistency
    lastClickTimeRef.current = Date.now();
    
    handleChangeEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
        dataStoreKey: p.dataStoreKey,
      },
      e
    );
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
    
    handleFocusEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
        dataStoreKey: p.dataStoreKey,
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

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
    
    // Check if we just had a focus event - if blur happens immediately after focus, it might be a click cycle
    const timeSinceFocus = now - lastFocusTimeRef.current;
    if (timeSinceFocus < 50) {
      // Blur happened very quickly after focus, likely part of a click cycle
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
        dataStoreKey: p.dataStoreKey,
      },
      e,
      {
        lastBlurTime: lastBlurTimeRef,
        lastBlurActionTime: lastBlurActionTimeRef,
        isHandlingBlur: isHandlingBlurRef,
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleEnterKeyPressEvent(
      p,
      {
        mode,
        evaluationScope,
        actions,
        onUpdateDataStore,
        dataStoreKey: p.dataStoreKey,
      },
      e
    );
  };
  
  return (
    <textarea
      ref={textareaRef}
      placeholder={p.placeholder}
      {...(onUpdateDataStore ? { defaultValue: currentValue } : { value: currentValue })}
      onChange={mode === 'preview' ? handleChange : (e) => onUpdateDataStore?.(p.dataStoreKey, e.target.value)}
      onFocus={mode === 'preview' ? handleFocus : undefined}
      onBlur={mode === 'preview' ? handleBlur : undefined}
      onKeyDown={mode === 'preview' ? handleKeyDown : undefined}
      style={style}
      className={`w-full h-full p-2 bg-white text-gray-900 focus:outline-none resize-none`}
      disabled={isDisabledInPreview}
      aria-disabled={isDisabledInPreview}
      aria-label={p.accessibilityLabel || p.placeholder}
    />
  );
};

const TextareaProperties: React.FC<{
  component: { id: string, props: TextareaProps };
  updateProp: (key: keyof TextareaProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const eventsGroup: PropertyGroup = {
    id: 'textarea-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'textarea-accessibility',
    title: 'Accessibility',
    order: 5,
    collapsible: true,
    defaultCollapsed: false,
    properties: [
      {
        key: 'accessibilityLabel',
        label: 'Accessibility Label',
        type: 'text',
        placeholder: 'A descriptive label for screen readers',
      },
    ],
  };

  const config: PropertyConfig = {
    baseGroups: ['basic', 'container-layout', 'layout-position', 'color-typography', 'input-value', 'styling'],
    customGroups: [eventsGroup, accessibilityGroup],
  };

  return (
    <BasePropertiesRenderer
      component={{ ...component, type: ComponentType.TEXTAREA }}
      updateProp={(key: string, value: any) => updateProp(key as keyof TextareaProps, value)}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const TextareaPlugin: ComponentPlugin = {
  type: ComponentType.TEXTAREA,
  paletteConfig: {
    label: 'Textarea',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 6H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 10H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 14H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }), React.createElement('path', { d: "M4 18H15", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Enter long text...',
      dataStoreKey: 'newTextarea',
      accessibilityLabel: 'Text area for long text',
      width: 250,
      height: 100,
      disabled: false,
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: TextareaRenderer,
  properties: TextareaProperties,
};