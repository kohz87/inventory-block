import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [w, h, tag] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1500);
const snap = label => page.evaluate(label => {
  const s = document.querySelector('#story_block_sidebar'); const se = document.scrollingElement;
  const f = document.querySelector('#send_form')?.getBoundingClientRect();
  return `${label}: ${s.dataset.mode} ${s.classList.contains('is-open') ? 'open' : 'closed'} scroll=${se.scrollLeft},${se.scrollTop} body=${document.body.scrollLeft},${document.body.scrollTop} win=${scrollX},${scrollY} sendTop=${Math.round(f?.top)} active=${document.activeElement?.className}`;
}, label);
console.log(await snap('start'));
for (let i = 1; i <= 3; i++) {
  await page.locator('#story_block_handle').tap(); await page.waitForTimeout(150); console.log(await snap('tap' + i + '+150'));
  await page.waitForTimeout(700); console.log(await snap('tap' + i + '+850'));
  await page.screenshot({ path: `shots/${tag}-tap${i}.png` });
  if (await page.evaluate(() => document.querySelector('#story_block_sidebar').classList.contains('is-open'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); console.log(await snap('esc' + i)); }
}
await browser.close();
