import { test, expect } from 'playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /^ASTRAEA$/i })).toBeVisible();
});

test('hero CTA buttons work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /RUN LIVE PIPELINE/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /RUN DEMO/i })).toBeVisible();
});
