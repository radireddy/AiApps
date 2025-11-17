import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from './Editor';
import { storageService } from './storageService';
import { generateAppLayout } from './services/geminiService';
import { AppDefinition, ComponentType } from './types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

jest.mock('./storageService');
jest.mock('./services/geminiService');

const mockApp: AppDefinition = {
  id: 'app1',
  name: 'Test App',
  createdAt: new Date().toISOString(),
  lastModifiedAt: new Date().toISOString(),
  pages: [{ id: 'page1', name: 'Main Page' }],
  mainPageId: 'page1',
  components: [
    { id: 'comp1', type: ComponentType.LABEL, pageId: 'page1', props: { text: 'Hello', x: 10, y: 10, width: 100, height: 30 } as any },
  ],
  dataStore: {},
  dataSources: [],
  variables: [],
  theme: {} as any,
};

const mockedStorageService = storageService as jest.Mocked<typeof storageService>;
// FIX: Add a generic type to the mock to avoid 'never' type errors.
const mockedGenerateAppLayout = generateAppLayout as jest.Mock<Promise<AppDefinition | null>>;

describe('Editor', () => {
  beforeEach(() => {
    mockedStorageService.getApp.mockResolvedValue(mockApp);
    mockedStorageService.getAllThemes.mockResolvedValue([]);
    mockedStorageService.saveApp.mockResolvedValue(mockApp);
    mockedGenerateAppLayout.mockResolvedValue(null);
  });

  it('should show a loading state and then render the editor', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    expect(screen.getByText('Loading Editor...')).toBeInTheDocument();
    expect(await screen.findByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByLabelText('Application design canvas')).toBeInTheDocument();
  });

  it('should switch between editor and preview modes', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    // Check for an element specific to the editor
    expect(screen.getByText('Components')).toBeInTheDocument();
    
    // Switch to preview
    const previewButton = screen.getByRole('button', { name: /Preview/i });
    await userEvent.click(previewButton);

    // Check for an element specific to the preview
    expect(await screen.findByLabelText('Application Preview')).toBeInTheDocument();
    expect(screen.queryByText('Components')).not.toBeInTheDocument();
    
    // Switch back to editor
    const editorButton = screen.getByRole('button', { name: /Editor/i });
    await userEvent.click(editorButton);
    expect(await screen.findByText('Components')).toBeInTheDocument();
  });

  it('should call onBack when the back button is clicked', async () => {
    const onBack = jest.fn();
    render(<Editor appId="app1" onBack={onBack} />);
    await screen.findByText('Test App');
    
    const backButton = screen.getByRole('button', { name: /Apps/i });
    await userEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should call generateAppLayout when AI prompt is submitted', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');

    const input = screen.getByPlaceholderText(/e.g., A user profile card/i);
    await userEvent.type(input, 'a login form');
    
    const generateButton = screen.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateButton);

    expect(mockedGenerateAppLayout).toHaveBeenCalledWith('a login form', expect.any(Object), 'page1');
  });

  it('should delete a selected component when delete key is pressed', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    // Simulate selecting the component
    const component = await screen.findByLabelText('LABEL component');
    await userEvent.click(component);

    // Press delete key
    await userEvent.keyboard('{Delete}');

    // The component should be gone
    await waitFor(() => {
        expect(screen.queryByLabelText('LABEL component')).not.toBeInTheDocument();
    });
  });

   it('should switch between left panel tabs', async () => {
    render(<Editor appId="app1" onBack={() => {}} />);
    await screen.findByText('Test App');
    
    expect(screen.getByRole('heading', {name: 'Explorer'})).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Components'}));
    expect(await screen.findByRole('heading', {name: 'Components'})).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Explorer'})).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Data'}));
    expect(await screen.findByRole('heading', {name: 'Data Sources'})).toBeInTheDocument();
  });
});