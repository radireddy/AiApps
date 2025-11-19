
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';

/**
 * Generator for Label components.
 * Renders text content (static or dynamic expression) inside a styled div.
 */
export class LabelGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const labelProps = component.props as any;
        
        const style = {
            fontSize: translateExpression(labelProps.fontSize, appDef, 'raw-js'),
            fontWeight: translateExpression(labelProps.fontWeight, appDef, 'raw-js'),
            color: translateExpression(labelProps.color, appDef, 'raw-js'),
            textAlign: translateExpression(labelProps.textAlign, appDef, 'raw-js'),
            backgroundColor: translateExpression(labelProps.backgroundColor, appDef, 'raw-js'),
            display: `'flex'`,
            alignItems: `'center'`,
        };

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style)
        ];

        const textContent = translateExpression(labelProps.text, appDef, 'jsx-children');
        return this.buildTag('div', attributes, textContent);
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

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `src={${translateExpression(imgProps.src, appDef, 'raw-js')}}`,
            `alt={${translateExpression(imgProps.alt, appDef, 'raw-js')}}`
        ];

        return this.buildTag('img', attributes);
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
