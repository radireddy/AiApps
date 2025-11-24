
import { BaseComponentGenerator } from '../ComponentGeneratorStrategy';
import { AppComponent, AppDefinition, ComponentType } from '../../../../../types';
import { translateExpression } from '../../../utils/expressionTranslator';
import { ComponentGeneratorFactory } from '../ComponentGeneratorFactory';
import { toCamelCase } from '../../../utils/stringUtils';

/**
 * Generator for container components (Panel, Form, Stacks, Container).
 * It recursively generates code for all child components nested within the container.
 */
export class ContainerGenerator extends BaseComponentGenerator {
    generate(component: AppComponent, allComponents: AppComponent[], appDef: AppDefinition): string {
        const children = allComponents.filter(c => c.parentId === component.id);
        const renderedChildren = children
            .map(child => ComponentGeneratorFactory.create(child.type).generate(child, allComponents, appDef))
            .join('\n');

        const containerProps = component.props as any;
        
        // Handle width and height - can be number (px) or string (percentage, etc.)
        const widthValue = containerProps.width;
        const heightValue = containerProps.height;
        let widthStyle: string | undefined;
        let heightStyle: string | undefined;
        
        if (widthValue !== undefined) {
            if (typeof widthValue === 'string' && (widthValue.includes('%') || widthValue.includes('px') || widthValue.includes('rem') || widthValue.includes('em'))) {
                // Already has units, use as-is (but translate expression if needed)
                widthStyle = translateExpression(widthValue, appDef, 'raw-js');
            } else {
                // Number or expression, add px
                widthStyle = `\`\${${translateExpression(widthValue, appDef, 'raw-js')}}px\``;
            }
        }
        
        if (heightValue !== undefined) {
            if (typeof heightValue === 'string' && (heightValue.includes('%') || heightValue.includes('px') || heightValue.includes('rem') || heightValue.includes('em'))) {
                // Already has units, use as-is (but translate expression if needed)
                heightStyle = translateExpression(heightValue, appDef, 'raw-js');
            } else {
                // Number or expression, add px
                heightStyle = `\`\${${translateExpression(heightValue, appDef, 'raw-js')}}px\``;
            }
        }
        
        // Build background style - prioritize backgroundImage, then backgroundGradient, then backgroundColor
        const backgroundImage = translateExpression(containerProps.backgroundImage, appDef, 'raw-js');
        const backgroundGradient = translateExpression(containerProps.backgroundGradient, appDef, 'raw-js');
        const backgroundColor = translateExpression(containerProps.backgroundColor, appDef, 'raw-js');
        
        // Outer div: position absolute for page positioning (handled by BaseComponentGenerator)
        // Only override width/height if they were handled specially
        let outerStyle: Record<string, any> = {};
        if (widthStyle) {
            outerStyle.width = widthStyle;
        }
        if (heightStyle) {
            outerStyle.height = heightStyle;
        }
        
        // Inner div: position relative with all container styling (padding, border, background, etc.)
        let innerStyle: Record<string, any> = {
            position: `'relative'`, // Required for absolute positioning of children
            width: `'100%'`, // Fill the width allocated by parent
            height: `'100%'`, // Fill the height allocated by parent
            boxSizing: `'border-box'`,
        };
        
        // Add background styles to inner div
        if (backgroundImage && backgroundImage !== 'undefined' && backgroundImage !== '""') {
            innerStyle.backgroundImage = `\`url(\${${backgroundImage}})\``;
            innerStyle.backgroundSize = `'cover'`;
            innerStyle.backgroundPosition = `'center'`;
            innerStyle.backgroundRepeat = `'no-repeat'`;
        } else if (backgroundGradient && backgroundGradient !== 'undefined' && backgroundGradient !== '""') {
            innerStyle.background = backgroundGradient;
        } else if (backgroundColor && backgroundColor !== 'undefined' && backgroundColor !== '""') {
            innerStyle.backgroundColor = backgroundColor;
        }
        
        // Add container-specific styles to inner div (padding, opacity, boxShadow, borders)
        const padding = translateExpression(containerProps.padding, appDef, 'raw-js');
        if (padding && padding !== 'undefined' && padding !== '""') {
            innerStyle.padding = padding;
        }
        
        const opacity = translateExpression(containerProps.opacity, appDef, 'raw-js');
        if (opacity !== undefined && opacity !== 'undefined' && opacity !== '""') {
            innerStyle.opacity = opacity;
        }
        
        const boxShadow = translateExpression(containerProps.boxShadow, appDef, 'raw-js');
        if (boxShadow && boxShadow !== 'undefined' && boxShadow !== '""') {
            innerStyle.boxShadow = boxShadow;
        }
        
        // Add border properties to inner div
        const borderProps = containerProps as any;
        ['borderRadius', 'borderWidth', 'borderColor', 'borderStyle'].forEach(prop => {
            if (borderProps[prop] !== undefined) {
                const value = translateExpression(borderProps[prop], appDef, 'raw-js');
                if (value !== undefined && value !== 'undefined' && value !== '""') {
                    innerStyle[prop] = value;
                }
            }
        });
        // Individual border side properties
        ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'].forEach(prop => {
            if (borderProps[prop] !== undefined) {
                const value = translateExpression(borderProps[prop], appDef, 'raw-js');
                if (value !== undefined && value !== 'undefined' && value !== '""') {
                    innerStyle[prop] = value;
                }
            }
        });
        
        // Add min/max dimensions to outer div (for container sizing)
        if (containerProps.minWidth) {
            outerStyle.minWidth = translateExpression(containerProps.minWidth, appDef, 'raw-js');
        }
        if (containerProps.maxWidth) {
            outerStyle.maxWidth = translateExpression(containerProps.maxWidth, appDef, 'raw-js');
        }
        if (containerProps.minHeight) {
            outerStyle.minHeight = translateExpression(containerProps.minHeight, appDef, 'raw-js');
        }
        if (containerProps.maxHeight) {
            outerStyle.maxHeight = translateExpression(containerProps.maxHeight, appDef, 'raw-js');
        }
        
        // Add z-index to outer div (for stacking order)
        if (containerProps.zIndex !== undefined) {
            outerStyle.zIndex = translateExpression(containerProps.zIndex, appDef, 'raw-js');
        }
        
        // Add overflow to inner div (clip children to container bounds)
        innerStyle.overflow = `'hidden'`;

        // Generate outer div style (positioning only, excluding container-specific styles)
        const outerBaseStyle: Record<string, any> = {
            position: `'absolute'`,
            left: `\`${containerProps.x}px\``,
            top: `\`${containerProps.y}px\``,
            width: widthStyle || `\`${containerProps.width}px\``,
            height: heightStyle || `\`${containerProps.height}px\``,
        };
        
        // Add margin to outer div if specified
        const margin = translateExpression(containerProps.margin, appDef, 'raw-js');
        if (margin && margin !== 'undefined' && margin !== '""') {
            outerBaseStyle.margin = margin;
        }
        
        const finalOuterStyles = { ...outerBaseStyle, ...outerStyle };
        const outerStyleContent = Object.entries(finalOuterStyles)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');

        // Generate outer div attributes (positioning)
        const outerAttributes = [
            ...this.getCommonAttributes(component, appDef),
            `style={{ ${outerStyleContent} }}`
        ];
        
        // Add custom attributes to outer div if specified
        if (containerProps.customAttributes) {
            try {
                const customAttrs = typeof containerProps.customAttributes === 'string' 
                    ? JSON.parse(containerProps.customAttributes) 
                    : containerProps.customAttributes;
                if (typeof customAttrs === 'object' && customAttrs !== null) {
                    Object.entries(customAttrs).forEach(([key, value]) => {
                        outerAttributes.push(`${key}={${JSON.stringify(value)}}`);
                    });
                }
            } catch (e) {
                // Invalid JSON, ignore
            }
        }

        // Generate inner div with container styling
        const innerStyleContent = Object.entries(innerStyle)
            .filter(([, value]) => value !== undefined && value !== '""' && value !== "''" && value !== "``" && value !== null)
            .map(([key, value]) => `${toCamelCase(key)}: ${value}`)
            .join(', ');
        
        const innerDiv = `<div style={{ ${innerStyleContent} }}>\n${renderedChildren}\n</div>`;

        return this.buildTag('div', outerAttributes, `\n${innerDiv}\n`);
    }
}
