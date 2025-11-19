
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ComponentType } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { ComponentGeneratorFactory } from '../ComponentGeneratorFactory';

/**
 * Generator for container components (Panel, Form, Stacks).
 * It recursively generates code for all child components nested within the container.
 */
export class ContainerGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const children = allComponents.filter(c => c.parentId === component.id);
        const renderedChildren = children
            .map(child => ComponentGeneratorFactory.create(child.type).generate(child, allComponents, appDef))
            .join('\n');

        const panelProps = component.props as any;
        
        const style = {
            backgroundColor: translateExpression(panelProps.backgroundColor, appDef, 'raw-js'),
            background: `(${translateExpression(panelProps.backgroundGradient, appDef, 'raw-js')}) || (${translateExpression(panelProps.backgroundColor, appDef, 'raw-js')})`,
        };

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style)
        ];

        return this.buildTag('div', attributes, `\n${renderedChildren}\n`);
    }
}
