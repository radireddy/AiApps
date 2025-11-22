
import React from 'react';
import { ComponentType, VStackProps, ComponentPlugin } from '../../types';
import { createPanelPlugin } from './Panel';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/**
 * V-Stack Plugin
 * A Panel-based component with default vertical direction.
 * This is a shortcut component that creates a Panel with direction set to 'vertical' by default.
 * Users can still change the direction, justify, and align settings in the properties panel.
 */
export const VStackPlugin: ComponentPlugin = createPanelPlugin<VStackProps>({
  type: ComponentType.V_STACK,
  label: 'Vertical Panel', // Display as "Vertical Panel" in the palette
  icon: React.createElement('svg', { 
    style: iconStyle, 
    viewBox: "0 0 24 24", 
    fill: "none", 
    xmlns: "http://www.w3.org/2000/svg",
    transform: "rotate(90)"
  }, React.createElement('path', {
    d: "M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z", 
    stroke: "currentColor", 
    strokeWidth: "2", 
    strokeLinejoin: "round"
  })),
  defaultProps: {
    ...commonStylingProps,
    width: 200,
    height: 300,
    backgroundColor: '{{theme.colors.surface}}',
    borderColor: '{{theme.colors.primary}}',
    borderStyle: 'dashed',
    // V-Stack specific defaults - vertical direction by default
    direction: 'vertical',
    justifyContent: 'start',
    alignItems: 'center',
  },
  // No fixedDirection - allow users to change direction in properties
});
