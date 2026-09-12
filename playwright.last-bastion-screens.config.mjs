import { defineConfig } from "@playwright/test";

/**
 * QA-04b evidence capture. Separate from both the acceptance gate and the
 * startup measurement because it is neither: it produces pictures for a human
 * to judge, writes into playtest-evidence/, and asserts nothing about how they
 * look. Run it with `npm run screens:last-bastion`.
 */
const port = Number(process.env.LAST_BASTION_TEST_PORT || 44177);

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "last-bastion-screens.spec.mjs",
  timeout: 120_000,
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: "chromium", colorScheme: "dark" },
  webServer: {
    command: "node scripts/serve-static.mjs",
    url: `http://127.0.0.1:${port}/play/last-bastion/`,
    reuseExistingServer: true,
    env: { PORT: String(port) },
  },
  reporter: "line",
  workers: 1,
});
