import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.e2e") });

export default defineConfig({
  testDir: "../backend/e2e",

  timeout: 60_000,

  retries: 1,

  workers: 1,

  reporter: [
    ["html", { open: "never" }],
    ["line"],
  ],

  use: {
    baseURL: "http://localhost:5173",
    headless: true,

    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
      command: `cross-env DATABASE_URL=${process.env.E2E_DATABASE_URL} node ../backend/server.js`,
      url: "http://localhost:5001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});