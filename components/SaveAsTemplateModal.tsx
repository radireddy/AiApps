import React, { useState, useRef } from 'react';
import { AppTemplate } from '../types';

interface SaveAsTemplateModalProps {
  appName: string;
  onClose: () => void;
  onSave: (templateData: Omit<AppTemplate, 'id' | 'appDefinition'>) => void;
}

const DEFAULT_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluaWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNGY0NmU1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTFiYmY4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxMzUiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSIxMjAiIHk9Ijc1IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIj5BcHA+PC90ZXh0Pjwvc3ZnPg==';


export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({ appName, onClose, onSave }) => {
  const [name, setName] = useState(`${appName} Template`);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim(), description, imageUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Save as Template</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            </div>
            <div>
              <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
              <div className="flex items-center gap-4">
                <img src={imageUrl} alt="Template thumbnail" className="w-32 h-20 object-cover rounded-md border border-gray-200" />
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
                  Upload Image
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Save Template</button>
        </div>
      </div>
    </div>
  );
};