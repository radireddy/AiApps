
import React from 'react';
import { ComponentType, HStackProps, ComponentPlugin } from '../../types';
import { createPanelPlugin } from './Panel';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/**
 * H-Stack Plugin
 * A Panel-based component with default horizontal direction.
 * This is a shortcut component that creates a Panel with direction set to 'horizontal' by default.
 * Users can still change the direction, justify, and align settings in the properties panel.
 */
export const HStackPlugin: ComponentPlugin = createPanelPlugin<HStackProps>({
  type: ComponentType.H_STACK,
  label: 'Horizontal Panel', // Display as "Horizontal Panel" in the palette
  icon: React.createElement('svg', { 
    style: iconStyle, 
    viewBox: "0 0 24 24", 
    fill: "none", 
    xmlns: "http://www.w3.org/2000/svg"
  }, React.createElement('path', {
    d: "M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z", 
    stroke: "currentColor", 
    strokeWidth: "2", 
    strokeLinejoin: "round"
  })),
  defaultProps: {
    ...commonStylingProps,
    width: 400,
    height: 100,
    backgroundColor: '{{theme.colors.surface}}',
    borderColor: '{{theme.colors.secondary}}',
    borderStyle: 'dashed',
    // H-Stack specific defaults - horizontal direction by default
    direction: 'horizontal',
    justifyContent: 'start',
    alignItems: 'center',
  },
  // No fixedDirection - allow users to change direction in properties
});
