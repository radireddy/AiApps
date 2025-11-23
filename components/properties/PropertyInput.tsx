import React, { useState, useEffect } from 'react';
import { PropertyMetadata, PropertyContext } from './metadata';
import { ComponentProps } from '../../types';

export interface PropertyInputProps {
  metadata: PropertyMetadata;
  value: any;
  onChange: (value: any) => void;
  context: PropertyContext;
  onOpenExpressionEditor?: (initialValue: string, onSave: (newValue: string) => void) => void;
  error?: string;
  isMixed?: boolean; // True when multiple components have different values
}

/**
 * Base property input component that renders based on metadata type
 */
export const PropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed = false,
}) => {
  // Use custom renderer if provided
  if (metadata.customRenderer) {
    const CustomRenderer = metadata.customRenderer;
    return (
      <CustomRenderer
        metadata={metadata}
        value={value}
        onChange={onChange}
        context={context}
        onOpenExpressionEditor={onOpenExpressionEditor}
        error={error}
        isMixed={isMixed}
      />
    );
  }

  // Render based on type
  switch (metadata.type) {
    case 'string':
      return (
        <StringPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'number':
      return (
        <NumberPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'boolean':
      return (
        <BooleanPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'color':
      return (
        <ColorPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'dropdown':
      return (
        <DropdownPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'expression':
      return (
        <ExpressionPropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          onOpenExpressionEditor={onOpenExpressionEditor}
          error={error}
          isMixed={isMixed}
        />
      );
    case 'composite':
      return (
        <CompositePropertyInput
          metadata={metadata}
          value={value}
          onChange={onChange}
          context={context}
          error={error}
          isMixed={isMixed}
        />
      );
    default:
      return (
        <div className="text-red-500 text-xs">
          Unsupported property type: {metadata.type}
        </div>
      );
  }
};

/**
 * String input with optional expression support
 */
const StringPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const supportsExpression = metadata.supportsExpression ?? false;
  const isExpression = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
  const [isFxMode, setIsFxMode] = useState(isExpression);

  useEffect(() => {
    const isExpr = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    setIsFxMode(isExpr);
  }, [value]);

  const handleToggleFx = () => {
    if (isFxMode) {
      const cleanValue = value.replace(/^\{\{|\}\}$/g, '').trim();
      onChange(cleanValue);
    } else {
      onChange(`{{${value}}}`);
    }
    setIsFxMode(!isFxMode);
  };

  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '— Mixed —' : (value ?? '');

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="flex items-center">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-l-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isMixed ? 'italic text-gray-400' : ''}`}
          placeholder={metadata.placeholder}
          disabled={isMixed}
        />
        {supportsExpression && (
          <>
            <button
              onClick={handleToggleFx}
              className={`px-2 py-2 border-t border-b border-l ${
                isFxMode
                  ? 'bg-blue-100 text-blue-700 border-blue-500'
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              } ${!(onOpenExpressionEditor && isFxMode) ? 'border-r rounded-r-md' : ''}`}
              title="Toggle JavaScript Expression"
            >
              <span className="font-mono text-xs font-bold">fx</span>
            </button>
            {onOpenExpressionEditor && isFxMode && (
              <button
                onClick={() => onOpenExpressionEditor(value, onChange)}
                className="p-2 border-t border-b border-r rounded-r-md bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                title="Open Expression Editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Number input
 */
const NumberPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '— Mixed —' : (value ?? metadata.defaultValue ?? 0);

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <input
        id={inputId}
        type="number"
        value={displayValue}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-gray-50 border rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isMixed ? 'italic text-gray-400' : ''}`}
        placeholder={metadata.placeholder}
        disabled={isMixed}
      />
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Boolean toggle input
 */
const BooleanPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  const isChecked = isMixed ? false : (value ?? metadata.defaultValue ?? false);

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="flex items-center">
        <input
          id={inputId}
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          className="mr-2"
          disabled={isMixed}
        />
        <span className="text-xs font-medium text-gray-700">
          {metadata.label}
          {metadata.tooltip && (
            <span className="ml-1 text-gray-400" title={metadata.tooltip}>
              ℹ️
            </span>
          )}
        </span>
      </label>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Color picker input with expression support
 */
const ColorPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const supportsExpression = metadata.supportsExpression ?? false;
  const isExpression = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
  const [isFxMode, setIsFxMode] = useState(isExpression);

  useEffect(() => {
    const isExpr = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    setIsFxMode(isExpr);
  }, [value]);

  const handleToggleFx = () => {
    if (isFxMode) {
      const cleanValue = value.replace(/^\{\{|\}\}$/g, '').trim();
      onChange(cleanValue);
    } else {
      onChange(`{{${value}}}`);
    }
    setIsFxMode(!isFxMode);
  };

  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '#000000' : (value ?? '#000000');

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="flex items-center">
        <input
          id={inputId}
          type={isFxMode ? 'text' : 'color'}
          value={typeof displayValue === 'string' ? displayValue.toUpperCase() : displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-l-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isMixed}
        />
        {supportsExpression && (
          <>
            <button
              onClick={handleToggleFx}
              className={`px-2 py-2 border-t border-b border-l ${
                isFxMode
                  ? 'bg-blue-100 text-blue-700 border-blue-500'
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              } ${!(onOpenExpressionEditor && isFxMode) ? 'border-r rounded-r-md' : ''}`}
              title="Toggle JavaScript Expression"
            >
              <span className="font-mono text-xs font-bold">fx</span>
            </button>
            {onOpenExpressionEditor && isFxMode && (
              <button
                onClick={() => onOpenExpressionEditor(value, onChange)}
                className="p-2 border-t border-b border-r rounded-r-md bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                title="Open Expression Editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Dropdown/select input
 */
const DropdownPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  let options: Array<{ value: string; label: string }> = [];

  if (metadata.options) {
    if (typeof metadata.options === 'function') {
      options = metadata.options(context);
    } else {
      options = metadata.options;
    }
  }

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <select
        id={inputId}
        value={isMixed ? '' : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-gray-50 border rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isMixed ? 'italic text-gray-400' : ''}`}
        disabled={isMixed}
      >
        {isMixed && <option value="">— Mixed —</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Expression input (always supports expressions)
 */
const ExpressionPropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  onOpenExpressionEditor,
  error,
  isMixed,
}) => {
  const inputId = `prop-${metadata.id}`;
  const displayValue = isMixed ? '— Mixed —' : (value ?? '');

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="flex items-center">
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-l-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isMixed ? 'italic text-gray-400' : ''}`}
          placeholder={metadata.placeholder || '{{ expression }}'}
          disabled={isMixed}
        />
        {onOpenExpressionEditor && (
          <button
            onClick={() => onOpenExpressionEditor(value || '', onChange)}
            className="p-2 border-t border-b border-r rounded-r-md bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
            title="Open Expression Editor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
            </svg>
          </button>
        )}
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

/**
 * Composite input (multi-field like padding)
 */
const CompositePropertyInput: React.FC<PropertyInputProps> = ({
  metadata,
  value,
  onChange,
  context,
  error,
  isMixed,
}) => {
  if (!metadata.compositeFields) {
    return <div className="text-red-500 text-xs">Composite property missing field definitions</div>;
  }

  const compositeValue = value || {};
  const handleFieldChange = (fieldId: string, fieldValue: any) => {
    onChange({ ...compositeValue, [fieldId]: fieldValue });
  };

  return (
    <div className="mb-3" data-testid={`prop-input-${metadata.id}`}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {metadata.label}
        {metadata.tooltip && (
          <span className="ml-1 text-gray-400" title={metadata.tooltip}>
            ℹ️
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {metadata.compositeFields.map((field) => (
          <div key={field.id}>
            <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
            <input
              type={field.type}
              value={isMixed ? '—' : (compositeValue[field.id] ?? field.defaultValue ?? '')}
              onChange={(e) =>
                handleFieldChange(
                  field.id,
                  field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                )
              }
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={isMixed}
            />
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

