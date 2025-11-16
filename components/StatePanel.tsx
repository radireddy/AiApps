
import React, { useState } from 'react';
import { AppVariable, AppVariableType } from '../types';

interface StatePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  variables: AppVariable[];
  onAddVariable: (variable: AppVariable) => void;
}

export const StatePanel: React.FC<StatePanelProps> = ({ isCollapsed, onToggleCollapse, variables, onAddVariable }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<AppVariableType>(AppVariableType.STRING);
  const [newVarValue, setNewVarValue] = useState('');

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
        case AppVariableType.BOOLEAN: return 'e.g., true or false';
        case AppVariableType.NUMBER: return 'e.g., 123';
        default: return 'e.g., Hello World';
    }
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
                        <p className="font-semibold text-sm text-gray-800">{v.name}</p>
                        <p className="text-xs text-gray-500">{v.type}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};