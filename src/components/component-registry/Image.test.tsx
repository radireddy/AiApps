import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePlugin } from './Image';
import { ComponentType } from '../../types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

const ImageRenderer = ImagePlugin.renderer;
const ImageProperties = ImagePlugin.properties;

describe('ImagePlugin', () => {
  describe('Renderer', () => {
    const baseComponent = {
      id: 'image1',
      type: ComponentType.IMAGE,
      props: {
        x: 0, y: 0, width: 200, height: 150,
        src: 'https://example.com/image.png',
        alt: 'An example image',
        objectFit: 'contain' as const,
      },
    };

    it('should render an img element with correct src and alt', () => {
      render(<ImageRenderer component={baseComponent} evaluationScope={{}} />);
      const img = screen.getByAltText('An example image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.png');
    });

    it('should apply objectFit style', () => {
      render(<ImageRenderer component={baseComponent} evaluationScope={{}} />);
      const img = screen.getByAltText('An example image');
      expect(img).toHaveStyle('object-fit: contain');
    });
  });

  describe('Properties', () => {
    const updateProp = jest.fn();
    const onOpenExpressionEditor = jest.fn();
    const baseProps = {
      component: {
        id: 'img1',
        props: {
          src: 'https://example.com/image.png',
          alt: 'An example image',
          objectFit: 'cover' as const,
        } as any,
      },
      updateProp,
      onOpenExpressionEditor,
    };

    it('should render properties correctly', () => {
      render(<ImageProperties {...baseProps} />);
      expect(screen.getByLabelText('Image URL')).toHaveValue('https://example.com/image.png');
      expect(screen.getByLabelText('Alt Text')).toHaveValue('An example image');
      expect(screen.getByLabelText('Object Fit')).toHaveValue('cover');
    });

    it('should call updateProp when src is changed', async () => {
      render(<ImageProperties {...baseProps} />);
      const input = screen.getByLabelText('Image URL');
      await userEvent.clear(input);
      await userEvent.type(input, 'new_url.jpg');
      expect(updateProp).toHaveBeenLastCalledWith('src', 'new_url.jpg');
    });

    it('should call updateProp when object fit is changed', async () => {
      render(<ImageProperties {...baseProps} />);
      const select = screen.getByLabelText('Object Fit');
      await userEvent.selectOptions(select, 'contain');
      expect(updateProp).toHaveBeenCalledWith('objectFit', 'contain');
    });
  });
});