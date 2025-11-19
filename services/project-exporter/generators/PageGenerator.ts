
import { AppDefinition, AppComponent, ComponentType, ButtonProps } from '../../../types';
import { toPascalCase, sanitizeName } from '../utils/stringUtils';
import { translateExpression } from '../utils/expressionTranslator';
import { ComponentGeneratorFactory } from './component/ComponentGeneratorFactory';

/**
 * Generates the full React component file content for a single Page.
 * 
 * This function constructs the entire file, including:
 * - Imports.
 * - Helper functions (like a safe `get` utility).
 * - The React component definition.
 * - Event handler functions for interactive components (buttons).
 * - The JSX tree structure.
 * 
 * @param page The page object from the app definition.
 * @param components The list of components belonging to this page.
 * @param appDef The complete application definition (for context).
 * @returns A string containing the complete `.tsx` file content.
 */
export const generatePageTsx = (page: any, components: AppComponent[], appDef: AppDefinition): string => {
    const rootComponents = components.filter(c => !c.parentId);
    const pageName = toPascalCase(sanitizeName(page.name));

    // Generate event handlers for buttons
    const buttonClickHandlers = components
        .filter(c => c.type === ComponentType.BUTTON)
        .map(c => {
            const btnProps = c.props as ButtonProps;
            const handlerName = `handle${toPascalCase(c.id)}Click`;
            let handlerBody = '';
            
            switch(btnProps.actionType) {
                case 'alert':
                    handlerBody = `alert(${translateExpression(btnProps.actionAlertMessage, appDef, 'raw-js')})`;
                    break;
                case 'updateData':
                    if (btnProps.actionUpdateKey) {
                        handlerBody = `updateDataStore('${btnProps.actionUpdateKey}', ${translateExpression(btnProps.actionUpdateValue, appDef, 'raw-js')})`;
                    }
                    break;
                case 'updateVariable':
                    if (btnProps.actionVariableName) {
                        const setterName = `set${toPascalCase(btnProps.actionVariableName)}`;
                        const valueExpr = translateExpression(btnProps.actionVariableValue, appDef, 'raw-js') || 'undefined';
                        if (valueExpr.includes(btnProps.actionVariableName)) {
                           handlerBody = `${setterName}((${btnProps.actionVariableName}) => ${valueExpr})`;
                        } else {
                           handlerBody = `${setterName}(${valueExpr})`;
                        }
                    }
                    break;
                case 'executeCode':
                    if (btnProps.actionCodeToExecute) {
                         handlerBody = translateExpression(btnProps.actionCodeToExecute, appDef, 'code-block');
                    }
                    break;
                case 'createRecord':
                case 'updateRecord':
                case 'deleteRecord':
                     handlerBody = `console.warn('Data source actions (Create/Update/Delete) are not yet fully supported in the exported React app.')`;
                     break;
            }
            return `const ${handlerName} = () => { ${handlerBody} };`;
        }).join('\n');

    const jsxContent = rootComponents
        .map(c => ComponentGeneratorFactory.create(c.type).generate(c, components, appDef))
        .join('\n');

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
            ${jsxContent}
        </div>
    );
};
`;
};
