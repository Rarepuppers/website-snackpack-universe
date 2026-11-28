import { expect, test } from '@playwright/test';

// Snack Haul went live on Google Play on 2026-11-26 (a96d1293): the launch-email
// spotlight became a Play link plus "See the game".
test('home spotlight sits below the holiday feature and leads to Play and the game page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
  await page.goto('/');
  const holiday = page.locator('[data-home-feature="thanksgiving"]');
  await expect(holiday).toBeVisible();
  const spotlight = page.getByRole('region', { name: 'Snack Haul' });
  await expect(spotlight).toContainText('Now live on Google Play');
  await expect(spotlight.getByRole('link', { name: 'Get it on Google Play' })).toHaveAttribute('href', '/go/home/home/snackhaul/');
  const [holidayBox, spotlightBox] = await Promise.all([holiday.boundingBox(), spotlight.boundingBox()]);
  expect(spotlightBox.y).toBeGreaterThan(holidayBox.y + holidayBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await spotlight.getByRole('link', { name: 'See the game' }).click();
  await expect(page).toHaveURL(/\/apps\/snack-haul\/$/);
  await expect(page.locator('#trailers').getByRole('button', { name: /Play the Snack Haul/ })).toHaveCount(2);
});

test('Apps shows one Snack Haul spotlight before the rest of the lineup', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/apps/');
  const headings = await page.locator('main h2').allTextContents();
  expect(headings[0].trim()).toBe('Snack Haul');
  await expect(page.getByRole('heading', { name: 'Snack Haul', exact: true })).toHaveCount(1);
  const spotlight = page.getByRole('region', { name: 'Snack Haul' });
  await expect(spotlight.getByRole('img', { name: /A red pickup/ })).toBeVisible();
  const playLink = spotlight.getByRole('link', { name: 'Get it on Google Play' });
  await expect(playLink).toHaveAttribute('href', '/go/app-index/apps-index/snackhaul/');
  const badge = playLink.getByRole('img');
  const qr = spotlight.getByRole('img', { name: 'QR code for the Snack Haul Google Play listing' });
  await qr.scrollIntoViewIfNeeded();
  await expect.poll(() => badge.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect.poll(() => qr.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(qr).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(spotlight.getByRole('link', { name: 'See the game' })).toHaveAttribute('href', '/apps/snack-haul/');
});
