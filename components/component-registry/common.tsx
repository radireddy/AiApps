
import React, { useState, useEffect, useRef } from 'react';
import { BorderProps, ComponentProps } from '../../types';
import { typography } from '../../constants';

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

    const inputId = id || `prop-fx-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
         <div className="mb-2.5" data-testid={`prop-fx-input-${label.replace(/\s+/g, '-')}`}>
            <label htmlFor={inputId} className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
            <div className="flex items-center">
                <input
                    id={inputId}
                    type={isExpression ? 'text' : type}
                    {...(onChange ? { defaultValue: type === 'color' && typeof value === 'string' ? value.toUpperCase() : value } : { value: type === 'color' && typeof value === 'string' ? value.toUpperCase() : value })}
                    onChange={e => onChange(type === 'number' || type === 'range' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                    className={`flex-1 bg-white border border-gray-300 px-2 py-1 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7 ${isExpression ? 'rounded-l-md border-r-0' : 'rounded-md'} ${isExpression && onOpenEditor ? '' : ''}`}
                    placeholder={placeholder}
                />
                {isExpression && onOpenEditor && (
                    <button
                        onClick={() => onOpenEditor(value)}
                        className="p-1 border-t border-b border-r rounded-r-md bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100 h-7 flex items-center justify-center"
                        title="Open Expression Editor"
                        aria-label="Open Expression Editor"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="mb-2.5" data-testid={`prop-input-${label.replace(/\s+/g, '-')}`}>
            <label htmlFor={inputId} className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
            <input
            id={inputId}
            type={type}
            {...(onChange ? { defaultValue: value } : { value })}
            onChange={e => onChange(type === 'number' || type === 'range' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7"
            placeholder={placeholder}
            {...rest}
            />
        </div>
    );
}

export const PropSelect: React.FC<{ label: string; value: any; onChange: (val: any) => void; options: {value: string; label: string}[]; id?: string; }> = ({ label, value, onChange, options, id }) => {
    const selectId = id || `prop-select-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="mb-2.5">
            <label htmlFor={selectId} className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
            <select
            id={selectId}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-[11px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7"
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

export const PropertyGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    return (
        <div className="border-t border-gray-200 first:border-t-0">
            <div className="px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{title}</p>
                <div className="space-y-2.5">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode, isOpenDefault?: boolean }> = ({ title, children, isOpenDefault = true }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);
    const sectionId = `section-content-${title.replace(/\s+/g, '-')}`;

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left font-medium text-gray-700 text-[10px] hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                aria-expanded={isOpen}
                aria-controls={sectionId}
            >
                <span className="uppercase tracking-wide">{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform text-gray-400 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            {isOpen && <div id={sectionId} className="px-3 pb-2.5 pt-1">{children}</div>}
        </div>
    );
};

// Common Property Sections
export const LayoutProps: React.FC<{ props: ComponentProps; updateProp: (key: string, value: any) => void; }> = ({ props, updateProp }) => (
    <PropertyGroup title="Layout">
      <div className="grid grid-cols-2 gap-2.5">
        <PropInput label="X" value={props.x} onChange={val => updateProp('x', val)} type="number" />
        <PropInput label="Y" value={props.y} onChange={val => updateProp('y', val)} type="number" />
        <PropInput label="Width" value={props.width} onChange={val => updateProp('width', val)} type="number" />
        <PropInput label="Height" value={props.height} onChange={val => updateProp('height', val)} type="number" />
      </div>
    </PropertyGroup>
);

export const StylingProps: React.FC<{ 
    props: ComponentProps; 
    updateProp: (key: string, value: any) => void;
    onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ props, updateProp, onOpenExpressionEditor }) => {
    const borderProps = props as BorderProps;
    return (
    <PropertyGroup title="Styling">
        <PropFxInput label={`Opacity`} value={props.opacity} onChange={val => updateProp('opacity', val)} onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('opacity', newVal))} />
        <PropFxInput label="Shadow" value={props.boxShadow} onChange={val => updateProp('boxShadow', val)} placeholder="e.g. 2px 2px 5px #ccc" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('boxShadow', newVal))} />
        {borderProps.borderStyle !== undefined && <>
             <PropFxInput label="Border Radius" value={borderProps.borderRadius} onChange={val => updateProp('borderRadius', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderRadius', newVal))} />
             <div className="grid grid-cols-2 gap-2.5">
                <PropFxInput label="Border Width" value={borderProps.borderWidth} onChange={val => updateProp('borderWidth', val)} type="number" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderWidth', newVal))} />
                <PropSelect label="Style" value={borderProps.borderStyle} onChange={val => updateProp('borderStyle', val)} options={[{value: 'none', label:'None'}, {value: 'solid', label: 'Solid'}, {value: 'dashed', label: 'Dashed'}, {value: 'dotted', label: 'Dotted'}]} />
             </div>
             <PropFxInput label="Border Color" value={borderProps.borderColor} onChange={val => updateProp('borderColor', val)} type="color" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('borderColor', newVal))} />
        </>}
    </PropertyGroup>
  )};

export const StateProps: React.FC<{ 
    props: ComponentProps & {id?: string}; 
    updateProp: (key: string, value: any) => void;
    onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ props, updateProp, onOpenExpressionEditor }) => {
    return (
    <PropertyGroup title="State">
        <PropFxInput label="Disabled" value={props.disabled} onChange={val => updateProp('disabled', val)} placeholder="e.g. {{Table1.selectedRecord == null}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('disabled', newVal))} />
        <PropFxInput label="Hidden" value={props.hidden} onChange={val => updateProp('hidden', val)} placeholder="e.g. {{!showAlert}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('hidden', newVal))} />
    </PropertyGroup>
)};

export const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (!containerRef.current || !tooltipRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipWidth = 120; // Shorter tooltips
    const padding = 8;
    
    // Calculate available space
    const spaceLeft = containerRect.left;
    const spaceRight = window.innerWidth - containerRect.right;
    
    let adjustedLeft = '50%';
    let transform = 'translateX(-50%)';
    
    // If tooltip would overflow left, align to left edge
    if (spaceLeft < tooltipWidth / 2 + padding) {
      adjustedLeft = '0';
      transform = 'translateX(0)';
    }
    // If tooltip would overflow right, align to right edge
    else if (spaceRight < tooltipWidth / 2 + padding) {
      adjustedLeft = '100%';
      transform = 'translateX(-100%)';
    }
    
    setTooltipStyle({
      left: adjustedLeft,
      transform,
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative group flex items-center justify-center" 
      onMouseEnter={handleMouseEnter}
    >
      {children}
      {mounted && (
        <div 
          ref={tooltipRef}
          className="absolute bottom-full mb-2 w-auto max-w-[120px] px-2 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] whitespace-nowrap text-center"
          style={{ 
            ...tooltipStyle,
            position: 'absolute',
            willChange: 'opacity'
          }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};
