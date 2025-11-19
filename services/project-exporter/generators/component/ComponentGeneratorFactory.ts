
import { ComponentType } from '../../../../types';
import { IComponentGeneratorStrategy } from './ComponentGeneratorStrategy';
import { ContainerGenerator } from './implementations/ContainerGenerators';
import { ButtonGenerator, InputGenerator } from './implementations/InputGenerators';
import { LabelGenerator, ImageGenerator, FallbackGenerator } from './implementations/DisplayGenerators';

/**
 * Factory class responsible for instantiating the correct component generator based on component type.
 * This uses the Strategy and Factory design patterns to decouple generation logic.
 */
export class ComponentGeneratorFactory {
    private static generators: Partial<Record<ComponentType, IComponentGeneratorStrategy>> = {
        [ComponentType.PANEL]: new ContainerGenerator(),
        [ComponentType.FORM]: new ContainerGenerator(),
        [ComponentType.H_STACK]: new ContainerGenerator(),
        [ComponentType.V_STACK]: new ContainerGenerator(),
        [ComponentType.MODAL]: new ContainerGenerator(), // Treated as container
        [ComponentType.LABEL]: new LabelGenerator(),
        [ComponentType.INPUT]: new InputGenerator(),
        [ComponentType.BUTTON]: new ButtonGenerator(),
        [ComponentType.IMAGE]: new ImageGenerator(),
        // Add other mappings here
    };

    private static fallback = new FallbackGenerator();

    /**
     * Returns the generator strategy for a given component type.
     * @param type The component type to generate code for.
     */
    public static create(type: ComponentType): IComponentGeneratorStrategy {
        return this.generators[type] || this.fallback;
    }
}
