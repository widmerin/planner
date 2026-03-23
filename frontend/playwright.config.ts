import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: [path.resolve(__dirname, '.env.local'), path.resolve(__dirname, '.env')],
  quiet: true,
})

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
      APP_USER: process.env.APP_USER,
      APP_PASSWORD: process.env.APP_PASSWORD,
    },
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: devices['Pixel 7'],
    },
  ],
})
