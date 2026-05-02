const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));
  
  await page.goto('http://localhost:3001/engine', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  
  // Check page content
  const casesText = await page.locator('text=Cases loaded').first().innerText().catch(() => 'not found');
  console.log('Cases text:', casesText);
  
  await browser.close();
})();
