import { test, expect } from '@playwright/test';
import { openOptions } from './helpers/options.mjs';

test('hub limits the verified-deal promise to the three supported games', async ({ page }) => {
  await page.goto('/play/');
  await expect(page.locator('.page-hero .lead')).toContainText('Klondike, FreeCell and TriPeaks');
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /Every card deal/i);
  await page.goto('/play/pyramid/');
  await expect(page.locator('.seo-prose')).toContainText('Pyramid here does not do that');
});

for (const failure of ['suits', 'snacks', 'all']) {
  test(`Mahjong retains native families when ${failure} artwork fails`, async ({ page }) => {
    await page.route(/sprites\/(mahjong-suits|snack-symbols)\.(png|webp)/, route => {
      const url = route.request().url();
      if (failure === 'all' || url.includes(failure === 'suits' ? 'mahjong-suits' : 'snack-symbols'))
        return route.fulfill({ status: 503, body: 'Artwork unavailable' });
      return route.continue();
    });
    await page.goto('/play/mahjong/');
    const glyph = page.locator('.mj-tile[data-suit="dots"] .mj-glyph').first();
    await expect(glyph).toBeVisible();
    expect(await glyph.evaluate(el => getComputedStyle(el, '::before').content)).toBe('"○"');
    expect(await page.locator('.mj-tile[data-suit="bamboo"] .mj-glyph').first().evaluate(el => getComputedStyle(el, '::before').content)).toBe('"║"');
    expect(await page.evaluate(() => localStorage.getItem('sp_mahjong_clear_faces'))).toBeNull();
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    const hinted = page.locator('.mj-tile.is-hint');
    await expect(hinted).toHaveCount(2);
    const ids = await hinted.evaluateAll(tiles => tiles.map(tile => tile.dataset.id));
    await page.locator(`[data-id="${ids[0]}"]`).click();
    await page.locator(`[data-id="${ids[1]}"]`).click();
    await expect(page.locator('#mj-left')).toHaveText('34');
  });
}

test('Mahjong decoded art and the saved Clear faces choice have separate ownership', async ({ page }) => {
  await page.goto('/play/mahjong/');
  await expect(page.locator('html')).toHaveClass(/sp-mj-art-ready/);
  const glyph = page.locator('.mj-glyph').first();
  expect(await glyph.evaluate(el => getComputedStyle(el, '::before').display)).toBe('none');
  await openOptions(page);
  await page.getByRole('button', { name: 'Clear faces', exact: true }).click();
  expect(await glyph.evaluate(el => getComputedStyle(el, '::before').display)).not.toBe('none');
  await page.reload();
  await expect(page.locator('.game-stage')).toHaveClass(/sp-clear-faces/);
});

for (const slug of ['cascade', 'asteroid-destroyer', 'table-tennis']) {
  test(`${slug}: phone playfield and essential controls fit, with a landscape focus exit`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/play/${slug}/`);
    const field = page.locator('.cs-well, #as-canvas, #tt-canvas');
    await expect(page.getByRole('button', { name: 'Focus play', exact: true })).toBeVisible();
    const contained = async () => page.evaluate(() => {
      const elements = [...document.querySelectorAll('.cs-well, #as-canvas, #tt-canvas, .cs-pad button, .as-controls button')].filter(el => el.getBoundingClientRect().height > 0);
      return elements.flatMap(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth ? [] : [{ label: el.getAttribute('aria-label') || el.className, top: r.top, bottom: r.bottom, left: r.left, right: r.right }]; });
    });
    await expect.poll(contained).toEqual([]);
    await expect(field).toBeVisible();
    await page.setViewportSize({ width: 812, height: 375 });
    await page.getByRole('button', { name: 'Focus play', exact: true }).click();
    await expect.poll(contained).toEqual([]);
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(await page.locator('.topbar').evaluate(el => el.inert)).toBe(true);
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.querySelector('.sp-focus-play').contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Focus play', exact: true })).toBeFocused();
    await expect(page.locator('.game-stage')).not.toHaveClass(/sp-focus-play/);
    expect(await page.locator('.topbar').evaluate(el => el.inert)).toBe(false);
  });
}

test('Crossword enlargement keeps 40px cells in a local scroller and retains the active answer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/play/crossword/');
  await page.getByRole('button', { name: 'Enlarge grid', exact: true }).click();
  const selected = page.locator('.cw-cell.is-selected');
  expect((await selected.boundingBox()).width).toBeGreaterThanOrEqual(40);
  const before = await selected.getAttribute('data-r') + ',' + await selected.getAttribute('data-c');
  await page.getByRole('button', { name: 'Show whole grid', exact: true }).click();
  expect(await selected.getAttribute('data-r') + ',' + await selected.getAttribute('data-c')).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const slug of ['', 'crossword/']) {
  test(`Play ${slug || 'hub'} reflows with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/play/${slug}`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    if (slug) {
      const key = page.locator('.cw-key', { hasText: /^J$/ });
      await key.click();
      await expect(page.locator('.cw-clet', { hasText: 'J' }).first()).toBeVisible();
    } else {
      const title = page.getByRole('heading', { name: 'Minesweeper', exact: true });
      await title.scrollIntoViewIfNeeded();
      const fit = await title.evaluate(el => el.scrollWidth <= el.clientWidth + 1);
      expect(fit).toBe(true);
    }
  });
}

test('Thirteen describes its existing house variants without unsupported regional labels', async ({ page }) => {
  await page.goto('/play/thirteen/');
  const rules = page.locator('.seo-prose');
  await expect(rules).toContainText('circular-sequence house variant');
  await expect(rules).not.toContainText('Northern (Miền Bắc) rules');
});

test('hub offers first-screen quick play and discloses input requirements', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/play/');
  const quick = page.getByRole('navigation', { name: 'Quick play', exact: true });
  const quickBox = await quick.boundingBox();
  expect(quickBox.y + quickBox.height).toBeLessThan(812);
  await expect(quick.getByRole('link', { name: '2048', exact: true })).toHaveAttribute('href', './2048/');
  const bastion = page.locator('a.game-tile[href="/play/last-bastion/"]');
  await expect(bastion.locator('.game-capability')).toBeVisible();
  await page.getByRole('button', { name: 'Touch controls', exact: true }).click();
  await expect(bastion).toBeHidden();
  await expect(page.locator('a.game-tile[href="./2048/"]')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(bastion).toBeVisible();
});

test('Backgammon enlarged points stay inside a local scroller and remain playable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/play/backgammon/');
  await page.getByRole('button', { name: 'Enlarge board', exact: true }).click();
  const point = page.locator('.bg-pt').first();
  expect((await point.boundingBox()).width).toBeGreaterThanOrEqual(32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.locator('#bg-roll').click();
  await expect(page.locator('.bg-pt.is-source, .bg-bar.is-source').first()).toBeVisible();
  await page.locator('.bg-pt.is-source, .bg-bar.is-source').first().click();
  const destination = page.locator('.bg-pt.is-dest, .bg-off.is-dest').first();
  await expect(destination).toBeVisible();
  await destination.click();
  await page.getByRole('button', { name: 'Show whole board', exact: true }).click();
  await expect(page.locator('.sp-backgammon-viewport')).not.toHaveClass(/sp-backgammon-zoom/);
});

test('Focus play preserves an existing pause and Escape resumes before exiting', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/play/asteroid-destroyer/');
  await page.locator('#as-start').click();
  await page.locator('#sp-pause').click();
  await expect(page.locator('.sp-pause-overlay')).toHaveClass(/is-open/);
  await page.getByRole('button', { name: 'Focus play', exact: true }).click();
  await expect(page.locator('.sp-pause-overlay')).toHaveClass(/is-open/);
  await expect(page.locator('#sp-pause')).toHaveText('Resume');
  await page.keyboard.press('Escape');
  await expect(page.locator('.sp-pause-overlay')).not.toHaveClass(/is-open/);
  await expect(page.locator('.game-stage')).toHaveClass(/sp-focus-play/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.game-stage')).not.toHaveClass(/sp-focus-play/);
});

for (const width of [320, 390]) {
  test(`compact Cascade and Asteroid controls fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    for (const slug of ['cascade', 'asteroid-destroyer']) {
      await page.goto(`/play/${slug}/`);
      await expect(page.getByRole('button', { name: 'Focus play', exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.cs-well, #as-canvas, .cs-pad button, .as-controls button')].filter(el => el.getBoundingClientRect().height > 0).every(el => {
        const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      }))).toBe(true);
    }
  });
}
