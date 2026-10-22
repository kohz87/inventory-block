import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = process.argv[2];
for (const [name, width, height, open, click] of [['ws-wide', 1440, 900, '', ''], ['ws-phone', 390, 844, 'block:world-state', ''], ['cy-wide', 1440, 900, 'block:choices', 'choice']]) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 500, isMobile: width < 500 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/smoke/scene.html' + (open ? '?open=' + open : ''));
  await page.waitForFunction(() => window.ready === true, null, { timeout: 5000 }).catch(() => {});
  if (open && width > 500) await page.click('[data-tab-id="' + open + '"]').catch(e => errors.push('tab ' + e.message));
  let filled = '';
  if (click) { const b = page.locator('.story-block-sidebar button', { hasText: 'Ask Astra' }).first(); await b.click().catch(e => errors.push('click ' + e.message)); filled = await page.inputValue('#send_textarea'); }
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, changes: window.changes, secretVisible: document.body.innerText.includes('knows who sent it') }));
  await page.screenshot({ path: out + '/' + name + '.png' });
  console.log(name, JSON.stringify({ ...info, filled }), errors.join(' | '));
  await page.close();
}
await browser.close();
