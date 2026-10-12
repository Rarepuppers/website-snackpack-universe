import { test, expect } from '@playwright/test';

test('Keeping Up is absent from the homepage and its existing URL shows development status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Keeping Up with the Joneses')).toHaveCount(0);
  await expect(page.locator('a[href="https://keepingup.snackpackuniverse.com/"]')).toHaveCount(0);

  await page.goto('/keeping-up-with-the-joneses/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.getByRole('heading', { name: 'Keeping Up with the Joneses' })).toBeVisible();
  await expect(page.getByText('Our satirical life sim is still in development.')).toBeVisible();
  await expect(page.locator('a[href="https://keepingup.snackpackuniverse.com/"]')).toHaveCount(0);
});
