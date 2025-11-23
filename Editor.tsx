





import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ComponentPalette } from './components/ComponentPalette';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Preview } from './components/Preview';
import { useAppData } from './hooks/useAppData';
import { AppDefinition, ComponentType, AppComponent, Theme, GlobalTheme } from './types';
import { AIPromptBar } from './components/AIPromptBar';
import { generateAppLayout } from '@/services/geminiService';
import { componentRegistry } from './components/component-registry/registry';
import { DataPanel } from './components/DataPanel';
import { dataSourceRegistry } from './data-sources/registry';
import { StatePanel } from './components/StatePanel';
import { ExpressionEditorModal } from './components/ExpressionEditorModal';
import { storageService } from '@/storageService';
import { ThemePanel } from './ThemePanel';
import { TreeView } from './components/TreeView';
import { exportToReactProject } from './services/projectExporter';

const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 500;
const RESPONSIVE_BREAKPOINT = 1024; // px

interface EditorProps {
  appId: string;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ appId, onBack }) => {
  const [initialAppDef, setInitialAppDef] = useState<AppDefinition | null>(null);
  const [globalThemes, setGlobalThemes] = useState<GlobalTheme[]>([]);

  useEffect(() => {
    const loadAppAndThemes = async () => {
      const app = await storageService.getApp(appId);
      const themes = await storageService.getAllThemes();
      setGlobalThemes(themes);
      if (app) {
        setInitialAppDef(app);
      } else {
        console.error("App not found!");
        onBack();
      }
    };
    loadAppAndThemes();
  }, [appId, onBack]);

  const handleSave = useCallback(
    (appDef: AppDefinition) => {
      storageService.saveApp(appDef);
    },
    []
  );

  const handleApplyGlobalTheme = (theme: Theme) => {
      if(initialAppDef) {
          const newAppDef = {...initialAppDef, theme: theme};
          setInitialAppDef(newAppDef);
      }
  };

  if (!initialAppDef) {
    return <div className="flex items-center justify-center h-screen">Loading Editor...</div>;
  }

  return <EditorUI 
            initialAppDefinition={initialAppDef} 
            onSave={handleSave} 
            onBack={onBack}
            globalThemes={globalThemes}
            onApplyGlobalTheme={handleApplyGlobalTheme}
         />;
};


interface EditorUIProps {
  initialAppDefinition: AppDefinition;
  onSave: (appDef: AppDefinition) => void;
  onBack: () => void;
  globalThemes: GlobalTheme[];
  onApplyGlobalTheme: (theme: Theme) => void;
}

const EditorUI: React.FC<EditorUIProps> = ({ initialAppDefinition, onSave, onBack, globalThemes, onApplyGlobalTheme }) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const {
    appDefinition,
    setAppDefinition,
    components,
    currentPageId,
    currentPageComponents,
    selectedComponentIds,
    setSelectedComponentIds,
    addComponent,
    updateComponent,
    updateComponents,
    selectComponent,
    deselectAllComponents,
    deleteComponent,
    deleteSelectedComponents,
    updateDataStore,
    actions,
    evaluationScope,
    dataSourceInstances,
    addDataSource,
    refreshDataSource,
    variables,
    addVariable,
    variableState,
    dataSourceContents,
    updateTheme,
    applyTheme,
    reparentComponent,
    selectPage,
    alignAndDistribute,
    arrangeContainerChildren,
  } = useAppData(initialAppDefinition, onSave) as any;

  const [isExporting, setIsExporting] = useState(false);

  const [expressionEditorState, setExpressionEditorState] = useState<{
    isOpen: boolean;
    value: string;
    onSave: (newValue: string) => void;
  }>({
    isOpen: false,
    value: '',
    onSave: () => {},
  });

  const openExpressionEditor = useCallback((initialValue: string, onSaveCallback: (newValue: string) => void) => {
    setExpressionEditorState({
      isOpen: true,
      value: initialValue,
      onSave: onSaveCallback,
    });
  }, []);

  const handleSaveExpression = (newValue: string) => {
    expressionEditorState.onSave(newValue);
    setExpressionEditorState({ isOpen: false, value: '', onSave: () => {} });
  };

  const handleCloseExpressionEditor = () => {
    setExpressionEditorState({ isOpen: false, value: '', onSave: () => {} });
  };

  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(288);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'explorer' | 'components' | 'data' | 'state' | 'theme'>('explorer');

  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);
  
  // Keyboard shortcut for deleting components
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'edit' && selectedComponentIds.length > 0) {
        const activeElement = document.activeElement;
        
        // Check if the focused element is inside the canvas area (not in properties panel or other UI)
        let isInsideCanvas = false;
        let current: HTMLElement | null = activeElement as HTMLElement;
        while (current && current !== document.body) {
          // Check if this element is inside the canvas
          if (current.getAttribute('data-testid') === 'canvas' || 
              current.closest('[data-testid="canvas"]')) {
            isInsideCanvas = true;
            break;
          }
          // If we find properties panel or other UI, we're not in canvas
          if (current.getAttribute('data-testid') === 'properties-panel' ||
              current.closest('[data-testid="properties-panel"]')) {
            isInsideCanvas = false;
            break;
          }
          current = current.parentElement;
        }
        
        // Only allow deletion if focus is inside the canvas area
        if (!isInsideCanvas) {
          return; // Focus is in properties panel or other UI, don't delete
        }
        
        // Check if the active element is an input/textarea/radio/checkbox inside a component
        const isInputElement = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable
        );
        
        if (isInputElement) {
          // For text inputs/textarea, check if user is actively typing (has text selected)
          const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
          const hasTextSelection = inputElement.selectionStart !== undefined && 
                                   inputElement.selectionStart !== inputElement.selectionEnd;
          
          // Check if the focused element is inside a selected component
          let isInsideSelectedComponent = false;
          let componentCheck: HTMLElement | null = activeElement as HTMLElement;
          while (componentCheck && componentCheck !== document.body) {
            // Check if this element is part of a selected component by looking for the outline class
            // Selected components have 'outline' class when selected
            if (componentCheck.classList.contains('outline')) {
              isInsideSelectedComponent = true;
              break;
            }
            componentCheck = componentCheck.parentElement;
          }
          
          // If inside a selected component:
          // - For text inputs: only skip if user has text selected (actively editing)
          // - For radio/checkbox: always allow deletion (they don't have text selection)
          if (isInsideSelectedComponent) {
            // For text inputs/textarea, only prevent deletion if user has text selected
            if (hasTextSelection && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              return; // User is actively editing text, don't delete component
            }
            // Otherwise, allow deletion (empty input, radio, checkbox, or no text selection)
          } else {
            // Input element in canvas but not in selected component - don't delete
            return;
          }
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          deleteSelectedComponents();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to catch events earlier
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedComponentIds, deleteSelectedComponents, mode]);
  
  // Responsive Panel Collapse
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < RESPONSIVE_BREAKPOINT) {
            setIsLeftPanelCollapsed(true);
            setIsRightPanelCollapsed(true);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check on load
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingLeft.current) {
      setLeftPanelWidth(prev => Math.max(MIN_PANEL_WIDTH, Math.min(e.clientX, MAX_PANEL_WIDTH)));
    }
    if (isResizingRight.current) {
      setRightPanelWidth(prev => Math.max(MIN_PANEL_WIDTH, Math.min(window.innerWidth - e.clientX, MAX_PANEL_WIDTH)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const handleMouseDownLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDownRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRight.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, handleMouseUp]);

  const handleGenerateApp = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      const newAppDefinition = await generateAppLayout(prompt, appDefinition, currentPageId);
      if (newAppDefinition) {
        setAppDefinition(newAppDefinition);
      }
    } catch (error) {
      console.error("Failed to generate app layout:", error);
      alert("AI failed to generate the app. Please check the console for details.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const findDropTarget = (x: number, y: number, potentialParents: AppComponent[]): string | null => {
    for (const parent of potentialParents) {
       const plugin = componentRegistry[parent.type];
       if (!plugin.isContainer) continue;

       const { x: px, y: py, width: pw, height: ph } = parent.props;
       if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
          // Check children recursively
          const children = components.filter(c => c.parentId === parent.id);
          const nestedTarget = findDropTarget(x, y, children);
          return nestedTarget || parent.id;
       }
    }
    return null;
  }

  const onDrop = useCallback((item: { type: ComponentType }, x: number, y: number, parentId: string | null) => {
    let finalParentId = parentId;
    let finalX = x;
    let finalY = y;
    
    if (!parentId) {
        finalParentId = findDropTarget(x, y, currentPageComponents.filter(c => !c.parentId));
    }
    
    if (finalParentId) {
        const parent = components.find(c => c.id === finalParentId);
        if (parent) {
            finalX = x - parent.props.x;
            finalY = y - parent.props.y;
        }
    }
    
    addComponent(item.type, { x: finalX, y: finalY }, finalParentId, currentPageId);
  }, [addComponent, components, currentPageId, currentPageComponents]);

  const handleSelectComponentFromTree = useCallback((componentId: string, pageId: string) => {
    if (pageId !== currentPageId) {
        selectPage(pageId);
    }
    selectComponent(componentId);
  }, [currentPageId, selectPage, selectComponent]);
  
  const handleExportAsReactProject = async () => {
    setIsExporting(true);
    try {
      await exportToReactProject(appDefinition);
    } catch (error) {
      console.error("Failed to export project:", error);
      alert("An error occurred while trying to export the project. See the console for details.");
    } finally {
      setIsExporting(false);
    }
  };


  const renderLeftPanel = () => {
    switch(activeLeftPanel) {
        case 'explorer':
            return <TreeView 
                        isCollapsed={isLeftPanelCollapsed} 
                        onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                        appDefinition={appDefinition}
                        currentPageId={currentPageId}
                        selectedComponentIds={selectedComponentIds}
                        onSelectPage={selectPage}
                        onSelectComponent={handleSelectComponentFromTree}
                    />;
        case 'components':
            return <ComponentPalette width={leftPanelWidth} isCollapsed={isLeftPanelCollapsed} onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)} />;
        case 'data':
            return <DataPanel
                        isCollapsed={isLeftPanelCollapsed}
                        onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                        dataSources={dataSourceInstances}
                        providers={Object.values(dataSourceRegistry)}
                        onAddDataSource={addDataSource}
                        onRefreshDataSource={refreshDataSource}
                    />;
        case 'state':
            return <StatePanel
                        isCollapsed={isLeftPanelCollapsed}
                        onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                        variables={variables}
                        onAddVariable={addVariable}
                    />;
        case 'theme':
             return <ThemePanel
                        isCollapsed={isLeftPanelCollapsed}
                        onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                        theme={appDefinition.theme}
                        onUpdateTheme={updateTheme}
                        globalThemes={globalThemes}
                        onApplyGlobalTheme={applyTheme}
                    />;
        default:
            return null;
    }
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 text-gray-800">
      <header role="banner" className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Apps
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <h1 className="text-lg font-semibold text-gray-800">{appDefinition.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          {mode === 'edit' && (
            <button
              onClick={handleExportAsReactProject}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isExporting ? 'Exporting...' : 'Export as React Project'}</span>
            </button>
          )}
          <button
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            aria-label={`Switch to ${mode === 'edit' ? 'preview' : 'editor'} mode`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            {mode === 'edit' ? (
              <>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Preview</span>
              </>
            ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Editor</span>
               </>
            )}
          </button>
        </div>
      </header>

      {mode === 'edit' ? (
        <div className="flex-grow flex overflow-hidden" role="main">
            <div className={`bg-white border-r border-gray-200 flex flex-col shrink-0 ${isLeftPanelCollapsed ? 'w-12' : ''}`} style={{ width: isLeftPanelCollapsed ? undefined : `${leftPanelWidth}px` }}>
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveLeftPanel('explorer')} className={`flex-1 p-3 text-xs font-semibold uppercase tracking-wider ${activeLeftPanel === 'explorer' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Explorer</button>
                    <button onClick={() => setActiveLeftPanel('components')} className={`flex-1 p-3 text-xs font-semibold uppercase tracking-wider ${activeLeftPanel === 'components' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Components</button>
                    <button onClick={() => setActiveLeftPanel('data')} className={`flex-1 p-3 text-xs font-semibold uppercase tracking-wider ${activeLeftPanel === 'data' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Data</button>
                    <button onClick={() => setActiveLeftPanel('state')} className={`flex-1 p-3 text-xs font-semibold uppercase tracking-wider ${activeLeftPanel === 'state' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>State</button>
                    <button onClick={() => setActiveLeftPanel('theme')} className={`flex-1 p-3 text-xs font-semibold uppercase tracking-wider ${activeLeftPanel === 'theme' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Theme</button>
                </div>
                {renderLeftPanel()}
            </div>
          
          <div 
            onMouseDown={handleMouseDownLeft}
            className={`w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-500 transition-colors ${isLeftPanelCollapsed ? 'hidden' : ''}`}
            aria-label="Resize component panel"
            role="separator"
          />
          <main className="flex-grow flex flex-col bg-[#fbfcfd]">
             <AIPromptBar onGenerate={handleGenerateApp} isLoading={isAiLoading} />
             <Canvas
                components={currentPageComponents}
                allComponents={components}
                onDrop={onDrop}
                onSelectComponent={selectComponent}
                onDeselectCanvas={deselectAllComponents}
                selectedComponentIds={selectedComponentIds}
                onSetSelectedComponentIds={setSelectedComponentIds}
                updateComponent={updateComponent}
                updateComponents={updateComponents}
                onDeleteComponent={deleteComponent}
                evaluationScope={evaluationScope}
                onReparentComponent={reparentComponent}
                currentPageId={currentPageId}
             />
          </main>
          <div 
            onMouseDown={handleMouseDownRight}
            className={`w-1.5 cursor-col-resize bg-gray-200 hover:bg-blue-500 transition-colors ${isRightPanelCollapsed ? 'hidden' : ''}`}
            aria-label="Resize properties panel"
            role="separator"
          />
          <PropertiesPanel
            components={components}
            selectedComponentIds={selectedComponentIds}
            onUpdate={updateComponent}
            width={rightPanelWidth}
            isCollapsed={isRightPanelCollapsed}
            onToggleCollapse={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            dataSources={dataSourceInstances}
            variables={variables}
            evaluationScope={evaluationScope}
            onOpenExpressionEditor={openExpressionEditor}
            onAlignAndDistribute={alignAndDistribute}
            onArrangeContainerChildren={arrangeContainerChildren}
          />
        </div>
      ) : (
        <Preview 
            appDefinition={appDefinition} 
            onUpdateDataStore={updateDataStore}
            actions={actions}
            variableState={variableState}
            dataSourceContents={dataSourceContents}
        />
      )}
      <ExpressionEditorModal
        isOpen={expressionEditorState.isOpen}
        initialValue={expressionEditorState.value}
        onClose={handleCloseExpressionEditor}
        onSave={handleSaveExpression}
      />
    </div>
  );
};