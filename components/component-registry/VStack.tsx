
import React from 'react';
import { ComponentType, VStackProps, ComponentPlugin } from '../../types';
import { FormPlugin } from './Form'; // Re-use form's logic for panel-like containers
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

export const VStackPlugin: ComponentPlugin = {
  ...FormPlugin, // Inherit container logic from Form/Panel
  type: ComponentType.V_STACK,
  paletteConfig: {
    ...FormPlugin.paletteConfig,
    label: 'V-Stack',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", transform:"rotate(90)" }, React.createElement('path', {d:"M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z", stroke: "currentColor", strokeWidth:"2", strokeLinejoin:"round"})),
    defaultProps: {
        ...commonStylingProps,
        width: 200,
        height: 300,
        backgroundColor: '{{theme.colors.surface}}',
        borderColor: '{{theme.colors.primary}}',
        borderStyle: 'dashed',
    }
  },
};