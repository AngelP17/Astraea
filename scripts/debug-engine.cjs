const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto('http://localhost:3000/engine', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/debug-engine.png' });
    console.log('Saved debug-engine.png');
  } catch (err) {
    console.error('Error:', err);
  }
  await browser.close();
})();
