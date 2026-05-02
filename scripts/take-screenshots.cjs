const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Screenshot 1: Home page hero with live content
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Click Run Demo to ensure content is loaded
    const demoButton = page.locator('button:has-text("RUN DEMO")');
    if (await demoButton.isVisible().catch(() => false)) {
      await demoButton.click();
      console.log('Clicked RUN DEMO, waiting for content...');
      await page.waitForTimeout(12000);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '01-hero.png'), fullPage: false });
    console.log('Saved 01-hero.png');

    // Scroll to bento section
    await page.evaluate(() => {
      const el = document.getElementById('pipeline');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '02-bento.png'), fullPage: false });
    console.log('Saved 02-bento.png');

    // Screenshot 2: Engine page
    console.log('Navigating to engine page...');
    await page.goto('http://localhost:3001/engine', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: path.join(screenshotsDir, '03-engine.png'), fullPage: false });
    console.log('Saved 03-engine.png');

    // Click first case to show detail
    const firstCase = page.locator('aside .panel button').first();
    if (await firstCase.isVisible().catch(() => false)) {
      await firstCase.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(screenshotsDir, '04-engine-detail.png'), fullPage: false });
      console.log('Saved 04-engine-detail.png');
    }

    // Screenshot 3: Command deck with replay
    const replayButton = page.locator('button:has-text("Replay Decision")');
    if (await replayButton.isVisible().catch(() => false)) {
      await replayButton.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(screenshotsDir, '05-engine-replay.png'), fullPage: false });
      console.log('Saved 05-engine-replay.png');
    }

  } catch (err) {
    console.error('Screenshot error:', err);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);
