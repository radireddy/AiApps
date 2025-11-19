
import { AppComponent, AppDefinition, ComponentProps } from '../../../../types';
import { translateExpression } from '../../utils/expressionTranslator';
import { toCamelCase } from '../../utils/stringUtils';

/**
 * Interface for component generation strategies.
 * Each component type implements this strategy to generate its specific React code.
 */
export interface IComponentGeneratorStrategy {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string;
}

/**
 * Abstract base class for component generators.
 * Provides common utility methods for generating JSX tags, standard attributes, and styling.
 */
export abstract class BaseComponentGenerator implements IComponentGeneratorStrategy {
    /**
     * Generates the React JSX code for a specific component.
     */
    abstract generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string;

    /**
     * Generates standard HTML attributes common to all components.
     * This includes `id`, `hidden` (visibility), and `disabled`.
     */
    protected getCommonAttributes(component: AppComponent, appDef: AppDefinition): string[] {
        const attrs = [`id="${component.id}"`];
        
        if (component.props.hidden) {
            attrs.push(`hidden={${translateExpression(component.props.hidden, appDef, 'raw-js')}}`);
        }
        
        const anyProps = component.props as any;
        if (anyProps.disabled !== undefined) {
            attrs.push(`disabled={${translateExpression(anyProps.disabled, appDef, 'raw-js')}}`);
        }

        return attrs;
    }

    /**
     * Generates the `style={{ ... }}` attribute string.
     * Maps low-code layout properties (x, y, width, height) and styling properties (colors, borders)
     * to standard React inline style objects.
     * 
     * @param props The component properties.
     * @param appDef The app definition context.
     * @param additionalStyles Optional map of extra style properties to merge.
     */
    protected generateStyleAttribute(props: ComponentProps, appDef: AppDefinition, additionalStyles: Record<string, any> = {}): string {
        const baseStyleProps: Record<string, any> = {
            position: `'absolute'`,
            left: `\`${props.x}px\``,
            top: `\`${props.y}px\``,
            width: `\`${props.width}px\``,
            height: `\`${props.height}px\``,
            opacity: translateExpression(props.opacity, appDef, 'raw-js'),
            boxShadow: translateExpression(props.boxShadow, appDef, 'raw-js'),
        };

        const borderProps = props as any;
        ['borderRadius', 'borderWidth', 'borderColor', 'borderStyle'].forEach(prop => {
             if (borderProps[prop] !== undefined) {
                 baseStyleProps[prop] = translateExpression(borderProps[prop], appDef, 'raw-js');
             }
        });

        const finalStyles = { ...baseStyleProps, ...additionalStyles };
        const styleContent = Object.entries(finalStyles)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');
        
        return `style={{ ${styleContent} }}`;
    }

    /**
     * Helper to construct a well-formatted JSX tag string.
     */
    protected buildTag(tagName: string, attributes: string[], children: string | null = null): string {
        const attrsString = attributes.filter(Boolean).join('\n    ');
        if (children) {
            return `<${tagName}\n    ${attrsString}\n>${children}</${tagName}>`;
        }
        return `<${tagName}\n    ${attrsString}\n/>`;
    }
}
