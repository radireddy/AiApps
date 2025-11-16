import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from './storageService';
import { AppMetadata, GlobalTheme, AppTemplate } from './types';
import { CreateAppModal } from './CreateAppModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { RenameAppModal } from './RenameAppModal';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { SaveAsTemplateModal } from './components/SaveAsTemplateModal';
import { TemplateSelectionModal } from './components/TemplateSelectionModal';


interface DashboardProps {
  onEditApp: (app: AppMetadata) => void;
  onCreateApp: (app: AppMetadata) => void;
}

const AppCard: React.FC<{
  app: AppMetadata;
  onEdit: () => void;
  onDelete: () => void;
  onRename: () => void;
  onExport: () => void;
  onSaveAsTemplate: () => void;
}> = ({ app, onEdit, onDelete, onRename, onExport, onSaveAsTemplate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="p-5 flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{app.name}</h3>
        <p className="text-sm text-gray-500">
          Modified: {new Date(app.lastModifiedAt).toLocaleString()}
        </p>
      </div>
      <div className="border-t border-gray-200 p-3 flex justify-between items-center bg-gray-50">
        <button onClick={onEdit} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Edit App
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onRename); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rename</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onSaveAsTemplate); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Save as Template</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onExport); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onDelete); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{
  template: AppTemplate;
  onUse: () => void;
  onDelete: () => void;
}> = ({ template, onUse, onDelete }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
        <div className="absolute top-2 right-2 z-10">
             <button onClick={onDelete} className="p-2 bg-white/50 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
            <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-5 flex-grow flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{template.name}</h3>
            <p className="text-sm text-gray-500 flex-grow">{template.description}</p>
        </div>
        <div className="border-t border-gray-200 p-3 bg-gray-50">
            <button onClick={onUse} className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Use Template
            </button>
        </div>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ onEditApp, onCreateApp }) => {
  const [apps, setApps] = useState<AppMetadata[]>([]);
  const [themes, setThemes] = useState<GlobalTheme[]>([]);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<AppMetadata | null>(null);
  const [appToRename, setAppToRename] = useState<AppMetadata | null>(null);
  const [importData, setImportData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [themeToEdit, setThemeToEdit] = useState<GlobalTheme | null>(null);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
  const [appToSaveAsTemplate, setAppToSaveAsTemplate] = useState<AppMetadata | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<AppTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);
  
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    const [appMetadatas, globalThemes, appTemplates] = await Promise.all([
      storageService.getAllAppsMetadata(),
      storageService.getAllThemes(),
      storageService.getAllTemplates(),
    ]);
    appMetadatas.sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime());
    setApps(appMetadatas);
    setThemes(globalThemes);
    setTemplates(appTemplates);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
            setIsCreateDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateNewApp = async (appName: string) => {
    const appDefToUse = selectedTemplate ? selectedTemplate.appDefinition : undefined;
    const newApp = await storageService.createApp(appName, appDefToUse);
    setIsCreateModalOpen(false);
    setSelectedTemplate(null);
    onCreateApp(newApp);
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    await storageService.deleteApp(appToDelete.id);
    setApps(prevApps => prevApps.filter(app => app.id !== appToDelete.id));
    setAppToDelete(null);
  };
  
  const handleRenameApp = async (newName: string) => {
    if (!appToRename) return;
    await storageService.renameApp(appToRename.id, newName);
    setAppToRename(null);
    fetchAllData();
  };
  
  const handleExportSingleApp = async (app: AppMetadata) => {
    const jsonString = await storageService.exportSingleApp(app.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedAppName = app.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${sanitizedAppName}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const jsonString = await storageService.exportAllApps();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini_apps_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) { // Full backup
        setImportData(text);
      } else { // Single app
        await storageService.importApps(text);
        alert('App imported successfully!');
        fetchAllData();
      }
    } catch (error) {
      console.error("Failed to import apps:", error);
      alert(`Failed to import apps. Please make sure the file is valid. Error: ${error}`);
    }
    event.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importData) return;
    try {
        await storageService.importApps(importData);
        alert('Full backup imported successfully!');
        fetchAllData();
    } catch (error) {
        console.error("Failed to import apps:", error);
        alert(`Failed to import apps. Error: ${error}`);
    } finally {
        setImportData(null);
    }
  };
  
  const handleSaveTheme = async (theme: GlobalTheme) => {
    await storageService.saveTheme(theme);
    setIsThemeEditorOpen(false);
    setThemeToEdit(null);
    fetchAllData();
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (window.confirm("Are you sure you want to delete this theme? This cannot be undone.")) {
      await storageService.deleteTheme(themeId);
      fetchAllData();
    }
  };

  const handleSaveAsTemplate = async (templateData: Omit<AppTemplate, 'id' | 'appDefinition'>) => {
      if (!appToSaveAsTemplate) return;
      const appDef = await storageService.getApp(appToSaveAsTemplate.id);
      if (!appDef) return;

      await storageService.saveTemplate({
          ...templateData,
          id: `template_${Date.now()}`,
          appDefinition: appDef,
      });
      setAppToSaveAsTemplate(null);
      fetchAllData();
  };

  const handleConfirmDeleteTemplate = async () => {
      if (!templateToDelete) return;
      await storageService.deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
      fetchAllData();
  };

  const handleSelectTemplate = (template: AppTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateSelectionOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 15C5.34315 15 4 16.3431 4 18V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V18C20 16.3431 18.6569 15 17 15H7Z" fill="#a5b4fc"/>
                <path d="M16.5 3H7.5C6.67157 3 6 3.67157 6 4.5V15H18V4.5C18 3.67157 17.3284 3 16.5 3Z" fill="#4f46e5"/>
              </svg>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <div className="w-px h-6 bg-gray-200 ml-2"></div>
              <button onClick={handleImportClick} className="ml-2 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Import Apps</button>
              <button onClick={handleExportAll} className="px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Export All Apps</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
            </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">My Apps</h2>
             <div className="relative inline-flex shadow-sm rounded-md" ref={createDropdownRef}>
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-l-md hover:bg-blue-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => { setSelectedTemplate(null); setIsCreateModalOpen(true); }}
                >
                    Create New App
                </button>
                <button
                    type="button"
                    className="px-2 py-2 text-sm font-semibold text-white bg-blue-600 rounded-r-md hover:bg-blue-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border-l border-blue-500"
                    onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                    aria-haspopup="true"
                    aria-expanded={isCreateDropdownOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                {isCreateDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsTemplateSelectionOpen(true); setIsCreateDropdownOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                Create from Template
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {apps.map(app => (
              <AppCard 
                key={app.id} 
                app={app} 
                onEdit={() => onEditApp(app)}
                onDelete={() => setAppToDelete(app)}
                onRename={() => setAppToRename(app)}
                onExport={() => handleExportSingleApp(app)}
                onSaveAsTemplate={() => setAppToSaveAsTemplate(app)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">No applications found</h3>
            <p className="mt-2 text-gray-500">Get started by creating your first application.</p>
          </div>
        )}
        
        {/* Templates Section */}
        <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">App Templates</h2>
            {isLoading ? (
                <p>Loading templates...</p>
            ) : templates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {templates.map(template => (
                        <TemplateCard 
                            key={template.id} 
                            template={template} 
                            onUse={() => handleSelectTemplate(template)}
                            onDelete={() => setTemplateToDelete(template)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800">No templates found</h3>
                    <p className="mt-2 text-gray-500">Save an existing app as a template to get started.</p>
                </div>
            )}
        </div>


        <div className="mt-16">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">My Themes</h2>
                <button onClick={() => { setThemeToEdit(null); setIsThemeEditorOpen(true); }} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm">
                    Create New Theme
                </button>
            </div>
            {themes.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <ul role="list" className="divide-y divide-gray-200">
                        {themes.map((theme) => (
                            <li key={theme.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-800">{theme.name}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.type === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {theme.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => { setThemeToEdit(theme); setIsThemeEditorOpen(true); }} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                                    <button onClick={() => handleDeleteTheme(theme.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800">No themes found</h3>
                    <p className="mt-2 text-gray-500">Create a global theme to easily apply styles across your apps.</p>
                </div>
            )}
        </div>
      </main>
      {isCreateModalOpen && (
        <CreateAppModal 
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateNewApp}
        />
      )}
      {appToDelete && (
        <DeleteConfirmationModal
            appName={appToDelete.name}
            onClose={() => setAppToDelete(null)}
            onConfirm={handleConfirmDelete}
        />
      )}
       {templateToDelete && (
        <DeleteConfirmationModal
            appName={`${templateToDelete.name} (Template)`}
            onClose={() => setTemplateToDelete(null)}
            onConfirm={handleConfirmDeleteTemplate}
        />
      )}
      {appToRename && (
        <RenameAppModal
            currentName={appToRename.name}
            onClose={() => setAppToRename(null)}
            onSave={handleRenameApp}
        />
      )}
       {importData && (
        <ImportConfirmationModal
          onClose={() => setImportData(null)}
          onConfirm={handleConfirmImport}
        />
      )}
      {isThemeEditorOpen && (
        <ThemeEditorModal
          theme={themeToEdit}
          onClose={() => { setIsThemeEditorOpen(false); setThemeToEdit(null); }}
          onSave={handleSaveTheme}
        />
      )}
      {appToSaveAsTemplate && (
        <SaveAsTemplateModal
            appName={appToSaveAsTemplate.name}
            onClose={() => setAppToSaveAsTemplate(null)}
            onSave={handleSaveAsTemplate}
        />
      )}
      {isTemplateSelectionOpen && (
          <TemplateSelectionModal
            templates={templates}
            onClose={() => setIsTemplateSelectionOpen(false)}
            onSelect={handleSelectTemplate}
          />
      )}
    </div>
  );
};