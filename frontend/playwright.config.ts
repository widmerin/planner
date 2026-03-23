import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NUXT_PUBLIC_APP_USER: 'runner',
      NUXT_PUBLIC_APP_PASSWORD: 'run2026',
    },
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: devices['Pixel 7'],
    },
  ],
})
