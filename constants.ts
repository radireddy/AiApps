import { ComponentType, PaletteComponent } from './types';
import React from 'react';

// Common icon style
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

export const commonStylingProps = {
  opacity: 1,
  boxShadow: '',
  borderRadius: '{{theme.radius.default}}',
  borderWidth: '{{theme.border.width}}',
  borderColor: '{{theme.colors.border}}',
  borderStyle: '{{theme.border.style}}',
};
