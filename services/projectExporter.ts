// DOCS_IMPACT: The User Guide section on "Exporting" needs to be completely rewritten. It should now explain that the "Export as React Project" button generates a downloadable ZIP file containing a full, editable Vite + React project, not just a single HTML file.
import { AppDefinition, AppComponent, ComponentType, ComponentProps, ButtonProps, AppVariable, AppVariableType } from '../types';
import JSZip from 'jszip';

// --- Helper Functions ---

const toCamelCase = (str: string) => str.replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => chr ? chr.toUpperCase() : '').replace(/^./, (c) => c.toLowerCase());
const toPascalCase = (str: string) => toCamelCase(str).replace(/^./, (c) => c.toUpperCase());
const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '');

const translateExpression = (value: any, allVariables: AppVariable[], isJsxAttribute = true): string => {
    if (typeof value === 'boolean' || typeof value === 'number' || value === null) {
        return isJsxAttribute ? `{${String(value)}}` : String(value);
    }

    if (typeof value !== 'string') {
        const stringified = JSON.stringify(value);
        return isJsxAttribute ? `{${stringified}}` : stringified;
    }

    const varNames = new Set(allVariables.map(v => v.name));
    const keywords = new Set(['theme', 'console', 'true', 'false', 'null', 'undefined', 'get', 'updateDataStore']);

    // This function transforms the content inside {{...}}
    const transformExpression = (expr: string): string => {
        // Find all top-level identifiers (words not preceded by a dot)
        const topLevelIdentifiers = expr.match(/(?<!\.)\b[a-zA-Z_]\w*\b/g) || [];
        const uniqueIdentifiers = [...new Set(topLevelIdentifiers)];
        
        let transformedExpr = expr;
        for (const id of uniqueIdentifiers) {
            // If the identifier is not a known variable or a keyword, wrap it in a `get(dataStore, '...')` call.
            if (!varNames.has(id) && !keywords.has(id)) {
                const regex = new RegExp(`\\b${id}\\b`, 'g');
                transformedExpr = transformedExpr.replace(regex, `get(dataStore, '${id}')`);
            }
        }
        return transformedExpr;
    };

    // Pure expression: "{{...}}"
    if (value.startsWith('{{') && value.endsWith('}}')) {
        const expression = value.substring(2, value.length - 2).trim();
        const finalExpr = transformExpression(expression);
        return isJsxAttribute ? `{${finalExpr}}` : finalExpr;
    }

    // Template literal with expressions: "Hello {{name}}"
    if (value.includes('{{') && value.includes('}}')) {
        const templateLiteral = value.replace(/{{\s*(.*?)\s*}}/g, (_, expression) => `\${${transformExpression(expression)}}`);
        return isJsxAttribute ? `{\`${templateLiteral}\`}` : `\`${templateLiteral}\``;
    }

    // Just a plain string
    return isJsxAttribute ? `"${value}"` : JSON.stringify(value);
};


const getSharedAttributes = (props: ComponentProps, id: string, appDef: AppDefinition): string[] => {
    const attrs = [`id="${id}"`];
    if (props.hidden) {
        attrs.push(`hidden={${translateExpression(props.hidden, appDef.variables, false)}}`);
    }
    return attrs;
};

const getDisabledAttribute = (props: ComponentProps, appDef: AppDefinition): string | null => {
    const anyProps = props as any;
    if (anyProps.disabled !== undefined) { 
        return `disabled={${translateExpression(anyProps.disabled, appDef.variables, false)}}`;
    }
    return null;
};

const buildAttributeList = (attrs: (string | null)[]): string => {
  return attrs.filter(Boolean).join('\n    ');
};


// --- File Content Generators ---

const generatePackageJson = (appName: string): string => {
    const sanitizedAppName = appName.toLowerCase().replace(/\s+/g, '-');
    return JSON.stringify({
        "name": sanitizedAppName,
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "preview": "vite preview"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        "devDependencies": {
            "@types/react": "^18.2.15",
            "@types/react-dom": "^18.2.7",
            "@vitejs/plugin-react": "^4.0.3",
            "autoprefixer": "^10.4.15",
            "postcss": "^8.4.29",
            "tailwindcss": "^3.3.3",
            "typescript": "^5.0.2",
            "vite": "^4.4.5"
        }
    }, null, 2);
};

const generateViteConfig = (): string => `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
`;

const generateTsConfig = (): string => JSON.stringify({
  "compilerOptions": {
    "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", "allowImportingTsExtensions": true,
    "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx",
    "strict": true, "noUnusedLocals": true, "noUnusedParameters": true, "noFallthroughCasesInSwitch": true
  },
  "include": ["src"], "references": [{"path": "./tsconfig.node.json"}]
}, null, 2);

const generateTsConfigNode = (): string => JSON.stringify({
  "compilerOptions": { "composite": true, "skipLibCheck": true, "module": "ESNext", "moduleResolution": "bundler", "allowSyntheticDefaultImports": true },
  "include": ["vite.config.ts"]
}, null, 2);

const generateTailwindConfig = (): string => `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

const generatePostCssConfig = (): string => `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

const generateIndexHtml = (appName: string): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const generateMainTsx = (): string => `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

const generateIndexCss = (cssRules: string[]): string => `
@tailwind base;
@tailwind components;
@tailwind utilities;

${cssRules.join('\n\n')}
`;

const generateComponentToJsx = (component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string => {
    const { type, props, id } = component;
    const children = allComponents.filter(c => c.parentId === id);
    const renderChildren = () => children.map(child => generateComponentToJsx(child, allComponents, appDef)).join('\n');

    const generateStyleAttribute = (additionalStyles: Record<string, any> = {}): string => {
        const baseStyleProps: Record<string, any> = {
            position: `'absolute'`,
            left: `\`${props.x}px\``,
            top: `\`${props.y}px\``,
            width: `\`${props.width}px\``,
            height: `\`${props.height}px\``,
            opacity: translateExpression(props.opacity, appDef.variables, false),
            boxShadow: translateExpression(props.boxShadow, appDef.variables, false),
        };
        const borderProps = props as any;
        if (borderProps.borderRadius !== undefined) baseStyleProps.borderRadius = translateExpression(borderProps.borderRadius, appDef.variables, false);
        if (borderProps.borderWidth !== undefined) baseStyleProps.borderWidth = translateExpression(borderProps.borderWidth, appDef.variables, false);
        if (borderProps.borderColor !== undefined) baseStyleProps.borderColor = translateExpression(borderProps.borderColor, appDef.variables, false);
        if (borderProps.borderStyle !== undefined) baseStyleProps.borderStyle = translateExpression(borderProps.borderStyle, appDef.variables, false);

        const finalStyles = { ...baseStyleProps, ...additionalStyles };
        const styleContent = Object.entries(finalStyles)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');
        return `style={{ ${styleContent} }}`;
    };

    switch(type) {
        case ComponentType.PANEL:
        case ComponentType.FORM:
        case ComponentType.H_STACK:
        case ComponentType.V_STACK: {
            const panelProps = props as any;
            const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({
                    backgroundColor: translateExpression(panelProps.backgroundColor, appDef.variables, false),
                    background: `(${translateExpression(panelProps.backgroundGradient, appDef.variables, false)}) || (${translateExpression(panelProps.backgroundColor, appDef.variables, false)})`,
                })
            ]);
            return `<div\n    ${attributes}\n>\n${renderChildren()}\n</div>`;
        }
        
        case ComponentType.LABEL: {
            const labelProps = props as any;
            const textContent = translateExpression(labelProps.text, appDef.variables);
             const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({
                    fontSize: translateExpression(labelProps.fontSize, appDef.variables, false),
                    fontWeight: translateExpression(labelProps.fontWeight, appDef.variables, false),
                    color: translateExpression(labelProps.color, appDef.variables, false),
                    textAlign: translateExpression(labelProps.textAlign, appDef.variables, false),
                    backgroundColor: translateExpression(labelProps.backgroundColor, appDef.variables, false),
                    display: `'flex'`,
                    alignItems: `'center'`,
                })
            ]);
            return `<div\n    ${attributes}\n>${textContent}</div>`;
        }

        case ComponentType.INPUT: {
            const inputProps = props as any;
            const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({ padding: `'0.5rem'`, boxSizing: `'border-box'` }),
                getDisabledAttribute(props, appDef),
                `className="p-2 box-border"`,
                `placeholder={${translateExpression(inputProps.placeholder, appDef.variables, false)}}`,
                `value={get(dataStore, '${inputProps.dataStoreKey}') || ''}`,
                `onChange={(e) => updateDataStore('${inputProps.dataStoreKey}', e.target.value)}`
            ]);
            return `<input\n    ${attributes}\n/>`;
        }
        
        case ComponentType.BUTTON: {
            const btnProps = props as ButtonProps;
            const onClickHandlerName = `handle${toPascalCase(id)}Click`;
            const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({
                    backgroundColor: translateExpression(btnProps.backgroundColor, appDef.variables, false),
                    color: translateExpression(btnProps.textColor, appDef.variables, false),
                    display: `'flex'`,
                    alignItems: `'center'`,
                    justifyContent: `'center'`,
                }),
                `onClick={${onClickHandlerName}}`,
                getDisabledAttribute(btnProps, appDef),
            ]);
            return `<button\n    ${attributes}\n>${translateExpression(btnProps.text, appDef.variables)}</button>`;
        }
        
        case ComponentType.IMAGE: {
            const imgProps = props as any;
            const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({
                    objectFit: translateExpression(imgProps.objectFit, appDef.variables, false) as any,
                }),
                `src={${translateExpression(imgProps.src, appDef.variables)}}`,
                `alt={${translateExpression(imgProps.alt, appDef.variables)}}`
            ]);
            return `<img\n    ${attributes}\n/>`;
        }

        default: {
             const attributes = buildAttributeList([
                ...getSharedAttributes(props, id, appDef),
                generateStyleAttribute({
                    backgroundColor: `'#fef2f2'`,
                    border: `'1px dashed #ef4444'`,
                    display: `'flex'`,
                    alignItems: `'center'`,
                    justifyContent: `'center'`,
                    fontSize: `'10px'`,
                    color: `'#b91c1c'`,
                })
            ]);
            return `<div\n    ${attributes}\n>Unsupported Component: ${type}</div>`;
        }
    }
};

const generatePageTsx = (page: any, components: AppComponent[], appDef: AppDefinition): string => {
    const rootComponents = components.filter(c => !c.parentId);
    const pageName = toPascalCase(sanitizeName(page.name));

    const buttonClickHandlers = components
        .filter(c => c.type === ComponentType.BUTTON)
        .map(c => {
            const btnProps = c.props as ButtonProps;
            const handlerName = `handle${toPascalCase(c.id)}Click`;
            let handlerBody = '';
            switch(btnProps.actionType) {
                case 'alert':
                    handlerBody = `alert(${translateExpression(btnProps.actionAlertMessage, appDef.variables, false)})`;
                    break;
                case 'updateData':
                    if (btnProps.actionUpdateKey) {
                        handlerBody = `updateDataStore('${btnProps.actionUpdateKey}', ${translateExpression(btnProps.actionUpdateValue, appDef.variables, false)})`;
                    }
                    break;
                case 'updateVariable':
                    if (btnProps.actionVariableName) {
                        const setterName = `set${toPascalCase(btnProps.actionVariableName)}`;
                        const valueExpr = translateExpression(btnProps.actionVariableValue, appDef.variables, false);
                        // Handle functional updates like setCounter(c => c + 1)
                        if (valueExpr.includes(btnProps.actionVariableName)) {
                           handlerBody = `${setterName}((${btnProps.actionVariableName}) => ${valueExpr})`;
                        } else {
                           handlerBody = `${setterName}(${valueExpr})`;
                        }
                    }
                    break;
                // Add other cases like createRecord, executeCode etc. here in the future
            }
            return `const ${handlerName} = () => { ${handlerBody} };`;
        }).join('\n');

    return `
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

// A safe 'get' utility for deep data access.
function get(obj: any, path: string, defaultValue: any = undefined): any {
  if (!path || typeof path !== 'string') return defaultValue;
  const pathArray = path.split('.');
  let current = obj;
  for (let i = 0; i < pathArray.length; i++) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[pathArray[i]];
  }
  return current === undefined ? defaultValue : current;
}

type ${pageName}Props = {
    theme: any;
    dataStore: any;
    updateDataStore: (key: string, value: any) => void;
    ${appDef.variables.map(v => `${v.name}: any;`).join('\n    ')}
    ${appDef.variables.map(v => `set${toPascalCase(v.name)}: React.Dispatch<React.SetStateAction<any>>;`).join('\n    ')}
};

export const ${pageName}: React.FC<${pageName}Props> = ({ theme, dataStore, updateDataStore, ${appDef.variables.map(v => v.name).join(', ')}, ${appDef.variables.map(v => `set${toPascalCase(v.name)}`).join(', ')} }) => {
    
    ${buttonClickHandlers}

    return (
        <div 
            className="relative w-full h-full" 
            style={{ 
                width: '1000px', 
                height: '600px', 
                margin: 'auto', 
                backgroundColor: theme.colors.background
            }}
        >
            ${rootComponents.map(c => generateComponentToJsx(c, components, appDef)).join('\n')}
        </div>
    );
};
`;
};

const generateInitialValue = (variable: AppVariable): string => {
    const { initialValue, type } = variable;
    try {
        switch (type) {
            case AppVariableType.STRING:
                return JSON.stringify(String(initialValue ?? ''));
            case AppVariableType.NUMBER:
                const num = Number(initialValue);
                return isNaN(num) ? '0' : String(num);
            case AppVariableType.BOOLEAN:
                return String(initialValue === 'true' || initialValue === true);
            case AppVariableType.OBJECT:
            case AppVariableType.ARRAY:
                if (typeof initialValue === 'object' && initialValue !== null) {
                    return JSON.stringify(initialValue);
                }
                if (typeof initialValue === 'string' && initialValue.trim()) {
                    // It might already be a valid JSON string
                    JSON.parse(initialValue);
                    return initialValue;
                }
                return type === AppVariableType.OBJECT ? '{}' : '[]';
            default:
                return JSON.stringify(initialValue);
        }
    } catch {
        return type === AppVariableType.OBJECT ? '{}' : (type === AppVariableType.ARRAY ? '[]' : '""');
    }
};

const generateAppTsx = (appDef: AppDefinition): string => {
    const mainPage = appDef.pages.find(p => p.id === appDef.mainPageId)!;
    const mainPageComponent = toPascalCase(sanitizeName(mainPage.name));

    return `
import { useState } from 'react';
import { ${toPascalCase(sanitizeName(mainPage.name))} } from './pages/${toPascalCase(sanitizeName(mainPage.name))}';
// TODO: Import other pages here for routing

// A safe 'set' utility for deep, immutable state updates.
function set(obj: any, path: string, value: any): any {
  if (!path || typeof path !== 'string') return obj;
  const pathArray = path.split('.');
  const newObj = { ...obj };
  let current: any = newObj;
  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
    if (i === pathArray.length - 1) {
      current[key] = value;
    } else {
      // Ensure the next level is an object, creating it if necessary.
      const next = current[key];
      current[key] = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? { ...next } : {};
      current = current[key];
    }
  }
  return newObj;
}

function App() {
    const theme = ${JSON.stringify(appDef.theme, null, 2)};
    const [dataStore, setDataStore] = useState(${JSON.stringify(appDef.dataStore, null, 2)});
    ${appDef.variables.map(v => `const [${v.name}, set${toPascalCase(v.name)}] = useState(${generateInitialValue(v)});`).join('\n    ')}

    const updateDataStore = (key: string, value: any) => {
        setDataStore(prev => set(prev, key, value));
    };

    const pageProps = {
        theme,
        dataStore,
        updateDataStore,
        ${appDef.variables.map(v => v.name).join(',\n        ')},
        ${appDef.variables.map(v => `set${toPascalCase(v.name)}`).join(',\n        ')}
    };
    
    return (
        <main className="w-screen h-screen flex items-center justify-center bg-gray-100">
            <${mainPageComponent} {...pageProps} />
        </main>
    );
}

export default App;
`;
};

export async function exportToReactProject(appDefinition: AppDefinition): Promise<void> {
    const zip = new JSZip();
    const sanitizedAppName = appDefinition.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // --- Generate CSS ---
    // This is a placeholder for the more advanced CSS extraction. For now, we'll keep it simple.
    const cssRules: string[] = [];

    // --- Add configuration files ---
    zip.file('package.json', generatePackageJson(appDefinition.name));
    zip.file('vite.config.ts', generateViteConfig());
    zip.file('tsconfig.json', generateTsConfig());
    zip.file('tsconfig.node.json', generateTsConfigNode());
    zip.file('tailwind.config.js', generateTailwindConfig());
    zip.file('postcss.config.js', generatePostCssConfig());
    zip.file('index.html', generateIndexHtml(appDefinition.name));

    // --- Add src folder and files ---
    const src = zip.folder('src')!;
    src.file('main.tsx', generateMainTsx());
    src.file('index.css', generateIndexCss(cssRules));
    src.file('App.tsx', generateAppTsx(appDefinition));
    
    const pagesFolder = src.folder('pages')!;
    for (const page of appDefinition.pages) {
        const pageComponents = appDefinition.components.filter(c => c.pageId === page.id);
        const pageFileName = `${toPascalCase(sanitizeName(page.name))}.tsx`;
        pagesFolder.file(pageFileName, generatePageTsx(page, pageComponents, appDefinition));
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedAppName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}