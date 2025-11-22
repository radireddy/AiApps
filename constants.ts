import { ComponentType, PaletteComponent } from './types';
import React from 'react';

// Common icon style
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

// Global Typography Configuration
// This configuration can be changed in one place to affect the entire application
// Individual components can override these values when needed
export const typography = {
  // Text sizes
  xs: 'text-[10px]',      // Extra small - for labels, captions, group titles
  sm: 'text-[11px]',      // Small - for input text, body text, labels
  base: 'text-[12px]',   // Base - for regular content
  md: 'text-[13px]',      // Medium - for headings
  lg: 'text-[14px]',      // Large - for larger headings
  xl: 'text-[16px]',     // Extra large - for main headings
  
  // Font weights
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  
  // Line heights (if needed)
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// Typography utility function to get text size class
// Allows for easy override when needed
export const getTextSize = (size: keyof typeof typography, override?: string): string => {
  return override || typography[size];
};

export const commonStylingProps = {
  opacity: 1,
  boxShadow: '',
  borderRadius: '{{theme.radius.default}}',
  borderWidth: '{{theme.border.width}}',
  borderColor: '{{theme.colors.border}}',
  borderStyle: '{{theme.border.style}}',
};
