
import React, { useState, useEffect, useRef } from 'react';
import { BorderProps, ComponentProps } from '../../types';
import { typography } from '../../constants';

// Helper function to format title - if already in Title Case, return as is; otherwise convert
const formatTitle = (title: string): string => {
  // If title already contains spaces and proper capitalization, return as is
  if (title.includes(' ') && title.split(' ').some(word => word[0] === word[0].toUpperCase())) {
    return title;
  }
  // Split camelCase into words
  const words = title.replace(/([A-Z])/g, ' $1').trim().split(' ');
  // Capitalize first letter of each word, lowercase the rest
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const PropFxInput: React.FC<{ 
    label: string; 
    value: any; 
    onChange: (val: any) => void; 
    type?: string; 
    placeholder?: string; 
    id?: string;
    onOpenEditor?: (currentValue: string) => void;
    propertyKey?: string;
    className?: string; // Allow custom className to override margin
}> = ({ label, value, onChange, type = 'text', placeholder, id, onOpenEditor, propertyKey, className }) => {
    // Check if value is an expression (starts with {{ and ends with }})
    // Also treat as expression if it starts with {{ (even if incomplete)
    // Handle undefined/null values safely
    const isExpression = typeof value === 'string' && 
                         value !== null && 
                         value !== undefined && 
                         value.startsWith('{{');
    const isOpacity = propertyKey === 'opacity';

    // Validation function for opacity
    const validateOpacityInput = (inputValue: string): boolean => {
        if (!inputValue) return true; // Allow empty
        // Allow expressions
        if (inputValue.startsWith('{{')) return true;
        // Allow numbers 0-1: matches 0, 0., 0.5, 0.75, 1, 1.0, etc.
        // Also allows partial input while typing (e.g., "0.", "1.")
        const opacityRegex = /^(0|0\.\d*|1|1\.0*)$/;
        return opacityRegex.test(inputValue);
    };

    // Handle opacity input validation
    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Allow empty, expressions, or valid opacity values
        if (!inputValue || inputValue.startsWith('{{') || validateOpacityInput(inputValue)) {
            // If it's a valid number, parse it; otherwise keep as string (for expressions or partial input)
            if (inputValue && !inputValue.startsWith('{{')) {
                const numValue = parseFloat(inputValue);
                // If it's a complete number (not partial like "0."), clamp it
                if (!isNaN(numValue) && !inputValue.endsWith('.')) {
                    // Clamp between 0 and 1
                    const clampedValue = Math.max(0, Math.min(1, numValue));
                    onChange(clampedValue);
                } else {
                    // Allow partial input while typing (e.g., "0.", "1.")
                    onChange(inputValue);
                }
            } else {
                onChange(inputValue);
            }
        }
        // If invalid, don't update (prevent invalid input)
    };

    // Handle keydown for opacity to prevent invalid characters
    const handleOpacityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpacity) return;
        
        const input = e.currentTarget;
        const currentValue = input.value;
        const selectionStart = input.selectionStart || 0;
        const selectionEnd = input.selectionEnd || 0;
        const isExpressionMode = currentValue.startsWith('{{');
        
        // Allow control keys, backspace, delete, arrow keys, etc.
        if (e.ctrlKey || e.metaKey || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Home', 'End'].includes(e.key)) {
            return;
        }
        
        // If in expression mode, allow all characters
        if (isExpressionMode || e.key === '{' || e.key === '}') {
            return;
        }
        
        // For opacity, only allow: digits 0-9, decimal point
        const allowedChars = /^[0-9.]$/;
        if (!allowedChars.test(e.key)) {
            e.preventDefault();
            return;
        }
        
        // Prevent multiple decimal points
        if (e.key === '.' && currentValue.includes('.')) {
            e.preventDefault();
            return;
        }
        
        // Check if the resulting value would be valid
        const newValue = currentValue.slice(0, selectionStart) + e.key + currentValue.slice(selectionEnd);
        if (newValue && !newValue.startsWith('{{') && !validateOpacityInput(newValue)) {
            e.preventDefault();
        }
    };

    const inputId = id || `prop-fx-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    // Only uppercase hex color values (e.g., #ff0000), not expressions
    // Handle undefined/null values safely
    const displayValue = (type === 'color' && 
                         typeof value === 'string' && 
                         value !== null && 
                         value !== undefined && 
                         !value.startsWith('{{') && 
                         value.startsWith('#')) 
                         ? value.toUpperCase() 
                         : (value ?? '');
    
    // Handle input change - allow typing {{ to start an expression
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        // If user types {{, automatically wrap it as an expression
        if (inputValue === '{{' && !isExpression) {
            onChange('{{}}');
            // Move cursor between the braces
            setTimeout(() => {
                const input = e.target;
                if (input) {
                    input.setSelectionRange(2, 2);
                }
            }, 0);
            return;
        }
        
        // If user is typing and starts with {{, treat as expression
        if (inputValue.startsWith('{{')) {
            onChange(inputValue);
            return;
        }
        
        // If user is removing expression braces, allow it (removes expression)
        // This allows users to delete {{ and }} to convert back to primitive
        if (isExpression && !inputValue.startsWith('{{')) {
            // User is removing the expression - extract the inner value
            const innerValue = inputValue.replace(/^{{/, '').replace(/}}$/, '');
            onChange(innerValue);
            return;
        }
        
        // Otherwise, handle normally
        if (isOpacity) {
            handleOpacityChange(e);
        } else {
            onChange(type === 'number' || type === 'range' ? (parseFloat(inputValue) || 0) : inputValue);
        }
    };
    
    // Handle opening expression editor - if not an expression, wrap current value
    const handleOpenEditor = () => {
        if (onOpenEditor) {
            const currentValue = isExpression ? String(value) : (value !== undefined && value !== null ? String(value) : '');
            onOpenEditor(currentValue);
        }
    };
    
    return (
         <div className={className || "mb-0"} data-testid={`prop-fx-input-${label.replace(/\s+/g, '-')}`}>
            <label htmlFor={inputId} className={`block ${typography.body} ${typography.medium} text-gray-600 mb-1.5`}>{label}</label>
            <div className="flex items-center">
                <input
                    id={inputId}
                    type={isExpression ? 'text' : type}
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleOpacityKeyDown}
                    className={`flex-1 bg-white border border-gray-300 px-2 py-1 ${typography.body} text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7 ${isExpression || onOpenEditor ? 'rounded-l-md border-r-0' : 'rounded-md'}`}
                    placeholder={placeholder}
                />
                {onOpenEditor && (
                    <button
                        onClick={handleOpenEditor}
                        className={`p-1 border-t border-b border-r rounded-r-md h-7 flex items-center justify-center ${
                            isExpression 
                                ? 'bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100' 
                                : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
                        }`}
                        title={isExpression ? "Edit Expression" : "Add Expression"}
                        aria-label={isExpression ? "Edit Expression" : "Add Expression"}
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
            <label htmlFor={inputId} className={`block ${typography.body} ${typography.medium} text-gray-600 mb-1`}>{label}</label>
            <input
            id={inputId}
            type={type}
            value={type === 'number' ? (value !== undefined && value !== null ? value : '') : (value ?? '')}
            onChange={e => onChange(type === 'number' || type === 'range' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className={`w-full bg-white border border-gray-300 rounded-md px-2 py-1 ${typography.body} text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7`}
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
            <label htmlFor={selectId} className={`block ${typography.body} ${typography.medium} text-gray-600 mb-1`}>{label}</label>
            <select
            id={selectId}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full bg-white border border-gray-300 rounded-md px-2 py-1 ${typography.body} text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-7`}
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
    const formattedTitle = formatTitle(title);
    return (
        <div className="border-t border-gray-200 first:border-t-0">
            <div className="px-3 py-2.5">
                <p className={`${typography.subsection} font-bold text-gray-700 mb-2.5`}>{formattedTitle}</p>
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
    const formattedTitle = formatTitle(title);

    // Reset state when isOpenDefault changes (e.g., when component selection changes)
    useEffect(() => {
        setIsOpen(isOpenDefault);
    }, [isOpenDefault]);

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center text-left ${typography.medium} text-gray-700 ${typography.subsection} hover:bg-gray-50 px-3 py-2 rounded-md transition-colors`}
                aria-expanded={isOpen}
                aria-controls={sectionId}
            >
                <span className="font-bold">{formattedTitle}</span>
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

/**
 * Helper function to build spacing styles (padding and margin) from props
 * Now takes evaluated values instead of calling hooks
 */
export const buildSpacingStyles = (
  padding?: string | number,
  margin?: string | number
): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  if (padding !== undefined) {
    const paddingValue = typeof padding === 'number' 
      ? `${padding}px` 
      : padding;
    if (paddingValue) {
      styles.padding = paddingValue;
    }
  }
  
  if (margin !== undefined) {
    const marginValue = typeof margin === 'number'
      ? `${margin}px`
      : margin;
    if (marginValue) {
      styles.margin = marginValue;
    }
  }
  
  return styles;
};

/**
 * Helper function to parse padding value and extract left/top padding
 * Handles both number and string values (e.g., "10px", "10px 20px", "10px 20px 30px 40px")
 */
export const parsePadding = (padding?: string | number): { left: number; top: number } => {
  if (padding === undefined) {
    return { left: 0, top: 0 };
  }
  
  if (typeof padding === 'number') {
    return { left: padding, top: padding };
  }
  
  // Parse string padding (e.g., "10px", "10px 20px", "10px 20px 30px 40px")
  const parts = padding.trim().split(/\s+/);
  if (parts.length === 1) {
    const value = parseFloat(parts[0]) || 0;
    return { left: value, top: value };
  } else if (parts.length === 2) {
    return {
      top: parseFloat(parts[0]) || 0,
      left: parseFloat(parts[1]) || 0,
    };
  } else if (parts.length === 4) {
    return {
      top: parseFloat(parts[0]) || 0,
      left: parseFloat(parts[3]) || 0,
    };
  }
  
  return { left: 0, top: 0 };
};

/**
 * Helper function to build border style object from border props
 * Handles both unified border properties and individual side properties
 * Individual side properties (borderTop, borderRight, etc.) override unified borderWidth for those sides
 * Now takes evaluated values instead of calling hooks
 */
export const buildBorderStyles = (
  borderProps: BorderProps,
  borderRadius?: string | number,
  borderWidth?: string | number,
  borderColor?: string,
  borderTop?: string | number,
  borderRight?: string | number,
  borderBottom?: string | number,
  borderLeft?: string | number
): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Check if border style is explicitly set to 'none'
  const isBorderNone = borderProps.borderStyle === 'none';
  
  // Apply border radius (always allowed, independent of border style)
  if (borderRadius !== undefined) {
    styles.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  }
  
  // If border style is 'none', explicitly set it and don't apply any border widths
  if (isBorderNone) {
    styles.borderStyle = 'none';
    return styles; // Early return - no borders should be applied
  }
  
  // Apply border style and color (needed for all borders)
  if (borderProps.borderStyle !== undefined) {
    styles.borderStyle = borderProps.borderStyle;
  }
  if (borderColor !== undefined) {
    styles.borderColor = borderColor;
  }
  
  // Check if any individual border sides are set
  const hasIndividualSides = borderTop !== undefined || 
                            borderRight !== undefined || 
                            borderBottom !== undefined || 
                            borderLeft !== undefined;
  
  if (hasIndividualSides) {
    // Apply individual border side widths (these override unified borderWidth)
    if (borderTop !== undefined) {
      styles.borderTop = typeof borderTop === 'number' ? `${borderTop}px` : borderTop;
    }
    if (borderRight !== undefined) {
      styles.borderRight = typeof borderRight === 'number' ? `${borderRight}px` : borderRight;
    }
    if (borderBottom !== undefined) {
      styles.borderBottom = typeof borderBottom === 'number' ? `${borderBottom}px` : borderBottom;
    }
    if (borderLeft !== undefined) {
      styles.borderLeft = typeof borderLeft === 'number' ? `${borderLeft}px` : borderLeft;
    }
    
    // Ensure borderStyle and borderColor are set if individual sides are used
    // Only set defaults if borderStyle is not explicitly 'none'
    if (!styles.borderStyle && borderProps.borderStyle === undefined) {
      styles.borderStyle = 'solid'; // Default to solid if not specified
    }
    if (!styles.borderColor && borderColor === undefined) {
      styles.borderColor = '#e5e7eb'; // Default color if not specified
    }
  } else if (borderWidth !== undefined) {
    // Apply unified border width only if no individual sides are set
    styles.borderWidth = typeof borderWidth === 'number' ? `${borderWidth}px` : borderWidth;
  }
  
  return styles;
};

export const StateProps: React.FC<{ 
    props: ComponentProps & {id?: string}; 
    updateProp: (key: string, value: any) => void;
    onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ props, updateProp, onOpenExpressionEditor }) => {
    return (
    <PropertyGroup title="State">
        <PropFxInput label="Disabled" value={props.disabled} onChange={val => updateProp('disabled', val)} placeholder="e.g. {{table1.selectedRecord == null}}" onOpenEditor={(val) => onOpenExpressionEditor(val, (newVal) => updateProp('disabled', newVal))} />
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
