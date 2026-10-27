import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100' },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npx next start -p 3100', port: 3100, reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
