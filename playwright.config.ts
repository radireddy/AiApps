import { defineConfig, devices } from '@playwright/test';

// This is a dummy command for the web server since we are running in a special environment.
// In a real local setup, this would be something like 'npm run start'.
const serverCommand = 'sleep 1 && echo "Server is ready"';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000', // The dev server URL
    trace: 'on-first-retry',
    // Record a video for every test run.
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: serverCommand,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    timeout: 120 * 1000,
  },
});
