
// DOCS_IMPACT: The User Guide section on "Actions & Events" for Buttons needs to be updated. A new 'navigate' action was added. It requires a new 'actionNavigatePageId' property to be documented, which will hold the ID of the page to navigate to.
import React from 'react';

export interface AppMetadata {
    id: string;
    name: string;
    createdAt: string;
    lastModifiedAt: string;
}

export interface AppPage {
    id: string;
    name: string;
}

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export interface ThemeFont {
  family: string;
}

export interface ThemeBorder {
    width: string;
    style: 'none' | 'solid' | 'dashed' | 'dotted';
}

export interface ThemeRadius {
    default: string;
}

export interface ThemeSpacing {
    sm: string;
    md: string;
    lg: string;
}

export interface Theme {
  colors: ThemeColors;
  font: ThemeFont;
  border: ThemeBorder;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
}

export interface GlobalTheme {
    id: string;
    name: string;
    type: 'light' | 'dark';
    theme: Theme;
}


export enum ComponentType {
  LABEL = 'LABEL',
  INPUT = 'INPUT',
  BUTTON = 'BUTTON',
  IMAGE = 'IMAGE',
  PANEL = 'PANEL',
  FORM = 'FORM',
  TEXTAREA = 'TEXTAREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  DIVIDER = 'DIVIDER',
  H_STACK = 'H_STACK',
  V_STACK = 'V_STACK',
  RADIO_GROUP = 'RADIO_GROUP',
  SWITCH = 'SWITCH',
  TABLE = 'TABLE',
  MODAL = 'MODAL',
}

export interface BaseProps {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number | string;
  boxShadow?: string;
  disabled?: boolean | string;
  hidden?: boolean | string;
}

export interface BorderProps {
    borderRadius?: number | string;
    borderWidth?: number | string;
    borderColor?: string;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
}

export interface LabelProps extends BaseProps, BorderProps {
  text: string;
  fontSize: number | string;
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  backgroundColor?: string;
}

export interface InputProps extends BaseProps, BorderProps {
  placeholder: string;
  dataStoreKey: string;
  accessibilityLabel?: string;
}

export type ButtonActionType = 'alert' | 'updateData' | 'none' | 'createRecord' | 'updateRecord' | 'deleteRecord' | 'selectRecord' | 'updateVariable' | 'executeCode' | 'navigate';

export interface ButtonProps extends BaseProps, BorderProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  actionType: ButtonActionType;
  // Alert
  actionAlertMessage?: string;
  // Update Data
  actionUpdateKey?: string;
  actionUpdateValue?: string;
  // Data Source Actions
  dataSourceName?: string;
  newRecordData?: string; // JSON string for new record
  // Update Variable
  actionVariableName?: string;
  actionVariableValue?: any;
  // Execute Code
  actionCodeToExecute?: string;
  // Navigate
  actionNavigatePageId?: string;
}

export interface ImageProps extends BaseProps, BorderProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export interface TableProps extends BaseProps, BorderProps {
    dataSourceName: string;
    columns: string; // "Header:key,Header2:key2"
    rowSelectAction: 'none' | 'updateDataStore';
    selectedRecordKey?: string; // key in dataStore to update with selected row
}

export interface PanelProps extends BaseProps, BorderProps {
  backgroundColor: string;
  backgroundGradient?: string;
}

export interface FormProps extends PanelProps {}
export interface HStackProps extends PanelProps {}
export interface VStackProps extends PanelProps {}
export interface ModalProps extends PanelProps {}

export interface TextareaProps extends BaseProps, BorderProps {
  placeholder: string;
  dataStoreKey: string;
  accessibilityLabel?: string;
}

export interface SelectProps extends BaseProps, BorderProps {
  dataStoreKey: string;
  options: string; // comma-separated
  placeholder: string;
  accessibilityLabel?: string;
}

export interface CheckboxProps extends BaseProps {
  dataStoreKey: string;
  label: string;
}

export interface RadioGroupProps extends BaseProps {
  dataStoreKey: string;
  options: string; // comma-separated
  groupLabel?: string;
}

export interface SwitchProps extends BaseProps {
  dataStoreKey: string;
  label: string;
}

export interface DividerProps extends BaseProps {
  color: string;
}

export type ComponentProps = LabelProps | InputProps | ButtonProps | ImageProps | PanelProps | FormProps | TextareaProps | SelectProps | CheckboxProps | DividerProps | HStackProps | VStackProps | RadioGroupProps | SwitchProps | TableProps | ModalProps;

export interface AppComponent {
  id: string;
  type: ComponentType;
  props: ComponentProps;
  parentId?: string | null;
  pageId: string;
}

export type DataStore = Record<string, any>;

export interface DataSourceInstance {
    id: string; // Unique name given by user, e.g., "myUsers"
    providerId: string; // e.g., "MOCK_DB"
    config: Record<string, any>;
}

export enum AppVariableType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    OBJECT = 'object',
    ARRAY = 'array',
}

export interface AppVariable {
    id: string;
    name: string;
    type: AppVariableType;
    initialValue: any;
}

export interface AppDefinition extends AppMetadata {
  pages: AppPage[];
  mainPageId: string;
  components: AppComponent[];
  dataStore: DataStore;
  dataSources: DataSourceInstance[];
  variables: AppVariable[];
  theme: Theme;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  appDefinition: AppDefinition;
}

export interface ActionHandlers {
    createRecord: (dataSourceName: string, newRecord: any) => Promise<void>;
    updateRecord: (dataSourceName: string, recordId: any, updates: any) => Promise<void>;
    deleteRecord: (dataSourceName: string, recordId: any) => Promise<void>;
    selectRecord: (dataStoreKey: string, record: any) => void;
    updateVariable: (variableName: string, newValue: any) => void;
}


// --- Data Source Provider ---
export interface DataSourceProvider {
    id: string; // Unique ID like "MOCK_DB", "LOCAL_STORAGE"
    name: string; // User-friendly name like "Mock Database"
    description: string;
    // Schema for the configuration form
    configSchema: {
        [key: string]: {
            label: string;
            type: 'text' | 'number' | 'textarea';
            defaultValue: any;
        }
    }
    // API methods
    getRecords: (instance: DataSourceInstance) => Promise<any[]>;
    createRecord: (instance: DataSourceInstance, data: any) => Promise<any>;
    updateRecord: (instance: DataSourceInstance, recordId: any, updates: any) => Promise<any>;
    deleteRecord: (instance: DataSourceInstance, recordId: any) => Promise<boolean>;
}


export interface PaletteComponent {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
}

export interface PaletteConfig {
  label: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
}

export interface ComponentPlugin {
  type: ComponentType;
  paletteConfig: PaletteConfig;
  renderer: React.FC<any>;
  properties: React.FC<any>;
  isContainer?: boolean;
}

// In AppStorageService interface
export interface AppStorageService {
  getAllAppsMetadata: () => Promise<AppMetadata[]>;
  getApp: (id: string) => Promise<AppDefinition | null>;
  saveApp: (app: AppDefinition) => Promise<AppDefinition>;
  createApp: (name: string, templateDefinition?: AppDefinition) => Promise<AppDefinition>;
  deleteApp: (id: string) => Promise<void>;
  renameApp: (id: string, newName: string) => Promise<AppMetadata>;
  exportAllApps: () => Promise<string>;
  exportSingleApp: (id: string) => Promise<string>;
  importApps: (jsonString: string) => Promise<void>;
  
  // Global Theme Management
  getAllThemes: () => Promise<GlobalTheme[]>;
  saveTheme: (theme: GlobalTheme) => Promise<GlobalTheme>;
  deleteTheme: (themeId: string) => Promise<void>;

  // App Template Management
  getAllTemplates: () => Promise<AppTemplate[]>;
  saveTemplate: (template: AppTemplate) => Promise<AppTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
}
