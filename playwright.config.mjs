import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  // Both Last Bastion specs own their configs. The functional lane is a gate
  // (playwright.last-bastion.config.mjs); the startup spec is a measurement that
  // loads 30 MB and must not slow the arcade screenshot job
  // (playwright.last-bastion-startup.config.mjs).
  testIgnore: ["last-bastion-functional.spec.mjs", "last-bastion-startup.spec.mjs", "last-bastion-screens.spec.mjs", "last-bastion-profile.spec.mjs"],
  timeout: 30_000,
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.025 } },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium", colorScheme: "light" },
  webServer: { command: "node scripts/serve-static.mjs", url: "http://127.0.0.1:4173/play/", reuseExistingServer: true },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line"
});
