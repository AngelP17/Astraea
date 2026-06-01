#!/usr/bin/env node
/**
 * Astraea Screenshot Capture
 * Captures all 4 main pages with proper wait for content
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = 'screenshots';

const pages = [
  { name: '01-home-proof-console', path: '/', waitFor: 'main h1' },
  { name: '02-engine-replay', path: '/engine', waitFor: 'h1' },
  { name: '03-evaluation-proof-room', path: '/evaluation', waitFor: 'CLAIMS-TO-PROOF MATRIX' },
  { name: '04-architecture-topology', path: '/architecture', waitFor: 'h1' },
];

async function capturePage(browser, pageConfig) {
  const { name, path, waitFor } = pageConfig;
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log(`\n[${name}] Navigating to ${FRONTEND_URL}${path}`);
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'networkidle', timeout: 30000 });

    if (waitFor) {
      try {
        await page.getByText(waitFor).first().waitFor({ timeout: 15000 });
        console.log(`[${name}] Content "${waitFor}" loaded`);
      } catch (e) {
        console.log(`[${name}] Content "${waitFor}" not found, capturing anyway`);
      }
    }

    await page.waitForTimeout(2000);

    const screenshotPath = `${SCREENSHOT_DIR}/${name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[${name}] Screenshot saved: ${screenshotPath}`);

    return { success: true, name };
  } catch (error) {
    console.error(`[${name}] Error: ${error.message}`);
    return { success: false, name, error: error.message };
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('Astraea Screenshot Capture');
  console.log('==========================');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Output directory: ${SCREENSHOT_DIR}\n`);

  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pageConfig of pages) {
    const result = await capturePage(browser, pageConfig);
    results.push(result);
  }

  await browser.close();

  console.log('\n=========================');
  console.log('Screenshot Capture Summary');
  console.log('=========================');
  const successful = results.filter(r => r.success).length;
  console.log(`Successful: ${successful}/${results.length}`);

  if (successful < results.length) {
    console.log('\nFailed pages:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
