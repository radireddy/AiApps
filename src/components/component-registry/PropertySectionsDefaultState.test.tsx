import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComponentType } from 'types';
import '@testing-library/jest-dom';

// Import all component property components
import { ButtonPlugin } from '@/components/component-registry/Button';
import { CheckboxPlugin } from '@/components/component-registry/Checkbox';
import { InputPlugin } from '@/components/component-registry/Input';
import { LabelPlugin } from '@/components/component-registry/Label';
import { PanelPlugin } from '@/components/component-registry/Panel';
import { ImagePlugin } from '@/components/component-registry/Image';
import { TextareaPlugin } from '@/components/component-registry/Textarea';
import { SelectPlugin } from '@/components/component-registry/Select';
import { SwitchPlugin } from '@/components/component-registry/Switch';
import { RadioGroupPlugin } from '@/components/component-registry/RadioGroup';
import { TablePlugin } from '@/components/component-registry/Table';

describe('Property Sections Default State', () => {
  const mockUpdateProp = jest.fn();
  const mockOnOpenExpressionEditor = jest.fn();
  const mockDataSources = [{ id: 'test', providerId: 'MOCK', config: {} }];
  const mockVariables = [{ id: 'var1', name: 'testVar', type: 'boolean', initialValue: false }];

  const getBaseComponent = (type: ComponentType, props: any = {}) => ({
    id: 'test-component',
    type,
    props: {
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      ...props,
    },
  });

  describe('Button Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.BUTTON, { text: 'Test', actionType: 'none' });
      render(
        <ButtonPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          dataSources={mockDataSources}
          variables={mockVariables}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Events section is expanded
      const eventsSection = screen.getByRole('button', { name: /Events/i });
      expect(eventsSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Panel Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.PANEL, { backgroundColor: '#ffffff' });
      render(
        <PanelPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Container Layout Specific section is expanded
      const containerLayoutSection = screen.getByRole('button', { name: 'Container Layout Specific' });
      expect(containerLayoutSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Input Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.INPUT, { placeholder: 'Test', dataStoreKey: 'test' });
      render(
        <InputPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Input Form And Validation section is expanded
      const inputValueSection = screen.getByRole('button', { name: /Input Form And Validation/i });
      expect(inputValueSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Label Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.LABEL, { text: 'Test Label' });
      render(
        <LabelPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Checkbox Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.CHECKBOX, { label: 'Test', dataStoreKey: 'test' });
      render(
        <CheckboxPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Input Form And Validation section is expanded
      const inputValueSection = screen.getByRole('button', { name: /Input Form And Validation/i });
      expect(inputValueSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Switch Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.SWITCH, { label: 'Test', dataStoreKey: 'test' });
      render(
        <SwitchPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('RadioGroup Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.RADIO_GROUP, { options: 'A,B', dataStoreKey: 'test' });
      render(
        <RadioGroupPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Data section is expanded (if visible)
      const dataSection = screen.queryByRole('button', { name: /Data/i });
      if (dataSection) {
        expect(dataSection).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  describe('Table Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.TABLE, { columns: 'Name:name', dataSourceName: 'test' });
      render(
        <TablePlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          dataSources={mockDataSources}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Data section is expanded
      const dataSection = screen.getByRole('button', { name: /Data/i });
      expect(dataSection).toHaveAttribute('aria-expanded', 'true');

      // Check that On Row Select section is expanded
      const rowSelectSection = screen.getByRole('button', { name: /On Row Select/i });
      expect(rowSelectSection).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Image Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.IMAGE, { src: 'test.jpg', alt: 'Test' });
      render(
        <ImagePlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Media section is expanded (if visible)
      const mediaSection = screen.queryByRole('button', { name: /Media/i });
      if (mediaSection) {
        expect(mediaSection).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  describe('Select Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.SELECT, { options: 'A,B', dataStoreKey: 'test' });
      render(
        <SelectPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Data section is expanded (if visible)
      const dataSection = screen.queryByRole('button', { name: /Data/i });
      if (dataSection) {
        expect(dataSection).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  describe('Textarea Component', () => {
    it('should have all sections expanded by default', () => {
      const component = getBaseComponent(ComponentType.TEXTAREA, { placeholder: 'Test', dataStoreKey: 'test' });
      render(
        <TextareaPlugin.properties
          component={component}
          updateProp={mockUpdateProp}
          onOpenExpressionEditor={mockOnOpenExpressionEditor}
        />
      );

      // Check that Basic section is expanded
      const basicSection = screen.getByRole('button', { name: 'Basic' });
      expect(basicSection).toHaveAttribute('aria-expanded', 'true');

      // Check that Input Form And Validation section is expanded
      const inputValueSection = screen.getByRole('button', { name: /Input Form And Validation/i });
      expect(inputValueSection).toHaveAttribute('aria-expanded', 'true');
    });
  });
});



