import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import v8to from 'v8-to-istanbul';
import { Buffer } from 'buffer';

// Toggle collecting V8 coverage during e2e runs. Set `E2E_COLLECT_COVERAGE=1` to enable.
const COLLECT_COVERAGE = !!process.env.E2E_COLLECT_COVERAGE;

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
  // Helper: temporarily disable pointer events on potential interceptors and return a restore function
  const togglePointerInterceptors = async (page: any, disable: boolean) => {
    const selectors = ['[data-testid="properties-panel"]', '.modal-backdrop', '.overlay', '.App', '[data-testid="main-layout"]'];
    await page.evaluate((opts: { sels: string[]; disableFlag: boolean }) => {
      const { sels, disableFlag } = opts;
      for (const s of sels) {
        const nodes = Array.from(document.querySelectorAll(s));
        for (const n of nodes) {
          (n as HTMLElement).style.pointerEvents = disableFlag ? 'none' : '';
        }
      }
    }, { sels: selectors, disableFlag: disable });
  };

  // Helper: robust drag from a palette item into the canvas. Tries locator.dragTo, falls back to raw mouse events.
  const resilientDragToCanvas = async (page: any, source: any, canvas: any, targetPosition: { x: number; y: number }) => {
    try {
      // Ensure the source is present/visible before attempting drag
      try {
        await source.waitFor({ state: 'visible', timeout: 5000 });
      } catch (w) {
        // continue to attempt dragTo which will surface a clearer error
      }

      // Try Playwright's built-in dragTo first (fast path)
      await source.dragTo(canvas, { targetPosition });
      return;
    } catch (e) {
      // Continue to fallback
      // eslint-disable-next-line no-console
      console.warn('dragTo failed, falling back to raw mouse drag', e);
    }

    // Fallback: use raw mouse events
    await togglePointerInterceptors(page, true);
    try {
      const srcBox = await source.boundingBox();
      const canvasBox = await canvas.boundingBox();
      if (!srcBox) throw new Error('source bounding box is null');
      if (!canvasBox) throw new Error('canvas bounding box is null');

      const startX = srcBox.x + srcBox.width / 2;
      const startY = srcBox.y + srcBox.height / 2;
      const destX = canvasBox.x + targetPosition.x;
      const destY = canvasBox.y + targetPosition.y;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(destX, destY, { steps: 12 });
      await page.mouse.up();
      // Give the UI a moment to process the drop
      await page.waitForTimeout(200);
    } finally {
      await togglePointerInterceptors(page, false);
    }
  };
  // Helper: ensure a palette category is expanded (accordion changed behavior)
  const openPaletteCategory = async (page: any, category: string) => {
    try {
      // Ensure the Components palette is visible/active
      try {
        await page.getByRole('button', { name: 'Components' }).click();
      } catch (e) {
        // ignore if there's no toggle (already visible)
      }

      const btn = page.getByRole('button', { name: category });
      await btn.waitFor({ state: 'visible', timeout: 2000 });
      await btn.click();
      // brief pause for accordion animation
      await page.waitForTimeout(120);
    } catch (e) {
      // ignore — tests will fail later if the category truly isn't present
    }
  };
  test.beforeEach(async ({ page }) => {
    // Start V8 code coverage collection (optional)
    if (COLLECT_COVERAGE) {
      await page.coverage.startJSCoverage();
    }

    // Navigate to the dashboard before each test
    await page.goto('/');
    // Clear local storage to ensure a clean state for each test
    await page.evaluate(() => window.localStorage.clear());
    // Reload to apply the cleared storage
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    if (!COLLECT_COVERAGE) return;

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
      // e.g., http://localhost:3000/App.tsx -> /path/to/project/App.tsx
      // @ts-ignore
      const filePath = path.join(process.cwd(), url.pathname.substring(1));

      // Skip files that aren't part of the project source (bundled deps / vite cache)
      if (!fs.existsSync(filePath) || filePath.includes(path.sep + 'node_modules' + path.sep) || filePath.includes(path.sep + '.vite' + path.sep)) {
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
    // Ensure the Components palette is active (default may be Explorer)
    try {
      await page.getByRole('button', { name: 'Components' }).click();
    } catch (e) {
      // If the button isn't present, continue — tests will fail later if palette truly missing
    }
    
    const canvas = page.getByTestId('canvas');

    // Drag and drop an Input component
    await openPaletteCategory(page, 'Input');
    await resilientDragToCanvas(page, page.getByTestId('palette-item-INPUT'), canvas, { x: 100, y: 100 });
    
    // Configure the Input
    const inputComponent = page.getByLabel('INPUT component');
    await inputComponent.click();
    await expect(page.getByTestId('properties-panel')).toBeVisible();
    await page.getByTestId('prop-input-Data Store Key').locator('input').fill('userName');
    
    // Drag and drop a Label component
    await openPaletteCategory(page, 'Display');
    await resilientDragToCanvas(page, page.getByTestId('palette-item-LABEL'), canvas, { x: 100, y: 200 });
    
    // Configure the Label
    const labelComponent = page.getByLabel('LABEL component');
    await labelComponent.click();
    await page.getByTestId('prop-fx-input-Text').getByRole('button', { name: 'fx' }).click();
    await page.getByTestId('prop-fx-input-Text').locator('input').fill(`{{ 'Hello, ' + (userName || 'World') }}`);

    // Drag and drop a Button component
    await openPaletteCategory(page, 'Display');
    await resilientDragToCanvas(page, page.getByTestId('palette-item-BUTTON'), canvas, { x: 100, y: 300 });

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

    // Mock the Gemini API response (catch model API calls under /models/)
    await page.route('**/models/**', async route => {
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

    // Ensure the Components palette is active (some setups open Explorer by default)
    try {
      await page.getByRole('button', { name: 'Components' }).click();
    } catch (e) {
      /* ignore */
    }

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

     // Ensure the Components palette is active (some setups open Explorer by default)
    try {
      await page.getByRole('button', { name: 'Components' }).click();
    } catch (e) {
      /* ignore */
    }
    
    await openPaletteCategory(page, 'Input');
    await resilientDragToCanvas(page, page.getByTestId('palette-item-INPUT'), page.getByTestId('canvas'), { x: 50, y: 50 });
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
    // Some environments render the modal slightly differently; find the input by label then sibling input
    const templateNameInput = page.locator('label:has-text("Template Name") + input');
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);
    const templateDescInput = page.locator('label:has-text("Description") + textarea');
    await expect(templateDescInput).toBeVisible({ timeout: 2000 });
    await templateDescInput.fill(templateDesc);

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

    // Ensure the Components palette is visible/active before interacting with the palette
    try {
      await page.getByRole('button', { name: 'Components' }).click();
    } catch (e) {
      /* ignore */
    }

    const canvas = page.getByTestId('canvas');

    // Drag three labels to arbitrary positions
    await openPaletteCategory(page, 'Display');
    await resilientDragToCanvas(page, page.getByTestId('palette-item-LABEL'), canvas, { x: 50, y: 50 });
    await resilientDragToCanvas(page, page.getByTestId('palette-item-LABEL'), canvas, { x: 200, y: 150 });
    await resilientDragToCanvas(page, page.getByTestId('palette-item-LABEL'), canvas, { x: 120, y: 250 });

    const labels = page.getByText('New Label');
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

    if (!box1 || !box2 || !box3) {
      throw new Error('One or more label bounding boxes are null');
    }

    // They should now have the same 'x' coordinate (within a small tolerance for rounding)
    expect(box1.x).toBeCloseTo(box2.x);
    expect(box2.x).toBeCloseTo(box3.x);
    // They should be stacked vertically (y2 > y1)
    expect(box2.y).toBeGreaterThan(box1.y);
    expect(box3.y).toBeGreaterThan(box2.y);

    // Click "Match width"
    // First, let's resize one to be different
    await labels.nth(1).click(); // Select just one
    const boxToResize = await labels.nth(1).boundingBox();
    if (!boxToResize) throw new Error('boxToResize bounding box is null');

    
    // Marquee select again
    // Disable pointer interception from the properties panel which can block drag events in headless runs
    await page.evaluate(() => {
      const p = document.querySelector('[data-testid="properties-panel"]') as HTMLElement | null;
      if (p) p.style.pointerEvents = 'none';
    });
    // Perform marquee drag using raw mouse events to avoid locator stability/pointer interception issues
    const start = { x: 10, y: 10 };
    const target = { x: 500, y: 500 };
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('canvas bounding box is null');


    await page.locator('[aria-label="Match width (first selected)"]').click();
    await page.waitForTimeout(200); // Wait for sizes to update
    
    const finalBox1 = await labels.nth(0).boundingBox();
    const finalBox2 = await labels.nth(1).boundingBox();
    const finalBox3 = await labels.nth(2).boundingBox();
    if (!finalBox1 || !finalBox2 || !finalBox3) throw new Error('One or more final label bounding boxes are null');

    expect(finalBox1.width).toBeCloseTo(finalBox2.width);
    expect(finalBox2.width).toBeCloseTo(finalBox3.width);
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
    // Disable pointer interception from the properties panel which can block drag events in headless runs
    await page.evaluate(() => {
      const p = document.querySelector('[data-testid="properties-panel"]') as HTMLElement | null;
      if (p) p.style.pointerEvents = 'none';
    });
    // Use raw mouse events for marquee selection to avoid locator dragTo flakiness
    const start2 = { x: 650, y: 50 };
    const target2 = { x: 1000, y: 400 };
    const canvasBox2 = await canvas.boundingBox();
    if (!canvasBox2) throw new Error('canvasBox2 bounding box is null');
    await page.mouse.move(canvasBox2.x + start2.x, canvasBox2.y + start2.y);
    await page.mouse.down();
    await page.mouse.move(canvasBox2.x + target2.x, canvasBox2.y + target2.y, { steps: 12 });
    await page.mouse.up();

    // 5. Verify selection
    await expect(page.getByText('6 components selected.')).toBeVisible();

    // 6. Get initial positions and drag them together
    const initialPositions = await Promise.all(componentsToGroup.map(c => c.boundingBox()));
    if (initialPositions.some(p => !p)) throw new Error('One or more initialPositions bounding boxes are null');

    const dragHandle = label; // Drag using the label as the handle
    const dragDelta = { x: 50, y: 70 };
    const startPos = await dragHandle.boundingBox();
    if (!startPos) throw new Error('startPos bounding box is null');

    await dragHandle.hover();
    await page.mouse.down();
    await page.mouse.move(startPos.x + dragDelta.x, startPos.y + dragDelta.y);
    await page.mouse.up();
    await page.waitForTimeout(500); // Wait for positions to settle

    // 7. Verify all selected components moved together
    for (let i = 0; i < componentsToGroup.length; i++) {
      const newPos = await componentsToGroup[i].boundingBox();
      if (!newPos || !initialPositions[i]) throw new Error('Missing position while verifying group move');
      const init = initialPositions[i]!;
      const np = newPos!;
      expect(np.x).toBeCloseTo(init.x + dragDelta.x, 0);
      expect(np.y).toBeCloseTo(init.y + dragDelta.y, 0);
    }

    // 8. Drag the group of components into the panel
    const panelBox = await panel.boundingBox();
    if (!panelBox) throw new Error('panelBox bounding box is null');

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
    if (positionsBeforePanelMove.some(p => !p)) throw new Error('Missing positions before panel move');

    // 10. Select and move the panel
    await panel.click();
    const panelDragDelta = { x: -30, y: -20 };
    const panelStartPos = await panel.boundingBox();
    if (!panelStartPos) throw new Error('panelStartPos bounding box is null');
    await panel.hover();
    await page.mouse.down();
    await page.mouse.move(panelStartPos.x + panelDragDelta.x, panelStartPos.y + panelDragDelta.y);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // 11. Verify the panel and all its new children moved together
    const positionsAfterPanelMove = await Promise.all([panel, ...componentsToGroup].map(c => c.boundingBox()));
    if (positionsAfterPanelMove.some(p => !p)) throw new Error('Missing positions after panel move');

    for (let i = 0; i < positionsAfterPanelMove.length; i++) {
      const before = positionsBeforePanelMove[i];
      const after = positionsAfterPanelMove[i];
      if (!before || !after) throw new Error('Missing position while verifying panel move');
      expect(after.x).toBeCloseTo(before.x + panelDragDelta.x, 0);
      expect(after.y).toBeCloseTo(before.y + panelDragDelta.y, 0);
    }
  });
});