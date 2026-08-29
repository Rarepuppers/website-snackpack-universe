import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.025 } },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium", colorScheme: "light" },
  webServer: { command: "node scripts/serve-static.mjs", url: "http://127.0.0.1:4173/play/", reuseExistingServer: true },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line"
});
