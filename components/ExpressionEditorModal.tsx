import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface PropertyContext {
  propertyId?: string;
  propertyLabel?: string;
  propertyType?: string;
  componentType?: string;
  tab?: string;
  group?: string;
}

interface ExpressionEditorModalProps {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (newValue: string) => void;
  propertyContext?: PropertyContext;
}

interface Example {
  title: string;
  description: string;
  code: string;
  category: 'value' | 'style' | 'event' | 'conditional' | 'data' | 'general';
}

/**
 * Generates context-aware examples based on property metadata
 */
const generateExamples = (context?: PropertyContext): Example[] => {
  const examples: Example[] = [];
  const propertyId = context?.propertyId?.toLowerCase() || '';
  const propertyLabel = context?.propertyLabel?.toLowerCase() || '';
  const tab = context?.tab?.toLowerCase() || '';
  const group = context?.group?.toLowerCase() || '';

  // Event-related properties
  if (tab === 'events' || propertyId.includes('onchange') || propertyId.includes('onclick') || 
      propertyId.includes('onfocus') || propertyId.includes('onblur') || propertyId.includes('action')) {
    // For value change events, add example to access the updated value
    if (propertyId.includes('onchange') || propertyId.includes('change')) {
      examples.push({
        title: 'Get Value Change',
        description: 'Access the new value from the change event',
        code: `event.target.value`,
        category: 'event'
      });
      examples.push({
        title: 'Log Value Change',
        description: 'Log the updated value to console',
        code: `console.log('New value:', event.target.value)`,
        category: 'event'
      });
      examples.push({
        title: 'Update Variable with Value',
        description: 'Update an app variable with the new value',
        code: `actions.updateVariable('userInput', event.target.value)`,
        category: 'event'
      });
      examples.push({
        title: 'Conditional Update',
        description: 'Update variable only if value meets condition',
        code: `(() => {
  const newValue = event.target.value;
  if (newValue.length > 0) {
    actions.updateVariable('userInput', newValue);
  }
})()`,
        category: 'event'
      });
    }
    examples.push({
      title: 'Show Alert',
      description: 'Display an alert message when triggered',
      code: `alert('Hello World')`,
      category: 'event'
    });
    examples.push({
      title: 'Update App Variable',
      description: 'Update an app variable value',
      code: `actions.updateVariable('counter', counter + 1)`,
      category: 'event'
    });
    examples.push({
      title: 'Execute Custom Code',
      description: 'Run custom JavaScript logic with variable updates',
      code: `(() => {
  const newValue = (counter || 0) + 1;
  actions.updateVariable('counter', newValue);
  console.log('Counter updated:', newValue);
})()`,
      category: 'event'
    });
  }

  // Value properties
  if (propertyId.includes('value') || propertyId.includes('text') || propertyId.includes('label') ||
      propertyId.includes('placeholder') || propertyId.includes('defaultvalue')) {
    examples.push({
      title: 'App Variable',
      description: 'Access an app variable by name',
      code: `variableName`,
      category: 'value'
    });
    examples.push({
      title: 'Variable with Logging',
      description: 'Access variable and log its value',
      code: `(() => {
  console.log('Variable value:', variableName);
  return variableName;
})()`,
      category: 'value'
    });
    examples.push({
      title: 'Computed Value',
      description: 'Calculate a value using variables',
      code: `firstName + ' ' + lastName`,
      category: 'value'
    });
    examples.push({
      title: 'Conditional Value',
      description: 'Return different values based on condition',
      code: `isLoggedIn ? 'Welcome back!' : 'Please log in'`,
      category: 'value'
    });
  }

  // Style properties
  if (tab === 'styles' || propertyId.includes('color') || propertyId.includes('background') ||
      propertyId.includes('font') || propertyId.includes('size') || propertyId.includes('width') ||
      propertyId.includes('height') || propertyId.includes('padding') || propertyId.includes('margin') ||
      propertyId.includes('border') || propertyId.includes('opacity') || propertyId.includes('shadow')) {
    examples.push({
      title: 'Theme Color',
      description: 'Use theme color',
      code: `theme.colors.primary`,
      category: 'style'
    });
    examples.push({
      title: 'Dynamic Color',
      description: 'Set color based on variable condition',
      code: `isError ? '#ef4444' : theme.colors.primary`,
      category: 'style'
    });
    examples.push({
      title: 'Calculated Size',
      description: 'Calculate size using variable',
      code: `baseSize * 2 + 'px'`,
      category: 'style'
    });
    examples.push({
      title: 'Conditional Opacity',
      description: 'Change opacity based on variable state',
      code: `isDisabled ? 0.5 : 1`,
      category: 'style'
    });
  }

  // Conditional/Boolean properties
  if (propertyId.includes('disabled') || propertyId.includes('hidden') || propertyId.includes('visible') ||
      propertyId.includes('required') || propertyId.includes('checked') || propertyId.includes('selected')) {
    examples.push({
      title: 'Simple Condition',
      description: 'Check if variable exists',
      code: `userName != null`,
      category: 'conditional'
    });
    examples.push({
      title: 'Complex Condition',
      description: 'Multiple conditions using variables',
      code: `isLoggedIn && role === 'admin'`,
      category: 'conditional'
    });
    examples.push({
      title: 'Negation',
      description: 'Invert boolean variable',
      code: `!isVisible`,
      category: 'conditional'
    });
  }

  // Data source properties
  if (propertyId.includes('data') || propertyId.includes('source') || propertyId.includes('record') ||
      propertyId.includes('selected') || propertyId.includes('item')) {
    examples.push({
      title: 'Selected Record',
      description: 'Get selected record from table',
      code: `table1.selectedRecord`,
      category: 'data'
    });
    examples.push({
      title: 'Data Source Item',
      description: 'Access data source item',
      code: `dataSourceContents.hotels[0]`,
      category: 'data'
    });
    examples.push({
      title: 'Variable Object Property',
      description: 'Access nested property from variable',
      code: `user.profile.name`,
      category: 'data'
    });
  }

  // General examples (always include if no specific examples)
  if (examples.length === 0) {
    examples.push({
      title: 'App Variable',
      description: 'Access an app variable by name',
      code: `variableName`,
      category: 'general'
    });
    examples.push({
      title: 'Variable with Console Log',
      description: 'Access variable and log its value',
      code: `(() => {
  console.log('Variable value:', variableName);
  return variableName;
})()`,
      category: 'general'
    });
    examples.push({
      title: 'Update Variable',
      description: 'Update an app variable value',
      code: `actions.updateVariable('counter', counter + 1)`,
      category: 'general'
    });
    examples.push({
      title: 'Simple Expression',
      description: 'Basic JavaScript expression',
      code: `10 + 20`,
      category: 'general'
    });
    examples.push({
      title: 'String Concatenation',
      description: 'Combine strings with variables',
      code: `'Hello ' + variableName`,
      category: 'general'
    });
    examples.push({
      title: 'Theme Reference',
      description: 'Use theme values',
      code: `theme.colors.primary`,
      category: 'general'
    });
  }

  return examples;
};

export const ExpressionEditorModal: React.FC<ExpressionEditorModalProps> = ({ isOpen, initialValue, onClose, onSave, propertyContext }) => {
  // If initialValue is not an expression, wrap it in {{ }}
  const getInitialExpressionValue = (val: string): string => {
    if (!val) return '{{}}';
    // If already an expression, return as is
    if (val.startsWith('{{') && val.endsWith('}}')) {
      return val;
    }
    // Otherwise, wrap it in {{ }}
    return `{{${val}}}`;
  };

  const [value, setValue] = useState(getInitialExpressionValue(initialValue));
  const [showExamples, setShowExamples] = useState(false);
  const editorRef = useRef<any>(null);
  const examples = generateExamples(propertyContext);
  const isEmpty = !value || value.trim() === '' || value.trim() === '{{}}' || value.trim() === '{{ }}';

  useEffect(() => {
    if (isOpen) {
      const newValue = getInitialExpressionValue(initialValue);
      setValue(newValue);
      setShowExamples(false); // Hide examples by default
    }
  }, [isOpen, initialValue]);

  // Prevent keyboard events from propagating to canvas when modal is open
  useEffect(() => {
    if (!isOpen) {
      // Remove data attribute when modal closes
      document.body.removeAttribute('data-expression-editor-open');
      return;
    }

    // Mark that expression editor is open so Editor can check this
    document.body.setAttribute('data-expression-editor-open', 'true');

    const handleKeyDown = (e: KeyboardEvent) => {
      // Always stop Delete and Backspace from reaching canvas when modal is open
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Check if event is from Monaco editor or modal
        const target = e.target as HTMLElement;
        const isInModal = target.closest('[role="dialog"]') || 
                          target.closest('.monaco-editor') ||
                          target.closest('.monaco-editor-container') ||
                          document.activeElement?.closest('[role="dialog"]');
        
        if (isInModal) {
          // Stop the event from propagating to canvas
          e.stopPropagation();
          // Don't prevent default - let Monaco handle it for text editing
        } else {
          // Event outside modal but modal is open - prevent it
          e.preventDefault();
          e.stopPropagation();
        }
      } else {
        // For other keys, stop propagation if from modal
        const target = e.target as HTMLElement;
        const isInModal = target.closest('[role="dialog"]') || 
                          target.closest('.monaco-editor') ||
                          document.activeElement?.closest('[role="dialog"]');
        
        if (isInModal) {
          e.stopPropagation();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Same logic for keyup events
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isInModal = target.closest('[role="dialog"]') || 
                          target.closest('.monaco-editor') ||
                          document.activeElement?.closest('[role="dialog"]');
        
        if (isInModal) {
          e.stopPropagation();
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Capture phase to intercept events before they reach the canvas
    // Use capture phase to catch events before they bubble up
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.body.removeAttribute('data-expression-editor-open');
    };
  }, [isOpen]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Focus the editor when it mounts
    editor.focus();
  };

  const insertExample = (exampleCode: string) => {
    // Remove {{ }} if present in current value
    let currentCode = value;
    if (currentCode.startsWith('{{') && currentCode.endsWith('}}')) {
      currentCode = currentCode.substring(2, currentCode.length - 2).trim();
    }
    
    // If empty, use the example code, otherwise append
    const newCode = currentCode === '' || currentCode === '{{}}' || currentCode === '{{ }}' 
      ? exampleCode 
      : currentCode + '\n' + exampleCode;
    
    setValue(`{{${newCode}}}`);
    setShowExamples(false);
    
    // Focus editor after insertion
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        // Move cursor to end
        const model = editorRef.current.getModel();
        const position = model.getPositionAt(model.getValueLength());
        editorRef.current.setPosition(position);
      }
    }, 100);
  };

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    let finalValue = value.trim();
    
    // If empty, save empty string (removes expression)
    if (!finalValue) {
      onSave('');
      return;
    }
    
    // If user manually removed {{ }}, treat as primitive value
    // Check if it looks like they want to remove the expression
    if (!finalValue.startsWith('{{') && !finalValue.endsWith('}}')) {
      // User typed a primitive value - save it as-is (removes expression)
      onSave(finalValue);
      return;
    }
    
    // Otherwise, ensure it's properly wrapped as an expression
    if (!finalValue.startsWith('{{')) {
      finalValue = `{{${finalValue}}}`;
    }
    if (!finalValue.endsWith('}}')) {
      finalValue = `${finalValue}}}`;
    }
    onSave(finalValue);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="expression-editor-title"
      onKeyDown={(e) => {
        // Stop all keyboard events from propagating to canvas
        e.stopPropagation();
      }}
      onKeyUp={(e) => {
        // Stop all keyboard events from propagating to canvas
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden"
        onKeyDown={(e) => {
          // Stop propagation within the modal content
          e.stopPropagation();
        }}
        onKeyUp={(e) => {
          // Stop propagation within the modal content
          e.stopPropagation();
        }}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="expression-editor-title" className="text-lg font-semibold text-gray-800">Edit Expression</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-4 flex-grow bg-gray-50 flex flex-col">
          <div className="mb-2 text-xs text-gray-600">
            <p>Enter a JavaScript expression. The value will be automatically wrapped in <code className="bg-gray-200 px-1 rounded">{'{{ }}'}</code> if not already wrapped.</p>
            <p className="mt-1">To remove the expression, delete all content and save, or edit the value directly in the input field.</p>
          </div>
          
          {/* Examples Panel */}
          {showExamples && examples.length > 0 && (
            <div className="mb-3 border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
              <div className="flex items-center justify-between p-2 bg-blue-100 border-b border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900">Quick Start Examples</h3>
                <button
                  onClick={() => setShowExamples(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  aria-label="Hide examples"
                >
                  Hide
                </button>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {examples.map((example, index) => (
                    <div
                      key={index}
                      className="border border-blue-200 rounded-md bg-white hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => insertExample(example.code)}
                    >
                      <div className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-blue-700">{example.title}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {example.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{example.description}</p>
                            <pre className="text-xs bg-gray-900 text-green-300 p-2 rounded overflow-x-auto font-mono">
                              <code>{example.code}</code>
                            </pre>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              insertExample(example.code);
                            }}
                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Insert example"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Show examples button when hidden */}
          {!showExamples && examples.length > 0 && (
            <button
              onClick={() => setShowExamples(true)}
              className="mb-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Show Quick Start Examples
            </button>
          )}

          <div className="flex-1 border border-gray-300 rounded-md overflow-hidden">
            <Editor
              height="400px"
              defaultLanguage="javascript"
              value={value}
              onChange={(newValue) => setValue(newValue || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                acceptSuggestionOnEnter: 'on',
                snippetSuggestions: 'top',
                parameterHints: { enabled: true },
                hover: { enabled: true },
                contextmenu: true,
                folding: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          </div>
        </main>
        <footer className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
        </footer>
      </div>
    </div>
  );
};