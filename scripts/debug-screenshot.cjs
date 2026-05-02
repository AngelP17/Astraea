const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/debug-home.png' });
  const buttons = await page.locator('button').allInnerTexts();
  console.log('Buttons:', JSON.stringify(buttons, null, 2));
  await browser.close();
})();
