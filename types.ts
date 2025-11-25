
// DOCS_IMPACT: The User Guide section on "Actions & Events" for Buttons needs to be updated. A new 'navigate' action was added. It requires a new 'actionNavigatePageId' property to be documented, which will hold the ID of the page to navigate to.
import React from 'react';

/**
 * Represents the minimal metadata required to list an application in the dashboard.
 */
export interface AppMetadata {
    /** Unique identifier for the app (e.g., 'app_12345') */
    id: string;
    /** User-defined name of the application */
    name: string;
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last modification */
    lastModifiedAt: string;
}

/**
 * Represents a single page within the application.
 */
export interface AppPage {
    /** Unique identifier for the page */
    id: string;
    /** Display name of the page (e.g., "Home", "Settings") */
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

/**
 * Defines the visual styling rules for the application.
 * Values here are referenced by components using `{{theme.colors.primary}}`, etc.
 */
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
  TEXTAREA = 'TEXTAREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  DIVIDER = 'DIVIDER',
  H_STACK = 'H_STACK',
  V_STACK = 'V_STACK',
  RADIO_GROUP = 'RADIO_GROUP',
  SWITCH = 'SWITCH',
  TABLE = 'TABLE',
  CONTAINER = 'CONTAINER',
  LIST = 'LIST',
}

/**
 * Base properties shared by all visual components.
 */
export interface BaseProps {
  /** X position relative to parent (pixels) */
  x: number;
  /** Y position relative to parent (pixels) */
  y: number;
  width: number;
  height: number;
  opacity?: number | string;
  boxShadow?: string;
  disabled?: boolean | string;
  /** Expression to determine visibility (e.g., `{{ !user.isLoggedIn }}`) */
  hidden?: boolean | string;
  /** Padding (e.g., '8px', '10px 5px', or '{{theme.spacing.md}}') */
  padding?: number | string;
  /** Margin (e.g., '8px', '10px 5px', or '{{theme.spacing.md}}') */
  margin?: number | string;
}

export interface BorderProps {
    borderRadius?: number | string;
    borderWidth?: number | string;
    borderColor?: string;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderTop?: number | string;
    borderLeft?: number | string;
    borderRight?: number | string;
    borderBottom?: number | string;
}

export type PropertyRendererType = 'javascript' | 'markdown' | 'literal';
/**
 * A function hook that transforms a raw property value into a rendered value.
 * @example
 * // Returns "Hello World" if value is "{{ 'Hello ' + 'World' }}"
 * renderer(value, scope, defaultValue) 
 */
export type PropertyRendererHook = <T>(value: T, scope: Record<string, any>, defaultValue: T) => T;


export interface LabelProps extends BaseProps, BorderProps {
  text: string;
  fontSize: number | string;
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  backgroundColor?: string;
  textRenderer?: PropertyRendererType;
}

export interface InputProps extends BaseProps, BorderProps {
  placeholder: string;
  /** The key in the `dataStore` where this input's value is saved (e.g., 'user.name') */
  dataStoreKey: string;
  /** Default value for the input field (supports expressions) */
  defaultValue?: string;
  /** Input type: text, number, password, email, url, tel */
  inputType?: 'text' | 'number' | 'password' | 'email' | 'url' | 'tel';
  /** Value binding (supports expressions) - alternative to dataStoreKey */
  value?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Maximum length for text inputs */
  maxLength?: number;
  /** Minimum value (for number inputs, supports expressions) */
  min?: number | string;
  /** Maximum value (for number inputs, supports expressions) */
  max?: number | string;
  /** Step value for number inputs */
  step?: number | string;
  /** Regex pattern for validation */
  pattern?: string;
  /** Whether input is required */
  required?: boolean | string;
  /** Custom error message (supports expressions) */
  errorMessage?: string;
  /** Font size */
  fontSize?: number | string;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Text color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Z-index for layering */
  zIndex?: number;
  /** Custom CSS class names */
  className?: string;
  /** Custom HTML attributes (JSON string of key-value pairs) */
  customAttributes?: string;
  /** Event handlers */
  onChange?: string; // JS expression
  onFocus?: string; // JS expression
  onBlur?: string; // JS expression
  onEnterKeyPress?: string; // JS expression
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
  /** Layout direction for container children */
  direction?: 'horizontal' | 'vertical';
  /** Justify children along the main axis */
  justifyContent?: 'start' | 'center' | 'end' | 'space-between';
  /** Align children along the cross axis */
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

export interface HStackProps extends PanelProps {}
export interface VStackProps extends PanelProps {}

export interface TextareaProps extends BaseProps, BorderProps {
  textAlign?: 'left' | 'center' | 'right';
  placeholder: string;
  dataStoreKey: string;
  /** Default value for the textarea field (supports expressions) */
  defaultValue?: string;
  accessibilityLabel?: string;
}

export interface SelectProps extends BaseProps, BorderProps {
  dataStoreKey: string;
  options: string; // comma-separated
  placeholder: string;
  /** Default value for the select field (supports expressions) */
  defaultValue?: string;
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

export interface ContainerProps extends Omit<BaseProps, 'width' | 'height'>, BorderProps {
  /** Width in pixels (px) or percentage (%) */
  width?: number | string;
  /** Height in pixels (px) or percentage (%) */
  height?: number | string;
  /** Background color */
  backgroundColor?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Z-index for layering */
  zIndex?: number;
  /** Custom CSS class names */
  className?: string;
  /** Custom HTML attributes */
  customAttributes?: string; // JSON string of key-value pairs
  /** Tooltip text */
  tooltip?: string;
  /** onClick event handler (JS expression) */
  onClick?: string;
}

export interface ListProps extends ContainerProps {
  /** Data source array (expression that evaluates to an array) */
  data?: string;
  /** Unique key for each item (expression, defaults to index) */
  itemKey?: string;
  /** Height of each template item in pixels */
  templateHeight?: number | string;
  /** Spacing between items in pixels */
  itemSpacing?: number | string;
  /** Empty state text (shown when data is empty) */
  emptyState?: string;
  /** Event handler for item click */
  onItemClick?: string;
  /** Event handler for item selection */
  onItemSelect?: string;
  /** Event handler for data change */
  onDataChange?: string;
  /** Template children IDs (stored separately from regular children) */
  templateChildren?: string[];
}

export type ComponentProps = LabelProps | InputProps | ButtonProps | ImageProps | PanelProps | TextareaProps | SelectProps | CheckboxProps | DividerProps | HStackProps | VStackProps | RadioGroupProps | SwitchProps | TableProps | ContainerProps | ListProps;

/**
 * Represents a single instance of a UI component in the application.
 */
export interface AppComponent {
  /** Unique identifier (e.g. 'BUTTON_16345...') */
  id: string;
  type: ComponentType;
  /** Configuration properties for the component */
  props: ComponentProps;
  /** ID of the container component this component resides in, or null if root */
  parentId?: string | null;
  /** The ID of the page this component belongs to */
  pageId: string;
}

/**
 * The central state object for the running application.
 * Maps keys (strings) to any value.
 */
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

/**
 * The Single Source of Truth for an application.
 * This object contains the entire blueprint of the app: structure, logic, styling, and configuration.
 */
export interface AppDefinition extends AppMetadata {
  pages: AppPage[];
  mainPageId: string;
  /** Flat list of all components across all pages */
  components: AppComponent[];
  /** Initial state of the data store */
  dataStore: DataStore;
  /** Configuration for external data connections */
  dataSources: DataSourceInstance[];
  /** Global state variable definitions */
  variables: AppVariable[];
  /** Visual theme configuration */
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
/**
 * Interface for implementing a new Data Source Plugin.
 */
export interface DataSourceProvider {
    /** Unique ID like "MOCK_DB", "LOCAL_STORAGE" */
    id: string; 
    /** User-friendly name like "Mock Database" */
    name: string; 
    description: string;
    /** Schema for the configuration form shown in the Data Panel */
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

/**
 * Interface for implementing a new UI Component Plugin.
 */
export interface ComponentPlugin {
  type: ComponentType;
  paletteConfig: PaletteConfig;
  /** React component used to render the element on the canvas */
  renderer: React.FC<any>;
  /** React component used to render the Properties Panel controls */
  properties: React.FC<any>;
  /** If true, other components can be dropped inside this one */
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
