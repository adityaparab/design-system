import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the production build of every app (`pnpm start`: build + vite
 * preview), composed exactly as a browser would see it after deployment.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1, // the mock API keeps coding state in memory
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'pnpm start',
    cwd: '..',
    url: 'http://localhost:5173',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { LATENCY: '30' },
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
