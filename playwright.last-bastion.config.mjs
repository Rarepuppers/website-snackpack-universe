import { defineConfig } from "@playwright/test";

const port = Number(process.env.LAST_BASTION_TEST_PORT || 44175);

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    colorScheme: "dark",
  },
  reporter: "line",
});
