import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Sampled review evidence, not hardware pacing or the five human campaign runs.
const reviewDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
const output = `play/last-bastion/playtest-evidence/${reviewDay}-polish-review`;
const cases = [
  { palette: "standard", width: 1920, height: 1080, scale: 1, radar: 1 },
  { palette: "deuteranopia", width: 3840, height: 2160, scale: 1.2, radar: 1.25 },
  { palette: "protanopia", width: 1920, height: 1080, scale: .8, radar: .75 },
  { palette: "tritanopia", width: 3840, height: 2160, scale: 1.2, radar: 1.25 },
];
for (const item of cases) {
  test(`dense kit review ${item.palette} ${item.width}`, async ({ page }) => {
    mkdirSync(output, { recursive: true });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(`/play/last-bastion/?screen=game&theme=bastion-standard&seed=61061&floorpilot=kit&transformation=gravity-adept&stress=12&palette=${item.palette}&uiscale=${item.scale}&radarsize=${item.radar}&flash=0&sound=0`);
    await page.waitForFunction(() => window.__combatAccessibilityAudit !== undefined);
    const canvas = await page.locator("#game-root canvas").boundingBox();
    expect(canvas.width).toBeLessThanOrEqual(item.width);
    expect(canvas.height).toBeLessThanOrEqual(item.height);
    const initial = await page.evaluate(() => window.__combatAccessibilityAudit.playerPosition);
    await page.keyboard.down("d");
    await page.waitForTimeout(1200);
    await page.keyboard.up("d");
    await page.keyboard.down("w");
    await page.waitForTimeout(1200);
    await page.keyboard.up("w");
    const moved = await page.evaluate(() => window.__combatAccessibilityAudit.playerPosition);
    expect(Math.hypot(moved.x - initial.x, moved.y - initial.y)).toBeGreaterThan(.1);
    await page.screenshot({ path: join(output, `${item.palette}-${item.width}-combat.png`) });
    // Click the real HUD panel at its scaled logical position, after actual simulation updates.
    const x = 941 - 123 * item.scale;
    const y = 11 + 48 * item.radar * item.scale + 50 * item.scale;
    await page.mouse.click(canvas.x + x / 960 * canvas.width, canvas.y + y / 540 * canvas.height);
    await page.waitForFunction(() => window.__buildInspection?.title === "TRANSFORMATION AFFINITY");
    await page.screenshot({ path: join(output, `${item.palette}-${item.width}-inspect.png`) });
    const settings = await page.evaluate(() => JSON.parse(localStorage.getItem("last-bastion-save")).settings);
    expect(settings.colorVisionMode).toBe(item.palette);
    expect(settings.reducedFlashEnabled).toBe(true);
    expect(settings.uiScale).toBe(item.scale);
    expect(errors).toEqual([]);
    writeFileSync(join(output, `${item.palette}-${item.width}.json`), JSON.stringify({ ...item, initial, moved, errors, evidence: "2.4-second keyboard-driven stress sample; no human/hardware acceptance" }, null, 2) + "\n");
  });
}
