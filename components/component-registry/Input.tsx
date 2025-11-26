
import React, { useEffect, useState, useRef } from 'react';
import { ComponentType, InputProps, ComponentPlugin, InputActionType } from '../../types';
import { InlineTextEditor, buildSpacingStyles } from './common';
import { get } from '../../utils/data-helpers';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonStylingProps } from '../../constants';
import { BasePropertiesRenderer, PropertyGroup, PropertyConfig } from '../property-groups';
import { handleChangeEvent, handleFocusEvent, handleBlurEvent, handleEnterKeyPressEvent } from './event-handlers';
import { EventsGroupRenderer } from './EventsGroupRenderer';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const InputRenderer: React.FC<{
  component: { props: InputProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  isEditingInline?: boolean;
  onCommitInlineEdit?: (newValue: string) => void;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, isEditingInline, onCommitInlineEdit, actions }) => {
  const p = component.props;
  const [validationError, setValidationError] = useState<string>('');
  const [hasBlurred, setHasBlurred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const isHandlingFocusRef = useRef<boolean>(false);
  const lastFocusActionTimeRef = useRef<number>(0);

  // Evaluate disabled property
  const disabledValue = useJavaScriptRenderer(p.disabled, evaluationScope, false);
  const isDisabled = (() => {
    if (typeof disabledValue === 'string') {
      const lower = disabledValue.toLowerCase().trim();
      return lower === 'true' || lower === '1';
    }
    return !!disabledValue;
  })();
  const isDisabledInPreview = mode === 'preview' && isDisabled;

  // Evaluate styling properties
  const placeholder = useJavaScriptRenderer(p.placeholder, evaluationScope, '');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '4px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '1px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const opacityValue = useJavaScriptRenderer(p.opacity, evaluationScope, 1);
  const boxShadowValue = useJavaScriptRenderer(p.boxShadow, evaluationScope, '');
  const fontSize = useJavaScriptRenderer(p.fontSize, evaluationScope, 14);
  const fontFamily = useJavaScriptRenderer(p.fontFamily, evaluationScope, undefined);
  const fontWeight = p.fontWeight || 'normal';
  const fontStyle = p.fontStyle || 'normal';
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#111827');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#ffffff');
  const zIndex = p.zIndex;

  // Calculate final opacity
  const finalOpacity = isDisabled ? 0.6 : (typeof opacityValue === 'number' ? opacityValue : (typeof opacityValue === 'string' && opacityValue.trim() ? parseFloat(opacityValue) || 1 : 1));

  const paddingValue = useJavaScriptRenderer(p.padding, evaluationScope, undefined);
  const marginValue = useJavaScriptRenderer(p.margin, evaluationScope, undefined);
  
  // Build style object
  const style: React.CSSProperties = {
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: p.borderStyle || 'solid',
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    ...buildSpacingStyles(paddingValue, marginValue),
    padding: paddingValue !== undefined ? undefined : '0.5rem',
    boxSizing: 'border-box',
    backgroundColor,
    color,
    textAlign: p.textAlign || 'left',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontFamily: fontFamily || undefined,
    fontWeight,
    fontStyle,
    zIndex: zIndex !== undefined ? zIndex : undefined,
    pointerEvents: mode === 'edit' && isDisabled ? 'none' : 'auto',
    width: '100%',
    height: '100%',
  };

  // Handle inline editing in canvas mode
  if (mode === 'edit' && isEditingInline && onCommitInlineEdit) {
    return (
      <div style={style}>
        <InlineTextEditor
          value={p.placeholder}
          onCommit={onCommitInlineEdit}
          style={{
            color: '#9ca3af',
          }}
        />
      </div>
    );
  }

  // Evaluate defaultValue
  const evaluatedDefaultValue = useJavaScriptRenderer(p.defaultValue || '', evaluationScope, '');
  
  // Get value from dataStore or use value prop
  let dataStoreValue: any = undefined;
  if (p.dataStoreKey) {
    dataStoreValue = dataStore[p.dataStoreKey];
    if (dataStoreValue === undefined) {
      dataStoreValue = get(dataStore, p.dataStoreKey, undefined);
    }
  }
  
  // If value prop is provided, use it (supports expressions)
  const valueProp = useJavaScriptRenderer(p.value, evaluationScope, undefined);
  const hasValueProp = p.value !== undefined && p.value !== null && p.value !== '';
  
  const hasDataStoreValue = dataStoreValue !== undefined;
  
  // Initialize dataStore with defaultValue if key doesn't exist and defaultValue is provided
  useEffect(() => {
    if (!hasDataStoreValue && p.defaultValue && onUpdateDataStore && p.dataStoreKey) {
      const initValue = evaluatedDefaultValue;
      if (initValue !== undefined && initValue !== null && initValue !== '') {
        onUpdateDataStore(p.dataStoreKey, initValue);
      }
    }
  }, [hasDataStoreValue, p.defaultValue, p.dataStoreKey, evaluatedDefaultValue, onUpdateDataStore]);
  
  // Determine current value
  let currentValue: any = '';
  if (hasValueProp && valueProp !== undefined && valueProp !== null) {
    currentValue = valueProp;
  } else if (hasDataStoreValue) {
    currentValue = dataStoreValue ?? '';
  } else if (p.defaultValue) {
    currentValue = evaluatedDefaultValue;
  }

  // Evaluate validation-related expressions (hooks must be called unconditionally)
  const requiredValue = useJavaScriptRenderer(p.required, evaluationScope, false);
  const isRequired = (() => {
    if (typeof requiredValue === 'string') {
      const lower = requiredValue.toLowerCase().trim();
      return lower === 'true' || lower === '1';
    }
    return !!requiredValue;
  })();
  const errorMessageValue = useJavaScriptRenderer(p.errorMessage, evaluationScope, '');
  const minValue = useJavaScriptRenderer(p.min, evaluationScope, undefined);
  const maxValue = useJavaScriptRenderer(p.max, evaluationScope, undefined);

  // Validation logic
  const validateInput = (value: any): string => {
    const stringValue = String(value || '');
    
    // Required validation
    if (isRequired && (!stringValue || stringValue.trim() === '')) {
      return errorMessageValue || 'This field is required';
    }

    // Type-specific validation
    const inputType = p.inputType || 'text';
    
    if (inputType === 'number') {
      const numValue = parseFloat(stringValue);
      if (stringValue && isNaN(numValue)) {
        return 'Please enter a valid number';
      }
      
      // Min validation
      if (minValue !== undefined) {
        const minNum = typeof minValue === 'number' ? minValue : parseFloat(String(minValue || 0));
        if (!isNaN(minNum) && numValue < minNum) {
          return errorMessageValue || `Value must be at least ${minNum}`;
        }
      }
      
      // Max validation
      if (maxValue !== undefined) {
        const maxNum = typeof maxValue === 'number' ? maxValue : parseFloat(String(maxValue || 0));
        if (!isNaN(maxNum) && numValue > maxNum) {
          return errorMessageValue || `Value must be at most ${maxNum}`;
        }
      }
    }
    
    if (inputType === 'email' && stringValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return errorMessageValue || 'Please enter a valid email address';
      }
    }
    
    if (inputType === 'url' && stringValue) {
      try {
        new URL(stringValue);
      } catch {
        return errorMessageValue || 'Please enter a valid URL';
      }
    }
    
    // Regex pattern validation
    if (p.pattern && stringValue) {
      try {
        const regex = new RegExp(p.pattern);
        if (!regex.test(stringValue)) {
          return errorMessageValue || 'Value does not match the required pattern';
        }
      } catch (e) {
        // Invalid regex pattern - don't show error to user, just log
        console.warn('Invalid regex pattern:', p.pattern);
      }
    }
    
    return '';
  };

  // Handle value change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Validate in preview mode
    if (mode === 'preview' && hasBlurred) {
      const error = validateInput(newValue);
      setValidationError(error);
    }
    
    // Use shared event handler
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

  // Handle focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
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
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setHasBlurred(true);
    
    // Validate on blur
    if (mode === 'preview') {
      const error = validateInput(currentValue);
      setValidationError(error);
    }
    
    // Use shared event handler
    handleBlurEvent(
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

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Parse custom attributes
  const customAttrs: Record<string, any> = {};
  if (p.customAttributes) {
    try {
      const parsed = JSON.parse(p.customAttributes);
      Object.assign(customAttrs, parsed);
    } catch (e) {
      console.warn('Invalid customAttributes JSON:', p.customAttributes);
    }
  }

  // Build input props
  const inputType = p.inputType || 'text';
  const inputProps: any = {
    type: inputType,
    placeholder,
    disabled: isDisabledInPreview,
    'aria-disabled': isDisabledInPreview,
    'aria-label': p.accessibilityLabel || placeholder,
    'aria-invalid': validationError ? 'true' : undefined,
    'aria-describedby': validationError ? `${component.props.dataStoreKey || 'input'}-error` : undefined,
    style,
    className: p.className ? `${p.className} w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500` : 'w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500',
    ref: inputRef,
    ...customAttrs,
  };

  // Add validation attributes
  if (inputType === 'number') {
    const minValue = useJavaScriptRenderer(p.min, evaluationScope, undefined);
    const maxValue = useJavaScriptRenderer(p.max, evaluationScope, undefined);
    const stepValue = useJavaScriptRenderer(p.step, evaluationScope, undefined);
    
    if (minValue !== undefined) {
      inputProps.min = typeof minValue === 'number' ? minValue : parseFloat(String(minValue)) || undefined;
    }
    if (maxValue !== undefined) {
      inputProps.max = typeof maxValue === 'number' ? maxValue : parseFloat(String(maxValue)) || undefined;
    }
    if (stepValue !== undefined) {
      inputProps.step = typeof stepValue === 'number' ? stepValue : parseFloat(String(stepValue)) || undefined;
    }
  }

  if (p.maxLength !== undefined && p.maxLength > 0) {
    inputProps.maxLength = p.maxLength;
  }

  if (p.pattern) {
    inputProps.pattern = p.pattern;
  }

  if (p.required) {
    const requiredValue = useJavaScriptRenderer(p.required, evaluationScope, p.required);
    const isRequired = (() => {
      if (typeof requiredValue === 'string') {
        const lower = requiredValue.toLowerCase().trim();
        return lower === 'true' || lower === '1';
      }
      return !!requiredValue;
    })();
    inputProps.required = isRequired;
  }

  // In edit mode, prevent actual input interaction
  if (mode === 'edit') {
    inputProps.readOnly = true;
    inputProps.onChange = undefined;
    inputProps.onFocus = undefined;
    inputProps.onBlur = undefined;
    inputProps.onKeyDown = undefined;
  } else {
    inputProps.onChange = handleChange;
    inputProps.onFocus = handleFocus;
    inputProps.onBlur = handleBlur;
    inputProps.onKeyDown = handleKeyDown;
  }

  // Use controlled or uncontrolled value
  if (hasValueProp || hasDataStoreValue) {
    inputProps.value = currentValue;
  } else if (p.defaultValue) {
    inputProps.defaultValue = currentValue;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <input {...inputProps} />
      {mode === 'preview' && validationError && (
        <div
          id={`${p.dataStoreKey || 'input'}-error`}
          role="alert"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: 0,
            fontSize: '12px',
            color: '#dc2626',
            marginTop: '4px',
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  );
};

const InputProperties: React.FC<{
  component: { id: string, props: InputProps };
  updateProp: (key: keyof InputProps, value: any) => void;
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, onOpenExpressionEditor }) => {
  const eventsGroup: PropertyGroup = {
    id: 'input-events',
    title: 'Events',
    order: 4,
    collapsible: true,
    defaultCollapsed: false,
    customGroupRenderer: EventsGroupRenderer,
    properties: [],
  };

  const accessibilityGroup: PropertyGroup = {
    id: 'input-accessibility',
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
      component={{ ...component, type: ComponentType.INPUT }}
      updateProp={(key: string, value: any) => updateProp(key as keyof InputProps, value)}
      config={config}
      onOpenExpressionEditor={onOpenExpressionEditor}
    />
  );
};

export const InputPlugin: ComponentPlugin = {
  type: ComponentType.INPUT,
  paletteConfig: {
    label: 'Input',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('rect', { x: "4", y: "8", width: "16", height: "8", rx: "1", stroke: "currentColor", strokeWidth: "2" }), React.createElement('path', { d: "M9 12V12.01", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      ...commonStylingProps,
      placeholder: 'Enter text...',
      dataStoreKey: 'newInput',
      accessibilityLabel: 'Text input field',
      inputType: 'text',
      width: 200,
      height: 40,
      disabled: false,
      required: false,
      backgroundColor: '#ffffff',
      color: '#111827',
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: '#e5e7eb',
      borderRadius: '4px',
      onChangeActionType: 'none' as InputActionType,
      onFocusActionType: 'none' as InputActionType,
      onBlurActionType: 'none' as InputActionType,
      onEnterActionType: 'none' as InputActionType,
    },
  },
  renderer: InputRenderer,
  properties: InputProperties,
};
