import { ComponentType, ComponentPlugin } from '../../types';
import { ButtonPlugin } from './Button';
import { CheckboxPlugin } from './Checkbox';
import { DividerPlugin } from './Divider';
import { FormPlugin } from './Form';
import { HStackPlugin } from './HStack';
import { ImagePlugin } from './Image';
import { InputPlugin } from './Input';
import { LabelPlugin } from './Label';
import { PanelPlugin } from './Panel';
import { RadioGroupPlugin } from './RadioGroup';
import { SelectPlugin } from './Select';
import { SwitchPlugin } from './Switch';
import { TablePlugin } from './Table';
import { TextareaPlugin } from './Textarea';
import { VStackPlugin } from './VStack';
import { ModalPlugin } from './Modal';
import React from 'react';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
    [ComponentType.PANEL]: PanelPlugin,
    [ComponentType.FORM]: FormPlugin,
    [ComponentType.H_STACK]: HStackPlugin,
    [ComponentType.V_STACK]: VStackPlugin,
    [ComponentType.TABLE]: TablePlugin,
    [ComponentType.LABEL]: LabelPlugin,
    [ComponentType.INPUT]: InputPlugin,
    [ComponentType.BUTTON]: ButtonPlugin,
    [ComponentType.IMAGE]: ImagePlugin,
    [ComponentType.TEXTAREA]: TextareaPlugin,
    [ComponentType.SELECT]: SelectPlugin,
    [ComponentType.CHECKBOX]: CheckboxPlugin,
    [ComponentType.DIVIDER]: DividerPlugin,
    [ComponentType.RADIO_GROUP]: RadioGroupPlugin,
    [ComponentType.SWITCH]: SwitchPlugin,
    [ComponentType.MODAL]: ModalPlugin,
};