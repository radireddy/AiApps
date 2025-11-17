import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import v8to from 'v8-to-istanbul';
import { Buffer } from 'buffer';

// @ts-ignore
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
      // @ts-ignore
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
        add: [{
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

  test('Import and Preview Workflow', async ({ page }) => {
    // @ts-ignore
    const loginAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'login_app.json'), 'utf-8');

    // 1. Simulate file import
    await page.locator('input[type="file"]').setInputFiles({
      name: 'login-app.json',
      mimeType: 'application/json',
      buffer: Buffer.from(loginAppJson)
    });

    // 2. Verify the app "Login" now exists on the dashboard
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // 3. Open the app in the editor
    const appCard = page.locator('.grid > div').filter({ hasText: 'Login' });
    await appCard.getByRole('button', { name: 'Edit App' }).click();

    // 4. Verify editor contents
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('INPUT component')).toHaveCount(2);
    await expect(page.getByLabel('BUTTON component')).toHaveCount(2);
    await expect(page.getByLabel('LABEL component')).toHaveCount(2);
    await expect(page.getByLabel('FORM component')).toHaveCount(1);
    
    // 5. Switch to Preview
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByLabel('Application Preview')).toBeVisible();

    // 6. Interact with the form in the preview
    const previewFrame = page.locator('.relative.w-full');
    const emailInput = previewFrame.getByPlaceholder('Username or Email');
    const passwordInput = previewFrame.getByPlaceholder('Password');

    const randomEmail = `test-${Date.now()}@example.com`;
    const randomPassword = `password${Date.now()}`;

    await emailInput.fill(randomEmail);
    await passwordInput.fill(randomPassword);

    // 7. Verify the inputs hold the new values
    await expect(emailInput).toHaveValue(randomEmail);
    await expect(passwordInput).toHaveValue(randomPassword);
  });

  test('Save as Template from Imported App Workflow', async ({ page }) => {
    // This test ensures the full flow from importing an app to making a template from it works.
    
    // 1. Import the Login App (to ensure it exists on the dashboard)
    // @ts-ignore
    const loginAppJson = fs.readFileSync(path.join(process.cwd(), 'e2e', 'assets', 'login_app.json'), 'utf-8');
    await page.locator('input[type="file"]').first().setInputFiles({
        name: 'login-app.json',
        mimeType: 'application/json',
        buffer: Buffer.from(loginAppJson)
    });
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    
    // 2. Find the app card, open its menu, and click "Save as Template"
    const appCard = page.locator('.grid > div').filter({ hasText: 'Login' });
    await appCard.getByRole('button').nth(1).click(); // Click the kebab menu
    await page.getByText('Save as Template').click();
    
    // 3. Fill out the "Save as Template" modal
    await expect(page.getByRole('heading', { name: 'Save as Template' })).toBeVisible();
    const templateName = `My Login Template - ${Date.now()}`;
    const templateDesc = `A reusable login form template.`;
    await page.getByLabel('Template Name').fill(templateName);
    await page.getByLabel('Description').fill(templateDesc);

    // 4. Upload a thumbnail image
    // @ts-ignore
    const imagePath = path.join(process.cwd(), 'e2e', 'assets', 'login_thumbnail.png');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload Image' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);

    // 5. Save the template
    await page.getByRole('button', { name: 'Save Template' }).click();
    
    // 6. Verify modal is closed and template card is visible
    await expect(page.getByRole('heading', { name: 'Save as Template' })).not.toBeVisible();
    const templateCard = page.locator('h2:has-text("App Templates")').locator('..').locator('.grid > div').filter({ hasText: templateName });
    await expect(templateCard).toBeVisible();

    // 7. Verify the thumbnail image exists and has a data URL source
    const thumbnail = templateCard.locator('img');
    await expect(thumbnail).toHaveAttribute('src', /^data:image\/png;base64,.+/);
  });

  test('Multi-select and Alignment Workflow', async ({ page }) => {
    const appName = 'Alignment Test';
    await page.getByRole('button', { name: 'Create New App' }).click();
    await page.getByPlaceholder('e.g., Customer Dashboard').fill(appName);
    await page.getByRole('button', { name: 'Create App' }).click();
    await expect(page.getByRole('heading', { name: appName })).toBeVisible();

    const canvas = page.getByTestId('canvas');

    // Drag three labels to arbitrary positions
    await page.getByTestId('palette-item-LABEL').dragTo(canvas, { targetPosition: { x: 50, y: 50 } });
    await page.getByTestId('palette-item-LABEL').dragTo(canvas, { targetPosition: { x: 200, y: 150 } });
    await page.getByTestId('palette-item-LABEL').dragTo(canvas, { targetPosition: { x: 120, y: 250 } });

    const labels = page.getByLabel('LABEL component');
    await expect(labels).toHaveCount(3);

    // Marquee select all three
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 400, y: 400 },
    });

    // Verify multi-select UI in properties panel
    await expect(page.getByText('3 components selected.')).toBeVisible();

    // Click "Align left edges & stack vertically"
    await page.getByLabel('Align left edges & stack vertically').click();
    await page.waitForTimeout(200); // Wait for positions to update

    // Verify alignment
    const box1 = await labels.nth(0).boundingBox();
    const box2 = await labels.nth(1).boundingBox();
    const box3 = await labels.nth(2).boundingBox();
    
    // They should now have the same 'x' coordinate (within a small tolerance for rounding)
    expect(box1?.x).toBeCloseTo(box2?.x);
    expect(box2?.x).toBeCloseTo(box3?.x);
    // They should be stacked vertically (y2 > y1)
    expect(box2?.y).toBeGreaterThan(box1?.y);
    expect(box3?.y).toBeGreaterThan(box2?.y);

    // Click "Match width"
    // First, let's resize one to be different
    await labels.nth(1).click(); // Select just one
    const boxToResize = await labels.nth(1).boundingBox();
    await page.mouse.move(boxToResize.x + boxToResize.width - 2, boxToResize.y + boxToResize.height - 2);
    await page.mouse.down();
    await page.mouse.move(boxToResize.x + boxToResize.width + 100, boxToResize.y + boxToResize.height + 50);
    await page.mouse.up();
    
    // Marquee select again
    await canvas.dragTo(canvas, {
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 500, y: 500 },
    });

    await page.getByLabel('Match width (first selected)').click();
    await page.waitForTimeout(200); // Wait for sizes to update
    
    const finalBox1 = await labels.nth(0).boundingBox();
    const finalBox2 = await labels.nth(1).boundingBox();
    const finalBox3 = await labels.nth(2).boundingBox();

    expect(finalBox1?.width).toBeCloseTo(finalBox2?.width);
    expect(finalBox2?.width).toBeCloseTo(finalBox3?.width);
  });

  test('Multi-select, Grouping, and Parenting Workflow', async ({ page }) => {
    // 1. Import the test application
    // @ts-ignore
    const appJsonPath = path.join(process.cwd(), 'e2e', 'assets', 'application.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf-8');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'application.json',
      mimeType: 'application/json',
      buffer: Buffer.from(appJsonContent)
    });

    // 2. Verify and open the app
    await expect(page.getByRole('heading', { name: 'Grouping components e2e test' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit App' }).click();

    // 3. Verify editor is loaded with correct components
    await expect(page.getByRole('heading', { name: 'Grouping components e2e test' })).toBeVisible();
    const panel = page.getByLabel('PANEL component');
    const label = page.getByLabel('LABEL component');
    const input = page.getByLabel('INPUT component');
    const checkbox = page.getByLabel('CHECKBOX component');
    const divider = page.getByLabel('DIVIDER component');
    const switchEl = page.getByLabel('SWITCH component');
    const button = page.getByLabel('BUTTON component');
    const canvas = page.getByTestId('canvas');

    await expect(panel).toBeVisible();
    const componentsToGroup = [label, input, checkbox, divider, switchEl, button];
    for (const comp of componentsToGroup) {
      await expect(comp).toBeVisible();
    }
    
    // 4. Marquee select all components except the panel
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 650, y: 50 },
      targetPosition: { x: 1000, y: 400 },
    });

    // 5. Verify selection
    await expect(page.getByText('6 components selected.')).toBeVisible();

    // 6. Get initial positions and drag them together
    const initialPositions = await Promise.all(componentsToGroup.map(c => c.boundingBox()));
    const dragHandle = label; // Drag using the label as the handle
    const dragDelta = { x: 50, y: 70 };
    const startPos = await dragHandle.boundingBox();

    await dragHandle.hover();
    await page.mouse.down();
    await page.mouse.move(startPos.x + dragDelta.x, startPos.y + dragDelta.y);
    await page.mouse.up();
    await page.waitForTimeout(500); // Wait for positions to settle

    // 7. Verify all selected components moved together
    for (let i = 0; i < componentsToGroup.length; i++) {
        const newPos = await componentsToGroup[i].boundingBox();
        expect(newPos.x).toBeCloseTo(initialPositions[i].x + dragDelta.x, 0);
        expect(newPos.y).toBeCloseTo(initialPositions[i].y + dragDelta.y, 0);
    }

    // 8. Drag the group of components into the panel
    const panelBox = await panel.boundingBox();
    
    await dragHandle.hover();
    await page.mouse.down();
    // Move the group so the drag handle's center is over the panel's center
    await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(500); // Wait for parenting logic

    // 9. Deselect and get positions before moving the panel
    await canvas.click({ position: { x: 1, y: 1 } });
    await expect(page.getByText('Select a component to see its properties.')).toBeVisible();

    const positionsBeforePanelMove = await Promise.all([panel, ...componentsToGroup].map(c => c.boundingBox()));

    // 10. Select and move the panel
    await panel.click();
    const panelDragDelta = { x: -30, y: -20 };
    const panelStartPos = await panel.boundingBox();
    await panel.hover();
    await page.mouse.down();
    await page.mouse.move(panelStartPos.x + panelDragDelta.x, panelStartPos.y + panelDragDelta.y);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // 11. Verify the panel and all its new children moved together
    const positionsAfterPanelMove = await Promise.all([panel, ...componentsToGroup].map(c => c.boundingBox()));

    for (let i = 0; i < positionsAfterPanelMove.length; i++) {
        expect(positionsAfterPanelMove[i].x).toBeCloseTo(positionsBeforePanelMove[i].x + panelDragDelta.x, 0);
        expect(positionsAfterPanelMove[i].y).toBeCloseTo(positionsBeforePanelMove[i].y + panelDragDelta.y, 0);
    }
  });
});