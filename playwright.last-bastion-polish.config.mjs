import { defineConfig } from "@playwright/test";
import capture from "./playwright.last-bastion-screens.config.mjs";
export default defineConfig({ ...capture, testMatch: "last-bastion-polish-review.spec.mjs", timeout: 90_000 });
