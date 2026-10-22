import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2];
const devices = { phone: { width: 390, height: 844, mobile: true }, tablet: { width: 820, height: 1180, mobile: true }, desktop: { width: 1440, height: 900, mobile: false } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const state = async page => page.evaluate(() => {
  const rect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const side = document.querySelector('#story_block_sidebar'), handle = document.querySelector('#story_block_handle');
  const hr = handle?.getBoundingClientRect();
  const hit = hr && hr.width ? document.elementFromPoint(hr.left + hr.width / 2, hr.top + hr.height / 2) : null;
  return { mode: side?.dataset.mode ?? null, open: side?.classList.contains('is-open') ?? null, side: rect(side), handle: handle && getComputedStyle(handle).display !== 'none' ? rect(handle) : null, handleOnTop: hit ? Boolean(hit.closest('#story_block_handle')) : null, tabs: [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.textContent.trim()) };
});
for (const size of (process.argv[3] || 'phone,tablet,desktop').split(',')) {
  const d = devices[size];
  const page = await browser.newPage({ viewport: { width: d.width, height: d.height }, isMobile: d.mobile, hasTouch: d.mobile });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.SillyTavern?.getContext), null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const save = page.locator('.popup button, .popup .menu_button', { hasText: 'Save' }).first();
  if (await save.isVisible().catch(() => false)) await save.click();
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 30000 });
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
  // A: a fresh chat, the greeting without blocks.
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); const m = ctx.chat[0]; m.mes = m.mes.replace(/\n<!-- STORY_BLOCKS_V1[\s\S]*$/, ''); if (Array.isArray(m.swipes)) m.swipes[m.swipe_id ?? 0] = m.mes; await ctx.saveChat(); await ctx.reloadCurrentChat(); });
  await page.waitForTimeout(2000);
  console.log(size, 'fresh', JSON.stringify(await state(page)));
  await page.screenshot({ path: out + '/live-' + size + '-fresh.png' });
  // B: the greeting carries an Inventory block.
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); const m = ctx.chat[0]; m.mes += '\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Inventory>\nCoin Pouch | 1 | 85 Gold\n[Pack]\nRope | 1 | coiled\n</Inventory>\n</Blocks>\n-->'; if (Array.isArray(m.swipes)) m.swipes[m.swipe_id ?? 0] = m.mes; await ctx.saveChat(); await ctx.reloadCurrentChat(); });
  await page.waitForTimeout(2000);
  console.log(size, 'block', JSON.stringify(await state(page)));
  // C: open it from the handle.
  if (await page.locator('#story_block_handle').isVisible().catch(() => false)) {
    await page.locator('#story_block_handle').click();
    await page.waitForTimeout(700);
    console.log(size, 'opened', JSON.stringify(await state(page)));
  }
  await page.screenshot({ path: out + '/live-' + size + '.png' });
  await page.close();
}
await browser.close();
