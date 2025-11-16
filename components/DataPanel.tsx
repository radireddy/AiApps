
import React, { useState } from 'react';
import { DataSourceInstance, DataSourceProvider } from '../types';
import { dataSourceRegistry } from '../data-sources/registry';

interface DataPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dataSources: DataSourceInstance[];
  providers: DataSourceProvider[];
  onAddDataSource: (instance: DataSourceInstance) => void;
  onRefreshDataSource: (instanceId: string) => void;
}

export const DataPanel: React.FC<DataPanelProps> = ({ isCollapsed, onToggleCollapse, dataSources, providers, onAddDataSource, onRefreshDataSource }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [newSourceName, setNewSourceName] = useState('');

  const handleAddDataSource = () => {
    if (newSourceName.trim() && selectedProviderId) {
        if (dataSources.some(ds => ds.id === newSourceName.trim())) {
            alert('A data source with this name already exists.');
            return;
        }
        onAddDataSource({
            id: newSourceName.trim(),
            providerId: selectedProviderId,
            config: {}, // For simplicity, config is not yet editable from UI
        });
        setNewSourceName('');
        setShowAddForm(false);
    }
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3">
        <button 
            onClick={onToggleCollapse} 
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800" 
            aria-label="Expand Data Panel"
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
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Data Sources</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="p-1 rounded-md text-blue-600 hover:bg-blue-100"
                    aria-label="Add new data source"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                     </svg>
                </button>
            </div>

            {showAddForm && (
                <div className="p-3 mb-4 bg-gray-50 border border-gray-200 rounded-md">
                    <select value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)} className="w-full mb-2 p-2 border border-gray-300 rounded-md text-sm">
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input 
                        type="text"
                        placeholder="Data source name..."
                        value={newSourceName}
                        onChange={e => setNewSourceName(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button onClick={handleAddDataSource} className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-blue-700">Add</button>
                </div>
            )}
            
            <div className="space-y-2">
                {dataSources.map(ds => (
                    <div key={ds.id} className="p-2 border border-gray-200 rounded-md bg-white flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-gray-800">{ds.id}</p>
                            <p className="text-xs text-gray-500">{dataSourceRegistry[ds.providerId]?.name}</p>
                        </div>
                        <button 
                            onClick={() => onRefreshDataSource(ds.id)} 
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                            title="Refresh data"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};