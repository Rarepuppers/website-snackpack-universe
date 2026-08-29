import { test, expect } from "@playwright/test";

const surfaces = [
  { slug: "hub", path: "/play/", target: "#games" },
  { slug: "2048", path: "/play/2048/", target: ".game-stage" },
  { slug: "sudoku", path: "/play/sudoku/", target: ".game-stage" },
  { slug: "solitaire", path: "/play/solitaire/", target: ".game-stage" },
  { slug: "stats", path: "/play/stats/", target: "main" }
];
const themes = ["cream", "dark", "light"];
const viewports = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };

for (const surface of surfaces) for (const theme of themes) for (const [viewportName, viewport] of Object.entries(viewports)) {
  test(`${surface.slug} · ${theme} · ${viewportName}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(({ selectedTheme }) => {
      localStorage.clear();
      localStorage.setItem("snackpack.theme.v1", selectedTheme);
      let seed = 123456789;
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
      Date.now = () => Date.UTC(2026, 7, 29, 2, 0, 0);
    }, { selectedTheme: theme });
    await page.goto(surface.path, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.topbar{position:static!important}" });
    await expect(page.locator(surface.target).first()).toBeVisible();
    await expect(page.locator(surface.target).first()).toHaveScreenshot(`${surface.slug}-${theme}-${viewportName}.png`);
  });
}
