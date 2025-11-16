

import React, { useState, useEffect, useRef } from 'react';
import { BorderProps, ComponentProps } from '../../types';

export const PropFxInput: React.FC<{ 
    label: string; 
    value: any; 
    onChange: (val: any) => void; 
    type?: string; 
    placeholder?: string; 
    id?: string;
    onOpenEditor?: (currentValue: string) => void;
}> = ({ label, value, onChange, type = 'text', placeholder, id, onOpenEditor }) => {
    const isExpression = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    const [isFxMode, setIsFxMode] = useState(isExpression);

    useEffect(() => {
        // Sync with external changes (e.g., from AI generation)
        const isExpr = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
        setIsFxMode(isExpr);
    }, [value]);

    const handleToggleFx = () => {
        if (isFxMode) {
            // Switching from Fx to normal: try to clean up
            const cleanValue = value.replace(/^\{\{|\}\}$/g, '').trim();
            onChange(cleanValue);
        } else {
            // Switching from normal to Fx
            onChange(`{{${value}}}`);
        }
        setIsFxMode(!isFxMode);
    };

    return (
         <div className="mb-3" data-testid={`prop-fx-input-${label.replace(/\s+/g, '-')}`}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="flex items-center">
                <input
                    type={isFxMode ? 'text' : type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-l-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={placeholder}
                />
                <button 
                    onClick={handleToggleFx} 
                    className={`px-2 py-2 border-t border-b border-l ${isFxMode ? 'bg-blue-100 text-blue-700 border-blue-500' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'} ${!(onOpenEditor && isFxMode) ? 'border-r rounded-r-md' : ''}`}
                    title="Toggle JavaScript Expression"
                >
                    <span className="font-mono text-xs font-bold">fx</span>
                </button>
                {onOpenEditor && isFxMode && (
                    <button
                        onClick={() => onOpenEditor(value)}
                        className="p-2 border-t border-b border-r rounded-r-md bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                        title="Open Expression Editor"
                        aria-label="Open Expression Editor"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v-4h-4" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};


export const PropInput: React.FC<{ label: string; value: any; onChange: (val: any) => void; type?: string; placeholder?: string; step?: number; min?: number; max?: number; id?: string; }> = ({ label, value, onChange, type = 'text', placeholder, id, ...rest }) => {
    const inputId = id || `prop-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="mb-3" data-testid={`prop-input-${label.replace(/\s+/g, '-')}`}>
            <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input
            id={inputId}
            type={type}
            value={value}
            onChange={e => onChange(type === 'number' || type === 'range' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            {...rest}
            />
        </div>
    );
}

export const PropSelect: React.FC<{ label: string; value: any; onChange: (val: any) => void; options: {value: string; label: string}[]; id?: string; }> = ({ label, value, onChange, options, id }) => {
    const selectId = id || `prop-select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="mb-3">
            <label htmlFor={selectId} className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <select
            id={selectId}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

export const InlineTextEditor: React.FC<{
  value: string;
  onCommit: (newValue: string) => void;
  style: React.CSSProperties;
}> = ({ value, onCommit, style }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, []);

  const handleBlur = () => {
    onCommit(currentValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onCommit(currentValue);
    }
    if (e.key === 'Escape') {
      onCommit(value);
    }
  };

  const handleEventBubble = (e: React.MouseEvent | React.FocusEvent) => {
      e.stopPropagation();
  }

  return (
    <textarea
      ref={inputRef}
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleEventBubble}
      onMouseDown={handleEventBubble}
      onDoubleClick={handleEventBubble}
      style={{
          ...style,
          width: '100%',
          height: '100%',
          padding: 0,
          margin: 0,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          resize: 'none',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap'
      }}
    />
  );
};

export const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode, isOpenDefault?: boolean }> = ({ title, children, isOpenDefault = true }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);
    const sectionId = `section-content-${title.replace(/\s+/g, '-')}`;

    return (
        <div className="border-b border-gray-200 py-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left font-semibold text-gray-700 text-sm hover:bg-gray-50 p-1 rounded-md"
                aria-expanded={isOpen}
                aria-controls={sectionId}
            >
                <span>{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            {isOpen && <div id={sectionId} className="p-1 mt-2">{children}</div>}
        </div>
    );
};

// Common Property Sections
export const LayoutProps: React.FC<{ props: ComponentProps; updateProp: (key: string, value: any) => void; }> = ({ props, updateProp }) => (
    <CollapsibleSection title="Layout">
      <div className="grid grid-cols-2 gap-2">
        <PropInput label="X" value={props.x} onChange={val => updateProp('x', val)} type="number" />
        <PropInput label="Y" value={props.y} onChange={val => updateProp('y', val)} type="number" />
        <PropInput label="Width" value={props.width} onChange={val => updateProp('width', val)} type="number" />
        <PropInput label="Height" value={props.height} onChange={val => updateProp('height', val)} type="number" />
      </div>
    </CollapsibleSection>
);

export const StylingProps: React.FC<{ 
    props: ComponentProps; 
    updateProp: (key: string, value: any) => void;
    onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ props, updateProp, onOpenExpressionEditor }) => {
    const borderProps = props as BorderProps;
    return (
    <CollapsibleSection title="Styling">
        <PropFxInput label={`Opacity`} value={props.opacity} onChange={val => updateProp('opacity', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('opacity', newVal))} />
        <PropFxInput label="Shadow" value={props.boxShadow} onChange={val => updateProp('boxShadow', val)} placeholder="e.g. 2px 2px 5px #ccc" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('boxShadow', newVal))} />
        {borderProps.borderStyle !== undefined && <>
             <PropFxInput label="Border Radius" value={borderProps.borderRadius} onChange={val => updateProp('borderRadius', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderRadius', newVal))} />
             <div className="grid grid-cols-2 gap-2">
                <PropFxInput label="Border Width" value={borderProps.borderWidth} onChange={val => updateProp('borderWidth', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderWidth', newVal))} />
                <PropSelect label="Style" value={borderProps.borderStyle} onChange={val => updateProp('borderStyle', val)} options={[{value: 'none', label:'None'}, {value: 'solid', label: 'Solid'}, {value: 'dashed', label: 'Dashed'}, {value: 'dotted', label: 'Dotted'}]} />
             </div>
             <PropFxInput label="Border Color" value={borderProps.borderColor} onChange={val => updateProp('borderColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderColor', newVal))} />
        </>}
    </CollapsibleSection>
  )};

export const StateProps: React.FC<{ 
    props: ComponentProps & {id?: string}; 
    updateProp: (key: string, value: any) => void;
    onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ props, updateProp, onOpenExpressionEditor }) => {
    return (
    <CollapsibleSection title="State">
        <PropFxInput label="Disabled" value={props.disabled} onChange={val => updateProp('disabled', val)} placeholder="e.g. {{Table1.selectedRecord == null}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('disabled', newVal))} />
        <PropFxInput label="Hidden" value={props.hidden} onChange={val => updateProp('hidden', val)} placeholder="e.g. {{!showAlert}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('hidden', newVal))} />
    </CollapsibleSection>
)};