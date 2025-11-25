
import React, { useState } from 'react';
import { AppVariable, AppVariableType } from '../types';
import { JSONEditorModal } from './JSONEditorModal';

interface StatePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  variables: AppVariable[];
  onAddVariable: (variable: AppVariable) => void;
  onUpdateVariable: (variableId: string, updates: Partial<AppVariable>) => void;
  onDeleteVariable: (variableId: string) => void;
}

export const StatePanel: React.FC<StatePanelProps> = ({ 
  isCollapsed, 
  onToggleCollapse, 
  variables, 
  onAddVariable,
  onUpdateVariable,
  onDeleteVariable
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<AppVariableType>(AppVariableType.STRING);
  const [newVarValue, setNewVarValue] = useState('');
  const [editingVariable, setEditingVariable] = useState<AppVariable | null>(null);

  const handleAddVariable = () => {
    if (newVarName.trim()) {
        onAddVariable({
            id: `var_${Date.now()}`,
            name: newVarName.trim(),
            type: newVarType,
            initialValue: newVarValue,
        });
        setNewVarName('');
        setNewVarType(AppVariableType.STRING);
        setNewVarValue('');
        setShowAddForm(false);
    }
  };
  
  const getInitialValuePlaceholder = () => {
    switch (newVarType) {
        case AppVariableType.OBJECT: return 'e.g., {"key": "value"}';
        case AppVariableType.ARRAY: return 'e.g., ["item1", "item2"]';
        case AppVariableType.ARRAY_OF_OBJECTS: return 'e.g., [{"id": 1, "name": "Item 1"}]';
        case AppVariableType.BOOLEAN: return 'e.g., true or false';
        case AppVariableType.NUMBER: return 'e.g., 123';
        default: return 'e.g., Hello World';
    }
  }

  const shouldUseJSONEditor = (type: AppVariableType) => {
    return type === AppVariableType.OBJECT || 
           type === AppVariableType.ARRAY || 
           type === AppVariableType.ARRAY_OF_OBJECTS;
  }

  const handleEditVariable = (variable: AppVariable) => {
    if (shouldUseJSONEditor(variable.type)) {
      setEditingVariable(variable);
    } else {
      // For simple types, allow inline editing
      const newValue = prompt(`Edit ${variable.name} (${variable.type}):`, String(variable.initialValue || ''));
      if (newValue !== null) {
        onUpdateVariable(variable.id, { initialValue: newValue });
      }
    }
  }

  const handleSaveJSONEditor = (newValue: any) => {
    if (editingVariable) {
      onUpdateVariable(editingVariable.id, { initialValue: newValue });
      setEditingVariable(null);
    }
  }

  const formatValuePreview = (value: any, type: AppVariableType): string => {
    if (value === null || value === undefined) return 'null';
    if (shouldUseJSONEditor(type)) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        const jsonStr = JSON.stringify(parsed);
        return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
      } catch {
        return String(value).substring(0, 50);
      }
    }
    return String(value).substring(0, 50);
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3">
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
            aria-label="Expand State Panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">App State</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="p-1 rounded-md text-blue-600 hover:bg-blue-100"
                    aria-label="Add new app variable"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                     </svg>
                </button>
            </div>

            {showAddForm && (
                <div className="p-3 mb-4 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                    <input 
                        type="text"
                        placeholder="Variable name..."
                        value={newVarName}
                        onChange={e => setNewVarName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                     <select value={newVarType} onChange={e => setNewVarType(e.target.value as AppVariableType)} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        {Object.values(AppVariableType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea 
                        placeholder={`Initial value... ${getInitialValuePlaceholder()}`}
                        value={newVarValue}
                        onChange={e => setNewVarValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        rows={2}
                    />
                    <button onClick={handleAddVariable} className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-blue-700">Add Variable</button>
                </div>
            )}
            
            <div className="space-y-2">
                {variables.map(v => (
                    <div key={v.id} className="p-2 border border-gray-200 rounded-md bg-white">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800">{v.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{v.type}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate" title={String(v.initialValue)}>
                                    {formatValuePreview(v.initialValue, v.type)}
                                </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                                <button
                                    onClick={() => handleEditVariable(v)}
                                    className="p-1 rounded text-blue-600 hover:bg-blue-100"
                                    aria-label={`Edit ${v.name}`}
                                    title="Edit variable"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete variable "${v.name}"?`)) {
                                            onDeleteVariable(v.id);
                                        }
                                    }}
                                    className="p-1 rounded text-red-600 hover:bg-red-100"
                                    aria-label={`Delete ${v.name}`}
                                    title="Delete variable"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {editingVariable && (
                <JSONEditorModal
                    isOpen={true}
                    initialValue={editingVariable.initialValue}
                    variableName={editingVariable.name}
                    variableType={editingVariable.type}
                    onClose={() => setEditingVariable(null)}
                    onSave={handleSaveJSONEditor}
                />
            )}
        </div>
    </div>
  );
};