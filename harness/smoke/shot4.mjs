import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = process.argv[2];
for (const [name, width, height, q] of [['dice-ok', 1440, 760, ''], ['dice-bad', 1440, 760, '?bad=1']]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/smoke/dice.html' + q);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/' + name + '.png', clip: { x: 1080, y: 0, width: 360, height } });
  console.log(name, errors.join(' | '));
  await page.close();
}
await browser.close();
