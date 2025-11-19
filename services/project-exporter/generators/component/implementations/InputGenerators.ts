
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ButtonProps } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { toPascalCase } from '../../../utils/stringUtils';

/**
 * Generator for Input components.
 * Sets up standard React controlled input behavior using `value` and `onChange` props
 * bound to the `dataStore` and `updateDataStore` function.
 */
export class InputGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const inputProps = component.props as any;
        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, { padding: `'0.5rem'`, boxSizing: `'border-box'` }),
            `className="p-2 box-border"`,
            `placeholder={${translateExpression(inputProps.placeholder, appDef, 'raw-js')}}`,
            `value={get(dataStore, '${inputProps.dataStoreKey}') || ''}`,
            `onChange={(e) => updateDataStore('${inputProps.dataStoreKey}', e.target.value)}`
        ];
        return this.buildTag('input', attributes);
    }
}

/**
 * Generator for Button components.
 * Generates the `onClick` handler based on the button's action configuration
 * and renders the button text (which may be an expression).
 */
export class ButtonGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const btnProps = component.props as ButtonProps;
        const onClickHandlerName = `handle${toPascalCase(component.id)}Click`;
        
        const style = {
            backgroundColor: translateExpression(btnProps.backgroundColor, appDef, 'raw-js'),
            color: translateExpression(btnProps.textColor, appDef, 'raw-js'),
            display: `'flex'`,
            alignItems: `'center'`,
            justifyContent: `'center'`,
        };

        const attributes = [
            ...this.getCommonAttributes(component, appDef),
            this.generateStyleAttribute(component.props, appDef, style),
            `onClick={${onClickHandlerName}}`
        ];

        const children = translateExpression(btnProps.text, appDef, 'jsx-children');
        return this.buildTag('button', attributes, children);
    }
}
