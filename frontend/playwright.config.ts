import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.e2e"), override: true });

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 600_000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: "http://localhost:5173",
    headless: false,
    screenshot: "on",
    video: "on",
    trace: "on",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          slowMo: 300,
        },
      },
    },
  ],

  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "cross-env NODE_ENV=e2e node ../backend/server.js",
      url: "http://localhost:5001/api/health",
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        NODE_ENV: "e2e",
        DATABASE_URL: process.env.E2E_DATABASE_URL!,
        DIRECT_URL: process.env.E2E_DIRECT_URL!,
      },
    },
  ],
});