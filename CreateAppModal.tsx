
import React, { useState } from 'react';

interface CreateAppModalProps {
  onClose: () => void;
  onCreate: (appName: string) => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ onClose, onCreate }) => {
  const [appName, setAppName] = useState('');

  const handleCreate = () => {
    if (appName.trim()) {
      onCreate(appName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Application</h2>
          <p className="text-sm text-gray-600 mb-4">Enter a name for your new app. You can change this later.</p>
          <input
            type="text"
            value={appName}
            onChange={e => setAppName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Customer Dashboard"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!appName.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            Create App
          </button>
        </div>
      </div>
    </div>
  );
};