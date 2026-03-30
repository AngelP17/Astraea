import { test, expect } from 'playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1').filter({ hasText: /^ASTRAEA$/i })).toBeVisible();
});

test('hero CTA buttons work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /RUN LIVE PIPELINE/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /RUN DEMO/i })).toBeVisible();
});
