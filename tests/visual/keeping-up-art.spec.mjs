import { test, expect } from '@playwright/test';

for (const theme of ['cream', 'dark', 'light']) {
  for (const width of [390, 1280]) {
    test(`Keeping Up artwork: ${theme}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((value) => localStorage.setItem('snackpack.theme.v1', value), theme);
      for (const route of ['/', '/keeping-up-with-the-joneses/']) {
        await page.goto(route);
        const card = page.locator('.keeping-up-feature');
        const artwork = card.locator('.keeping-up-art img');
        await artwork.scrollIntoViewIfNeeded();
        await expect(artwork).toBeVisible();
        await expect.poll(() => artwork.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(artwork).toHaveAttribute('alt', /Promotional artwork/);
        await expect(card.locator('figcaption')).toContainText('Promotional artwork');
        await expect(card.locator('.eyebrow')).toContainText('For older teens and adults');
        expect(await artwork.evaluate((img) => img.currentSrc)).toContain('.webp');
        const bounds = await card.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        const link = card.locator('.keeping-up-art a');
        await link.focus();
        await expect(link).toBeFocused();
        expect(await link.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe('3px');
        if (route !== '/') {
          await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /keeping-up-neighbours-v1\.jpg$/);
          await expect(page.locator('.atlas-feature-media img')).toHaveAttribute('src', /keeping-up-gameplay-desktop\.png$/);
        }
        await card.screenshot({ path: test.info().outputPath(`${route === '/' ? 'home' : 'detail'}-${theme}-${width}.png`) });
      }
    });
  }
}
