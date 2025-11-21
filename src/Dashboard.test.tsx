import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/Dashboard';
import { storageService } from '@/storageService';
import { AppMetadata, AppTemplate } from 'types';
// FIX: Import jest-dom to extend jest matchers.
import '@testing-library/jest-dom';

jest.mock('@/storageService');
const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

const mockApps: AppMetadata[] = [
  { id: 'app1', name: 'My First App', createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString() },
  { id: 'app2', name: 'Another App', createdAt: new Date().toISOString(), lastModifiedAt: new Date().toISOString() },
];

const mockTemplates: AppTemplate[] = [
    { id: 'template1', name: 'User Profile Template', description: 'A simple template.', imageUrl: 'image.png', appDefinition: {} as any },
];

describe('Dashboard', () => {
  let onEditApp: jest.Mock;
  let onCreateApp: jest.Mock;

  beforeEach(() => {
    onEditApp = jest.fn();
    onCreateApp = jest.fn();
    mockedStorageService.getAllAppsMetadata.mockResolvedValue(mockApps);
    mockedStorageService.getAllThemes.mockResolvedValue([]);
    mockedStorageService.getAllTemplates.mockResolvedValue(mockTemplates);
    mockedStorageService.createApp.mockResolvedValue({ id: 'new_app', name: 'New App' } as any);
  });

  it('should render apps and templates on load', async () => {
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    expect(await screen.findByText('My First App')).toBeInTheDocument();
    expect(screen.getByText('Another App')).toBeInTheDocument();
    expect(screen.getByText('User Profile Template')).toBeInTheDocument();
  });
  
  it('should show a message when no apps are found', async () => {
    mockedStorageService.getAllAppsMetadata.mockResolvedValue([]);
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    expect(await screen.findByText('No applications found')).toBeInTheDocument();
  });

  it('should open the create app modal when "Create New App" is clicked', async () => {
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    await userEvent.click(screen.getByText('Create New App'));
    expect(screen.getByRole('heading', { name: 'Create New Application' })).toBeInTheDocument();
  });

  it('should call onCreateApp when a new app is created via modal', async () => {
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    await userEvent.click(screen.getByText('Create New App'));
    
    await userEvent.type(screen.getByPlaceholderText('e.g., Customer Dashboard'), 'A brand new app');
    await userEvent.click(screen.getByRole('button', { name: 'Create App' }));

    expect(mockedStorageService.createApp).toHaveBeenCalledWith('A brand new app', undefined);
    expect(onCreateApp).toHaveBeenCalledWith({ id: 'new_app', name: 'New App' });
  });

  it('should open the template selection modal', async () => {
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    await userEvent.click(screen.getByRole('button', { name: /Create New App/i }).nextElementSibling!);
    await userEvent.click(screen.getByText('Create from Template'));

    const heading = await screen.findByRole('heading', { name: 'Create App from Template'});
    const templateModal = heading.closest('div') as HTMLElement;
    expect(templateModal).toBeInTheDocument();
    expect(within(templateModal).getByText('User Profile Template')).toBeInTheDocument();
  });

  it('should create an app from a template', async () => {
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    await userEvent.click(screen.getByRole('button', { name: /Create New App/i }).nextElementSibling!);
    await userEvent.click(screen.getByText('Create from Template'));

    const heading = await screen.findByRole('heading', { name: 'Create App from Template'});
    const templateModal = heading.closest('div') as HTMLElement;
    await userEvent.click(within(templateModal).getByText('User Profile Template'));
    // TemplateSelectionModal closes, CreateAppModal opens
    await userEvent.type(await screen.findByPlaceholderText('e.g., Customer Dashboard'), 'App From My Template');
    await userEvent.click(screen.getByRole('button', { name: 'Create App' }));

    expect(mockedStorageService.createApp).toHaveBeenCalledWith('App From My Template', mockTemplates[0].appDefinition);
    expect(onCreateApp).toHaveBeenCalled();
  });

  it('should open delete confirmation modal and delete an app', async () => {
    mockedStorageService.deleteApp.mockResolvedValue();
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    const appCard = await screen.findByText('My First App');
    const menuButton = appCard.closest('.flex-grow')?.nextElementSibling?.querySelector('div.relative button') as HTMLElement;
    
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByText('Delete'));

    expect(screen.getByRole('heading', { name: 'Delete Application' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockedStorageService.deleteApp).toHaveBeenCalledWith('app1');
    await waitFor(() => {
        expect(screen.queryByText('My First App')).not.toBeInTheDocument();
    });
  });

  it('should open rename modal and rename an app', async () => {
    mockedStorageService.renameApp.mockResolvedValue({} as any);
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);

    const appCard = await screen.findByText('My First App');
    const menuButton = appCard.closest('.flex-grow')?.nextElementSibling?.querySelector('div.relative button') as HTMLElement;
    
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByText('Rename'));

    const input = screen.getByDisplayValue('My First App');
    await userEvent.clear(input);
    await userEvent.type(input, 'Renamed App');
    await userEvent.click(screen.getByText('Save Changes'));

    expect(mockedStorageService.renameApp).toHaveBeenCalledWith('app1', 'Renamed App');
  });

  it('should handle saving an app as a template', async () => {
    const fullAppDef = { id: 'app1', name: 'My First App', components: [] } as any;
    mockedStorageService.getApp.mockResolvedValue(fullAppDef);
    mockedStorageService.saveTemplate.mockResolvedValue({} as any);
    render(<Dashboard onEditApp={onEditApp} onCreateApp={onCreateApp} />);
    
    const appCard = await screen.findByText('My First App');
    const menuButton = appCard.closest('.flex-grow')?.nextElementSibling?.querySelector('div.relative button') as HTMLElement;
    
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByText('Save as Template'));

    await screen.findByRole('heading', {name: 'Save as Template'});
    await userEvent.type(screen.getByLabelText('Description'), 'My awesome template');
    await userEvent.click(screen.getByText('Save Template'));

    expect(mockedStorageService.saveTemplate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My First App Template',
        description: 'My awesome template',
        appDefinition: fullAppDef
    }));
  });
});