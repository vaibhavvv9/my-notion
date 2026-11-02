import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const external = !!process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1400, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: external
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}/api/tree`,
        timeout: 240_000,
        reuseExistingServer: false,
        env: { DATABASE_URL: "file:./data/e2e.db" },
      },
});
