import { test, expect, Page, Locator } from '@playwright/test';

test.describe('Gemini Low-Code App Builder E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/');
    // Clear local storage to ensure a clean state for each test
    await page.evaluate(() => window.localStorage.clear());
    // Reload to apply the cleared storage
    await page.goto('/');
  });

  test('App Lifecycle: Create, Verify, and Delete an App', async ({ page }) => {
    const newAppName = `My Test App - ${Date.now()}`;

    // 1. Create a new app
    await page.getByRole('button', { name: 'Create New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(newAppName);
    await page.getByRole('button', { name: 'Create App' }).click();

    // 2. Verify we are in the editor for the new app
    await expect(page.getByRole('heading', { name: newAppName })).toBeVisible();

    // 3. Go back to the dashboard
    await page.getByRole('button', { name: 'Apps' }).click();

    // 4. Verify the new app card is on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    const appCard = page.locator('.grid > div').filter({ hasText: newAppName });
    await expect(appCard).toBeVisible();

    // 5. Delete the app
    await appCard.getByRole('button').nth(1).click(); // Click the kebab menu
    await page.getByText('Delete').click();
    await expect(page.getByRole('heading', { name: 'Delete Application' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // 6. Verify the app card is gone
    await expect(appCard).not.toBeVisible();
  });

  test('Core Editor Workflow: Drag, Drop, Bind Props, and Preview', async ({ page }) => {
    const appName = 'Data Binding Test';

    // Create a new app
    await page.getByRole('button', { name: 'Create New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
    await page.getByRole('button', { name: 'Create App' }).click();
    await expect(page.getByRole('heading', { name: appName })).toBeVisible();
    
    const canvas = page.getByTestId('canvas');

    // Drag and drop an Input component
    await page.getByTestId('palette-item-INPUT').dragTo(canvas, {
      targetPosition: { x: 100, y: 100 },
    });
    
    // Configure the Input
    const inputComponent = page.getByLabel('INPUT component');
    await inputComponent.click();
    await expect(page.getByTestId('properties-panel')).toBeVisible();
    await page.getByTestId('prop-input-Data Store Key').fill('userName');
    
    // Drag and drop a Label component
    await page.getByTestId('palette-item-LABEL').dragTo(canvas, {
      targetPosition: { x: 100, y: 200 },
    });
    
    // Configure the Label
    const labelComponent = page.getByLabel('LABEL component');
    await labelComponent.click();
    await page.getByTestId('prop-fx-input-Text').getByRole('button', { name: 'fx' }).click();
    await page.getByTestId('prop-fx-input-Text').locator('input').fill(`{{ 'Hello, ' + (userName || 'World') }}`);

    // Drag and drop a Button component
    await page.getByTestId('palette-item-BUTTON').dragTo(canvas, {
        targetPosition: { x: 100, y: 300 },
    });

    // Configure the Button
    const buttonComponent = page.getByLabel('BUTTON component');
    await buttonComponent.click();
    await page.getByLabel('Action Type').selectOption('alert');
    await page.getByTestId('prop-fx-input-Alert Message').getByRole('button', { name: 'fx' }).click();
    await page.getByTestId('prop-fx-input-Alert Message').locator('input').fill(`{{ 'Greetings, ' + userName }}`);


    // Switch to Preview Mode
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByLabel('Application Preview')).toBeVisible();
    
    const previewFrame = page.locator('.relative.w-full');

    // Test data binding
    await expect(previewFrame.getByText('Hello, World')).toBeVisible();
    await previewFrame.getByRole('textbox').fill('Playwright');
    await expect(previewFrame.getByText('Hello, Playwright')).toBeVisible();

    // Test button action with an alert
    const dialogPromise = page.waitForEvent('dialog');
    await previewFrame.getByRole('button').click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Greetings, Playwright');
    await dialog.dismiss();
  });

  test('AI Generation Workflow', async ({ page }) => {
    const appName = 'AI Gen Test';

    // Mock the Gemini API response
    await page.route('**/models/gemini-2.5-flash:generateContent**', async route => {
      const json = {
        components: [{
            id: 'BUTTON_AI_1',
            type: 'BUTTON',
            props: { x: 100, y: 100, width: 150, height: 40, text: 'AI Generated Button' }
        }]
      };
      await route.fulfill({ json });
    });

    // Create a new app
    await page.getByRole('button', { name: 'Create New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
    await page.getByRole('button', { name: 'Create App' }).click();
    await expect(page.getByRole('heading', { name: appName })).toBeVisible();

    // Use the AI prompt bar
    await page.getByPlaceholder('e.g., A user profile card').fill('a button');
    await page.getByRole('button', { name: 'Generate' }).click();
    
    // Verify the AI-generated component appears on the canvas
    await expect(page.getByText('AI Generated Button')).toBeVisible();
  });

  test('Templating Workflow: Save and Use a Template', async ({ page }) => {
    const appName = 'Template Source App';
    const appFromTemplateName = 'My App From Template';

    // 1. Create a base app to be used as a template
    await page.getByRole('button', { name: 'Create New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
    await page.getByRole('button', { name: 'Create App' }).click();
    await page.getByTestId('palette-item-INPUT').dragTo(page.getByTestId('canvas'), {
        targetPosition: { x: 50, y: 50 },
    });
    await expect(page.getByLabel('INPUT component')).toBeVisible();

    // 2. Go back to dashboard and save as template
    await page.getByRole('button', { name: 'Apps' }).click();
    const appCard = page.locator('.grid > div').filter({ hasText: appName });
    await appCard.getByRole('button').nth(1).click();
    await page.getByText('Save as Template').click();
    await expect(page.getByRole('heading', { name: 'Save as Template' })).toBeVisible();
    await page.getByRole('button', { name: 'Save Template' }).click();

    // 3. Verify template exists
    const templateCard = page.locator('.grid > div').filter({ hasText: `${appName} Template` });
    await expect(templateCard).toBeVisible();

    // 4. Create a new app from the template
    await page.getByRole('button', { name: 'Create New App' }).locator('~ button').click(); // Click dropdown part
    await page.getByText('Create from Template').click();
    await expect(page.getByRole('heading', { name: 'Create App from Template' })).toBeVisible();
    await page.locator('.grid > div').filter({ hasText: `${appName} Template` }).click();

    // 5. Name the new app
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appFromTemplateName);
    await page.getByRole('button', { name: 'Create App' }).click();

    // 6. Verify we are in the new app's editor and the component from the template exists
    await expect(page.getByRole('heading', { name: appFromTemplateName })).toBeVisible();
    await expect(page.getByLabel('INPUT component')).toBeVisible();
  });

});
