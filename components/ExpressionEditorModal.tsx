
import React, { useState, useEffect } from 'react';

interface ExpressionEditorModalProps {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (newValue: string) => void;
}

export const ExpressionEditorModal: React.FC<ExpressionEditorModalProps> = ({ isOpen, initialValue, onClose, onSave }) => {
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

  useEffect(() => {
    if (isOpen) {
      setValue(getInitialExpressionValue(initialValue));
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="expression-editor-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="expression-editor-title" className="text-lg font-semibold text-gray-800">Edit Expression</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-4 flex-grow bg-gray-50">
          <div className="mb-2 text-xs text-gray-600">
            <p>Enter a JavaScript expression. The value will be automatically wrapped in <code className="bg-gray-200 px-1 rounded">{'{{ }}'}</code> if not already wrapped.</p>
            <p className="mt-1">To remove the expression, delete all content and save, or edit the value directly in the input field.</p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full h-80 p-3 font-mono text-sm bg-gray-900 text-green-300 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Write your JavaScript expression here... e.g., theme.colors.primary or (() => { return 1 + 1; })()"
            autoFocus
          />
        </main>
        <footer className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
        </footer>
      </div>
    </div>
  );
};