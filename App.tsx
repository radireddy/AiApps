
import React, { useState, useCallback } from 'react';
import { Dashboard } from './Dashboard';
import { Editor } from './Editor';
import { AppMetadata } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);

  const handleEditApp = useCallback((app: AppMetadata) => {
    setCurrentAppId(app.id);
    setCurrentView('editor');
  }, []);
  
  const handleCreateApp = useCallback((app: AppMetadata) => {
    setCurrentAppId(app.id);
    setCurrentView('editor');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentAppId(null);
    setCurrentView('dashboard');
  }, []);

  if (currentView === 'editor' && currentAppId) {
    return <Editor appId={currentAppId} onBack={handleBackToDashboard} />;
  }

  return <Dashboard onEditApp={handleEditApp} onCreateApp={handleCreateApp} />;
};

export default App;