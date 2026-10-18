import { test, expect } from '@playwright/test';
import { openOptions } from './helpers/options.mjs';

for (const failure of ['all-art', 'webp-only']) {
  test(`Solitaire remains playable with ${failure} failure`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [], blocked = [], requests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => requests.push({ url: response.url(), status: response.status() }));
    await page.route('**/shared-assets/game-ui/**', route => {
      const url = route.request().url();
      if (/\.(png|webp)$/.test(url) && (failure === 'all-art' || url.endsWith('.webp'))) {
        blocked.push(url); return route.fulfill({ status: 503, body: 'Deliberate artwork QA failure' });
      }
      return route.continue();
    });
    await page.goto('/play/solitaire/', { waitUntil: 'networkidle' });
    await expect(page.locator('#sol-moves')).toHaveText('0');
    await expect.poll(() => blocked.length).toBeGreaterThan(0);
    for (const suit of ['spade', 'heart', 'diamond', 'club']) {
      const icon = page.locator(`.card-suit-icon--${suit}`).first();
      if (failure === 'all-art') {
        await expect(page.locator('html')).not.toHaveClass(new RegExp(`sp-suit-${suit}-ready`));
        const content = await icon.evaluate(el => getComputedStyle(el, '::before').content);
        expect(content).not.toMatch(/^(none|normal|"")$/);
      } else {
        await expect(page.locator('html')).toHaveClass(new RegExp(`sp-suit-${suit}-ready`));
        await expect(icon).toHaveCSS('background-image', new RegExp(`${suit}\\.png`));
      }
    }
    await expect(page.locator('#sol-waste .sol-card')).toHaveCount(0);
    await page.locator('#sol-stock [data-act="draw"]').click();
    // Stock draws are undoable but the game's move counter counts transfers.
    await expect(page.locator('#sol-waste .sol-card')).toHaveCount(1);
    await expect(page.locator('#sol-waste .sol-card .r').first()).toBeVisible();
    await openOptions(page);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('#sol-waste .sol-card')).toHaveCount(0);
    await expect(page.locator('#sol-moves')).toHaveText('0');
    expect(errors).toEqual([]);
    await page.locator('.game-stage').screenshot({ path: testInfo.outputPath(`${failure}.png`) });
    await testInfo.attach('request-inventory', { body: JSON.stringify({ blocked, requests }, null, 2), contentType: 'application/json' });
  });
}
