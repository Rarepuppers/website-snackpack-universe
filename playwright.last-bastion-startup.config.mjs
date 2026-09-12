import { defineConfig } from "@playwright/test";

/**
 * Separate from `playwright.last-bastion.config.mjs` on purpose.
 *
 * The acceptance lane is a gate that must stay fast and run on every push. This
 * one is a measurement: it loads the heaviest route end to end, prints where the
 * time went, and only fails on a collapse. Mixing them would make the gate slow
 * and the measurement's numbers hostage to the gate's timeout.
 *
 * Run it with `npm run measure:last-bastion`.
 */
const port = Number(process.env.LAST_BASTION_TEST_PORT || 44176);

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "last-bastion-startup.spec.mjs",
  // Generous: the thing being measured is how long startup takes, so the
  // timeout must not be the thing that decides the answer.
  timeout: 120_000,
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
  workers: 1,
});
