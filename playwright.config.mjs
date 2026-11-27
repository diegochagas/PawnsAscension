import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 960, height: 620 } },
  webServer: { command: 'python3 scripts/serve.py 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } },
  ],
});
