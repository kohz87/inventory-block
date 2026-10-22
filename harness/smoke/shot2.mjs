import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = process.argv[2];
for (const [name, width, height, open] of [['wide', 1440, 860, ''], ['tablet-open', 1024, 768, 'block:character-sheet'], ['phone-closed', 390, 844, ''], ['phone-open', 390, 844, 'block:inventory']]) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 500, isMobile: width < 500 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/smoke/sidebar.html' + (open ? '?open=' + open : ''));
  await page.waitForFunction(() => window.ready === true, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({ mode: window.mode, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  await page.screenshot({ path: out + '/' + name + '.png' });
  console.log(name, JSON.stringify(info), errors.join(' | '));
  await page.close();
}
await browser.close();
