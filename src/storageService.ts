import { AppDefinition, AppMetadata, AppStorageService, GlobalTheme, Theme, AppComponent, AppPage, AppTemplate } from '@/types';

const APPS_INDEX_KEY = 'gemini-low-code-apps-index';
const APP_DATA_PREFIX = 'gemini-low-code-app-';
const GLOBAL_THEMES_KEY = 'gemini-low-code-global-themes';
const APP_TEMPLATES_KEY = 'gemini-low-code-app-templates';
const MIGRATION_FLAG_KEY = 'gemini-low-code-migration-complete-v2'; // Incremented flag

const defaultLightTheme: Theme = {
  colors: {
    primary: '#4F46E5',
    onPrimary: '#FFFFFF',
    secondary: '#06B6D4',
    onSecondary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    border: '#D1D1D1',
  },
  font: {
    family: 'Segoe UI, sans-serif'
  },
  border: {
    width: '1px',
    style: 'solid'
  },
  radius: {
    default: '4px'
  },
  spacing: {
    sm: '4px',
    md: '8px',
    lg: '16px'
  }
};

// --- LocalStorage Implementation ---
const LocalStorageProvider: AppStorageService = {
  async getAllAppsMetadata() {
    const indexJson = localStorage.getItem(APPS_INDEX_KEY);
    if (!indexJson) {
      return [];
    }
    try {
      const index = JSON.parse(indexJson);
      return Array.isArray(index) ? index : [];
    } catch (error) {
      console.error("Failed to parse app index from localStorage. The data may be corrupted.", error);
      return [];
    }
  },

  async getApp(id) {
    const appDataJson = localStorage.getItem(`${APP_DATA_PREFIX}${id}`);
    if (!appDataJson) {
        return null;
    }
    try {
        const app = JSON.parse(appDataJson);
        
        // Migration for pages
        if (!app.pages || !app.mainPageId) {
            const defaultPageId = `page_migrated_${app.id}`;
            app.pages = [{ id: defaultPageId, name: 'Main Page' }];
            app.mainPageId = defaultPageId;
            app.components = (app.components || []).map((c: Omit<AppComponent, 'pageId'>) => ({ ...c, pageId: defaultPageId }));
        }

        // Migration for new theme structure
        if (!app.theme || !app.theme.radius) {
          app.theme = defaultLightTheme;
        }
        return app;
    } catch (error) {
        console.error(`Failed to parse app data for ID ${id} from localStorage.`, error);
        return null;
    }
  },

  async saveApp(app) {
    const updatedApp = {
      ...app,
      lastModifiedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(`${APP_DATA_PREFIX}${app.id}`, JSON.stringify(updatedApp));

    const index: AppMetadata[] = await this.getAllAppsMetadata();
    const appIndex = index.findIndex(a => a.id === app.id);
    const metadata: AppMetadata = {
      id: updatedApp.id,
      name: updatedApp.name,
      createdAt: updatedApp.createdAt,
      lastModifiedAt: updatedApp.lastModifiedAt,
    };

    if (appIndex > -1) {
      index[appIndex] = metadata;
    } else {
      index.push(metadata);
    }
    localStorage.setItem(APPS_INDEX_KEY, JSON.stringify(index));
    
    return updatedApp;
  },

  async createApp(name, templateDefinition) {
    if (!templateDefinition) {
        // Create blank app
        const defaultPageId = `page_${Date.now()}`;
        const newApp: AppDefinition = {
          id: `app_${Date.now()}`,
          name: name,
          createdAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
          pages: [{ id: defaultPageId, name: 'Main Page' }],
          mainPageId: defaultPageId,
          components: [],
          dataStore: { selectedRecord: null },
          dataSources: [],
          variables: [],
          theme: defaultLightTheme,
        };
        return this.saveApp(newApp);
    }
    
    // --- Create from template ---
    const newAppDef = JSON.parse(JSON.stringify(templateDefinition)); // Deep copy

    const pageIdMap = new Map<string, string>();
    const componentIdMap = new Map<string, string>();

    newAppDef.pages.forEach((page: AppPage, index: number) => {
        const oldId = page.id;
        const newId = `page_${Date.now()}_${index}`;
        page.id = newId;
        pageIdMap.set(oldId, newId);
    });

    newAppDef.components.forEach((component: AppComponent, index: number) => {
        const oldId = component.id;
        const newId = `${component.type}_${Date.now()}_${index}`;
        component.id = newId;
        componentIdMap.set(oldId, newId);
    });

    newAppDef.components.forEach((component: AppComponent) => {
        if (component.parentId) {
            component.parentId = componentIdMap.get(component.parentId) || null;
        }
        component.pageId = pageIdMap.get(component.pageId)!;
    });

    newAppDef.mainPageId = pageIdMap.get(newAppDef.mainPageId)!;

    const finalApp: AppDefinition = {
      ...newAppDef,
      id: `app_${Date.now()}`,
      name: name,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    
    return this.saveApp(finalApp);
  },

  async deleteApp(id) {
    let index: AppMetadata[] = await this.getAllAppsMetadata();
    index = index.filter(a => a.id !== id);
    localStorage.setItem(APPS_INDEX_KEY, JSON.stringify(index));
    localStorage.removeItem(`${APP_DATA_PREFIX}${id}`);
  },

  async renameApp(id, newName) {
    const app = await this.getApp(id);
    if (!app) {
      throw new Error("App not found");
    }
    app.name = newName;
    const updatedApp = await this.saveApp(app);
    return {
      id: updatedApp.id,
      name: updatedApp.name,
      createdAt: updatedApp.createdAt,
      lastModifiedAt: updatedApp.lastModifiedAt,
    };
  },

  async exportSingleApp(id) {
    const app = await this.getApp(id);
    if (!app) {
      throw new Error("App not found for export");
    }
    return JSON.stringify(app, null, 2);
  },

  async exportAllApps() {
    const metadata = await this.getAllAppsMetadata();
    const allApps = await Promise.all(
      metadata.map(appMeta => this.getApp(appMeta.id))
    );
    const validApps = allApps.filter(app => app !== null);
    return JSON.stringify(validApps, null, 2);
  },

  async importApps(jsonString) {
    const dataToImport = JSON.parse(jsonString);
    
    if (!Array.isArray(dataToImport)) {
      const app = dataToImport as AppDefinition;
      if (app.id && app.name && Array.isArray(app.components)) {
        await this.saveApp(app);
      } else {
        throw new Error("Invalid single app import file: Missing required properties.");
      }
      return;
    }
    
    const appsToImport: AppDefinition[] = dataToImport;
    
    const currentApps = await this.getAllAppsMetadata();
    currentApps.forEach(app => localStorage.removeItem(`${APP_DATA_PREFIX}${app.id}`));
    localStorage.removeItem(APPS_INDEX_KEY);

    for (const app of appsToImport) {
      if (app.id && app.name && Array.isArray(app.components)) {
        await this.saveApp(app);
      } else {
        console.warn("Skipping invalid app object during import:", app);
      }
    }
  },

  // --- Global Theme Methods ---
  async getAllThemes() {
    const themesJson = localStorage.getItem(GLOBAL_THEMES_KEY);
    return themesJson ? JSON.parse(themesJson) : [];
  },

  async saveTheme(theme) {
    const themes = await this.getAllThemes();
    const themeIndex = themes.findIndex(t => t.id === theme.id);
    if (themeIndex > -1) {
      themes[themeIndex] = theme;
    } else {
      themes.push(theme);
    }
    localStorage.setItem(GLOBAL_THEMES_KEY, JSON.stringify(themes));
    return theme;
  },

  async deleteTheme(themeId) {
    let themes = await this.getAllThemes();
    themes = themes.filter(t => t.id !== themeId);
    localStorage.setItem(GLOBAL_THEMES_KEY, JSON.stringify(themes));
  },

  // --- App Template Methods ---
  async getAllTemplates() {
    const templatesJson = localStorage.getItem(APP_TEMPLATES_KEY);
    return templatesJson ? JSON.parse(templatesJson) : [];
  },

  async saveTemplate(template) {
    const templates = await this.getAllTemplates();
    const templateIndex = templates.findIndex(t => t.id === template.id);
    if (templateIndex > -1) {
      templates[templateIndex] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(APP_TEMPLATES_KEY, JSON.stringify(templates));
    return template;
  },

  async deleteTemplate(templateId) {
    let templates = await this.getAllTemplates();
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem(APP_TEMPLATES_KEY, JSON.stringify(templates));
  },
};

// --- One-Time Migration Logic ---
const runOneTimeMigration = async () => {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) {
        return;
    }
    
    const OLD_APP_KEY = 'gemini-low-code-app';
    const MIGRATED_APP_NAME = "Migrated Legacy App";
    
    try {
        const oldAppDataRaw = localStorage.getItem(OLD_APP_KEY);
        if (oldAppDataRaw) {
            const existingApps = await LocalStorageProvider.getAllAppsMetadata();
            if (!existingApps.some(app => app.name === MIGRATED_APP_NAME)) {
                const oldAppDefinition = JSON.parse(oldAppDataRaw);
                const defaultPageId = `page_migrated_${Date.now()}`;
                const migratedApp: AppDefinition = {
                    ...oldAppDefinition,
                    id: `app_migrated_${Date.now()}`,
                    name: MIGRATED_APP_NAME,
                    createdAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    pages: [{ id: defaultPageId, name: 'Main Page' }],
                    mainPageId: defaultPageId,
                    components: (oldAppDefinition.components || []).map((c: any) => ({ ...c, pageId: defaultPageId })),
                    theme: oldAppDefinition.theme?.radius ? oldAppDefinition.theme : defaultLightTheme,
                };
                await LocalStorageProvider.saveApp(migratedApp);
            }
            localStorage.removeItem(OLD_APP_KEY);
        }
    } catch (error) {
        console.error("Failed to migrate legacy app:", error);
    } finally {
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    }
};

// --- Enhanced Provider with Migration ---
const createMigratedStorageService = (): AppStorageService => {
    let migrationPromise: Promise<void> | null = null;
    
    const ensureMigration = () => {
        if (!migrationPromise) {
            migrationPromise = runOneTimeMigration();
        }
        return migrationPromise;
    };
    
    const serviceWithMigration: AppStorageService = {} as any;
    for (const key of Object.keys(LocalStorageProvider)) {
        const method = key as keyof AppStorageService;
        (serviceWithMigration[method] as any) = async (...args: any[]) => {
            await ensureMigration();
            return (LocalStorageProvider[method] as any)(...args);
        };
    }
    return serviceWithMigration;
}

export const storageService: AppStorageService = createMigratedStorageService();
