
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';

/**
 * Generator for Label components.
 * Renders text content (static or dynamic expression) inside a styled div.
 * Supports markdown rendering when textRenderer is set to 'markdown'.
 */
export class LabelGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const labelProps = component.props as any;
        const textRenderer = labelProps.textRenderer || 'javascript';
        
        const style = {
            fontSize: translateExpression(labelProps.fontSize, appDef, 'raw-js'),
            fontWeight: translateExpression(labelProps.fontWeight, appDef, 'raw-js'),
            color: translateExpression(labelProps.color, appDef, 'raw-js'),
            textAlign: translateExpression(labelProps.textAlign, appDef, 'raw-js'),
            backgroundColor: translateExpression(labelProps.backgroundColor, appDef, 'raw-js'),
            display: `'flex'`,
            alignItems: `'center'`,
        };

        // Map textAlign to justifyContent for flex layout
        const justifyContent = labelProps.textAlign === 'center' ? `'center'` : (labelProps.textAlign === 'right' ? `'flex-end'` : `'flex-start'`);
        style.justifyContent = justifyContent;

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full"`
        ];

        // Handle markdown rendering
        if (textRenderer === 'markdown') {
            // For markdown, we need to render HTML using dangerouslySetInnerHTML
            // Build the scope object with all available variables and dataStore
            const scopeObject = `{
                theme,
                dataStore,
                get,
                ${appDef.variables.map(v => `${v.name}`).join(',\n                ')}
            }`;
            const markdownText = JSON.stringify(labelProps.text || '');
            const markdownHtml = `renderMarkdown(${markdownText}, ${scopeObject})`;
            
            // Return div with dangerouslySetInnerHTML
            const attrsString = attributes.filter(Boolean).join('\n    ');
            return `<div
    ${attrsString}
    dangerouslySetInnerHTML={{ __html: ${markdownHtml} }}
/>`;
        }

        // For javascript or literal renderers, use regular text content
        const textContent = translateExpression(labelProps.text, appDef, 'jsx-children');
        return this.buildTag('div', attributes, `\n<span style={{ textAlign: ${translateExpression(labelProps.textAlign, appDef, 'raw-js')}, width: '100%', color: ${translateExpression(labelProps.color, appDef, 'raw-js')}, fontSize: ${translateExpression(labelProps.fontSize, appDef, 'raw-js')} }}>${textContent}</span>\n`);
    }
}

/**
 * Generator for Image components.
 * Renders an `<img>` tag with `src`, `alt`, and `object-fit` styles derived from props.
 */
export class ImageGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const imgProps = component.props as any;
        
        const style = {
            objectFit: translateExpression(imgProps.objectFit, appDef, 'raw-js') as any,
        };

        // Handle src - ensure URLs are properly handled
        let srcValue = translateExpression(imgProps.src, appDef, 'raw-js');
        // If the result contains // but isn't a valid expression (no +, no function calls), it might be a malformed expression
        // In that case, treat it as a plain string
        if (srcValue.includes('://') && !srcValue.includes('+') && !srcValue.includes('get(') && !srcValue.includes('(') && !srcValue.startsWith('"') && !srcValue.startsWith("'") && !srcValue.startsWith('`')) {
            // It looks like a plain URL or malformed expression, quote it
            srcValue = JSON.stringify(imgProps.src);
        }

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `src={${srcValue}}`,
            `alt={${translateExpression(imgProps.alt, appDef, 'raw-js')}}`
        ];

        return this.buildTag('img', attributes);
    }
}

/**
 * Generator for Divider components.
 * Renders a simple horizontal divider line.
 */
export class DividerGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const dividerProps = component.props as any;
        const style = {
            backgroundColor: translateExpression(dividerProps.color, appDef, 'raw-js'),
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full"`
        ];
        
        return this.buildTag('div', attributes);
    }
}

/**
 * Generator for Table components.
 * Renders a table with data from a data source.
 */
export class TableGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const tableProps = component.props as any;
        const dataSourceName = tableProps.dataSourceName || '';
        // Data sources are accessed by name from dataStore (they're stored there by the data source system)
        const dataVar = dataSourceName ? `get(dataStore, '${dataSourceName}') || []` : '[]';
        const selectedRecordKey = tableProps.selectedRecordKey || 'selectedRecord';
        const columns = tableProps.columns ? tableProps.columns.split(',').map((col: string) => {
            const [header, key] = col.split(':');
            return { header: header.trim(), key: key ? key.trim() : header.trim().toLowerCase() };
        }) : [];
        
        const style = {
            overflow: `'auto'`,
            backgroundColor: `'white'`,
        };
        
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `className="w-full h-full overflow-auto bg-white relative"`
        ];
        
        // Generate table structure
        const tableHeader = columns.length > 0 ? columns.map((col: any) => `<th key="${col.header}" scope="col" className="px-6 py-3">${col.header}</th>`).join('\n                    ') : '<th scope="col" className="px-6 py-3">No columns</th>';
        
        const tableBody = `{(() => {
                const data = ${dataVar};
                const selectedRecord = get(dataStore, '${selectedRecordKey}') || null;
                if (!Array.isArray(data) || data.length === 0) {
                    return (
                        <tr>
                            <td colSpan={${columns.length || 1}} className="px-6 py-4 text-center text-gray-400 text-sm">
                                No records found
                            </td>
                        </tr>
                    );
                }
                return data.map((row: any, index: number) => {
                    const isSelected = selectedRecord && selectedRecord.id === row.id;
                    return (
                        <tr 
                            key={row.id || index} 
                            className={\`border-b cursor-pointer hover:bg-gray-100 \${isSelected ? 'bg-blue-100' : 'bg-white'}\`}
                            onClick={() => updateDataStore('${selectedRecordKey}', row)}
                        >
                            ${columns.length > 0 ? columns.map((col: any) => `<td key="${col.key}" className="px-6 py-4">{String(get(row, '${col.key}', ''))}</td>`).join('\n                            ') : '<td className="px-6 py-4">No columns configured</td>'}
                        </tr>
                    );
                });
            })()}`;
        
        const tableContent = `<table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                    ${tableHeader}
                </tr>
            </thead>
            <tbody>
                ${tableBody}
            </tbody>
        </table>`;
        
        return this.buildTag('div', attributes, `\n${tableContent}\n`);
    }
}

/**
 * Fallback generator for unknown or unsupported component types.
 * Renders a visual placeholder with an error style to alert the developer.
 */
export class FallbackGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const style = {
            backgroundColor: `'#fef2f2'`,
            border: `'1px dashed #ef4444'`,
            display: `'flex'`,
            alignItems: `'center'`,
            justifyContent: `'center'`,
            fontSize: `'10px'`,
            color: `'#b91c1c'`,
        };
        const attributes = [
             ...this.getCommonAttributes(component, appDef),
             this.generateStyleAttribute(component.props, appDef, style)
        ];
        return this.buildTag('div', attributes, `Unsupported Component: ${component.type}`);
    }
}
