import { defineConfig } from "@playwright/test";

const port = Number(process.env.LAST_BASTION_TEST_PORT || 44175);

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "last-bastion-functional.spec.mjs",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    colorScheme: "dark",
  },
  webServer: {
    command: "node scripts/serve-static.mjs",
    url: `http://127.0.0.1:${port}/play/last-bastion/`,
    reuseExistingServer: true,
    env: { PORT: String(port) },
  },
  reporter: "line",
});
