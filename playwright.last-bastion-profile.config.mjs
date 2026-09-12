import { defineConfig } from "@playwright/test";

/**
 * QA-12 profiling. Its own config for the same reason the startup measurement
 * has one: this runs the game for seconds at a time and reloads it repeatedly,
 * which belongs nowhere near a gate that has to stay fast.
 *
 * --enable-precise-memory-info makes performance.memory usable; without it the
 * heap reading is bucketed to 100 KB and the growth check is noise.
 */
const port = Number(process.env.LAST_BASTION_TEST_PORT || 44178);

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "last-bastion-profile.spec.mjs",
  timeout: 180_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    colorScheme: "dark",
    launchOptions: { args: ["--enable-precise-memory-info"] },
  },
  webServer: {
    command: "node scripts/serve-static.mjs",
    url: `http://127.0.0.1:${port}/play/last-bastion/`,
    reuseExistingServer: true,
    env: { PORT: String(port) },
  },
  reporter: "line",
  workers: 1,
});
