import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const out = process.argv[2];
for (const [name, width, tab] of [['desk-inv', 820, ''], ['desk-sheet', 820, 'block:sheet'], ['phone-inv', 360, ''], ['phone-sheet', 360, 'block:sheet'], ['phone-notes', 320, 'block:notes']]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:8765/smoke/harness.html${tab ? `?tab=${tab}` : ''}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 5000 }).catch(() => {});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log(name, 'overflowX=', overflow, errors.length ? errors : '');
  await page.close();
}
await browser.close();
