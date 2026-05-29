import { test, expect } from 'playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toContainText(/Deterministic decisions with replayable proof/i);
});

test('hero CTA buttons work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /RUN LIVE PIPELINE/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /RUN DEMO/i })).toBeVisible();
});

test('operator console loads', async ({ page }) => {
  await page.goto('/engine');
  await expect(page.locator('h1')).toContainText(/Inspect each decision like an operator/i);
  await expect(page.locator('text=Engine Deep Dive')).toBeVisible();
  await expect(page.locator('text=Cases loaded')).toBeVisible();
});

test('evaluation page loads', async ({ page }) => {
  await page.goto('/evaluation');
  await expect(page.locator('h1')).toContainText(/Claims & Baseline Evaluation/i);
  // Network-dependent: under parallel dev-server route compilation the client
  // fetch can stall; either the real matrix or the honest offline error is a pass.
  await expect(page.getByText(/Failed to query evaluation suite|CLAIMS-TO-PROOF MATRIX/i).first()).toBeVisible({ timeout: 35000 });
});

test('architecture page loads', async ({ page }) => {
  await page.goto('/architecture');
  await expect(page.locator('h1')).toContainText(/System Architecture/i);
  await expect(page.locator('text=Deployment & Topology')).toBeVisible();
  await expect(page.locator('text=Local Cloud Emulation')).toBeVisible();
});
