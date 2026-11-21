import { expect, test } from '@playwright/test';

test('home spotlight sits below the holiday feature and leads to the trailers and signup', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
  await page.goto('/');
  const holiday = page.locator('[data-home-feature="thanksgiving"]');
  await expect(holiday).toBeVisible();
  const spotlight = page.getByRole('region', { name: 'Snack Haul' });
  await expect(spotlight).toContainText('Coming soon to Google Play');
  const [holidayBox, spotlightBox] = await Promise.all([holiday.boundingBox(), spotlight.boundingBox()]);
  expect(spotlightBox.y).toBeGreaterThan(holidayBox.y + holidayBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await spotlight.getByRole('link', { name: 'Watch the trailers' }).click();
  await expect(page).toHaveURL(/\/apps\/snack-haul\/#trailers$/);
  await expect(page.locator('#trailers').getByRole('button', { name: /Play the Snack Haul/ })).toHaveCount(2);
  await page.getByRole('link', { name: 'Get the launch email' }).click();
  await expect(page).toHaveURL(/#signup$/);
  await expect(page.getByRole('heading', { name: 'Get the Snack Haul launch email' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up for the launch email' })).toHaveAttribute('href', /^https:\/\/[^/]+\.sibforms\.com\/serve\//);
});

test('Apps shows one Snack Haul spotlight before the rest of the lineup', async ({ page }) => {
  await page.goto('/apps/');
  const headings = await page.locator('main h2').allTextContents();
  expect(headings[0].trim()).toBe('Snack Haul');
  await expect(page.getByRole('heading', { name: 'Snack Haul', exact: true })).toHaveCount(1);
  const spotlight = page.getByRole('region', { name: 'Snack Haul' });
  await expect(spotlight.getByRole('img')).toBeVisible();
  await expect(spotlight.getByRole('link', { name: 'Get the launch email' })).toHaveAttribute('href', '/apps/snack-haul/#signup');
});
