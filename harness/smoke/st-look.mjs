import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
for (const [w, h, mobile, tag] of [[1440, 900, false, 'desk'], [800, 1280, true, 'tab']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  if (tag === 'tab') { await page.locator('#story_block_handle').tap(); await page.waitForTimeout(800); }
  // A click on the chat through the idle layer must still reach SillyTavern.
  const hit = await page.evaluate(() => { const r = document.querySelector('#send_textarea').getBoundingClientRect(); const e = document.elementFromPoint(r.left + 20, r.top + 10); return e?.id || e?.className; });
  const s = await page.evaluate(() => { const a = document.querySelector('#story_block_sidebar'); const b = a.getBoundingClientRect(); return `${a.dataset.mode} open=${a.classList.contains('is-open')} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.width)},${Math.round(b.height)}] layerZ=${getComputedStyle(document.querySelector('#story_block_layer')).zIndex}`; });
  console.log(tag, s, 'hitAtSend=', hit);
  await page.screenshot({ path: `shots/${tag}-v052.png` });
  await page.close();
}
await browser.close();
