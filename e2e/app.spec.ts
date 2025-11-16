import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import v8to from 'v8-to-istanbul';

const NYC_OUTPUT_DIR = path.join(process.cwd(), '.nyc_output');

// Clean up the output directory before all tests run
test.beforeAll(async () => {
  if (fs.existsSync(NYC_OUTPUT_DIR)) {
    fs.rmSync(NYC_OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(NYC_OUTPUT_DIR, { recursive: true });
});


test.describe('Gemini Low-Code App Builder E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start V8 code coverage collection
    await page.coverage.startJSCoverage();

    // Navigate to the dashboard before each test
    await page.goto('/');
    // Clear local storage to ensure a clean state for each test
    await page.evaluate(() => window.localStorage.clear());
    // Reload to apply the cleared storage
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    // Stop V8 code coverage collection
    const coverage = await page.coverage.stopJSCoverage();
    const istanbulCoverage = {};

    for (const entry of coverage) {
      const url = new URL(entry.url);
      // We are only interested in files from our application, served from localhost
      if (!url.hostname.includes('localhost') || !entry.source) {
        continue;
      }
      
      // Map the URL path to a file system path.
      // e.g., http://localhost:3000/App.tsx -> /path/to/project/src/App.tsx
      const filePath = path.join(process.cwd(), url.pathname.substring(1));

      if (!fs.existsSync(filePath)) {
          continue;
      }

      try {
        // Convert the V8 coverage data to the Istanbul format
        const converter = v8to(filePath, 0, { source: entry.source });
        await converter.applyCoverage(entry.functions);
        // Merge the coverage data for this script into our collection
        Object.assign(istanbulCoverage, converter.toIstanbul());
      } catch (e) {
        console.error(`Failed to process coverage for ${filePath}`, e);
      }
    }
    
    // Write the collected Istanbul coverage data to a unique file in the .nyc_output directory
    if (Object.keys(istanbulCoverage).length > 0) {
      fs.writeFileSync(
        path.join(NYC_OUTPUT_DIR, `coverage-${crypto.randomUUID()}.json`),
        JSON.stringify(istanbulCoverage)
      );
    }
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
    await page.getByTestId('prop-input-Data Store Key').locator('input').fill('userName');
    
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
    const templateCard = page.locator('h2:has-text("App Templates")').locator('..').locator('.grid > div').filter({ hasText: `${appName} Template` });
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