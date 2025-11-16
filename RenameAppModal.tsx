
import React, { useState, useEffect } from 'react';

interface RenameAppModalProps {
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const RenameAppModal: React.FC<RenameAppModalProps> = ({ currentName, onClose, onSave }) => {
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      onSave(newName.trim());
    } else if (newName.trim() === currentName) {
      onClose(); // No change, just close
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Rename Application</h2>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!newName.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};