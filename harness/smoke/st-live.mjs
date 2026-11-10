import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2];
const sizes = (process.argv[3] || 'phone').split(',');
const devices = { phone: { width: 390, height: 844, mobile: true }, tablet: { width: 820, height: 1180, mobile: true }, desktop: { width: 1440, height: 900, mobile: false } };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
for (const size of sizes) {
  const d = devices[size];
  const page = await browser.newPage({ viewport: { width: d.width, height: d.height }, isMobile: d.mobile, hasTouch: d.mobile });
  const logs = []; page.on('console', m => { if (/Story Block|error/i.test(m.text())) logs.push(m.type() + ': ' + m.text().slice(0, 200)); }); page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.SillyTavern?.getContext), null, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const save = page.locator('.popup button, .popup .menu_button', { hasText: 'Save' }).first();
  if (await save.isVisible().catch(() => false)) await save.click();
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const ctx = SillyTavern.getContext();
    const id = ctx.characters.findIndex(c => c.name === 'Seraphina');
    await ctx.selectCharacterById(String(id));
  });
  await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  // Put an Inventory block into the greeting, as a reply would carry it.
  await page.evaluate(async () => {
    const ctx = SillyTavern.getContext();
    const m = ctx.chat[0];
    if (!m.mes.includes('STORY_BLOCKS_V1')) m.mes += '\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Inventory>\nCoin Pouch | 1 | 85 Gold\n[Pack]\nRope | 1 | coiled\n</Inventory>\n</Blocks>\n-->';
    if (Array.isArray(m.swipes)) m.swipes[m.swipe_id ?? 0] = m.mes;
    await ctx.saveChat();
    await ctx.reloadCurrentChat();
  });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const handle = q('#story_block_handle'), side = q('#story_block_sidebar');
    const r = handle?.getBoundingClientRect();
    const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return {
      ext: Boolean(globalThis.StoryBlock), version: globalThis.StoryBlock?.version,
      sidebar: side ? { mode: side.dataset.mode, open: side.classList.contains('is-open'), display: getComputedStyle(side).display } : null,
      handle: handle ? { display: getComputedStyle(handle).display, inline: handle.style.display, rect: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], z: getComputedStyle(handle).zIndex, topElement: top ? (top.id || top.className || top.tagName) : null } : null,
      bodyClass: document.body.className.slice(0, 120),
      sheld: (() => { const s = q('#sheld'); return s ? { z: getComputedStyle(s).zIndex, pos: getComputedStyle(s).position } : null; })(),
    };
  });
  const debug = await page.evaluate(() => {
    const ctx = SillyTavern.getContext();
    const own = ctx.extensionSettings.storyBlock;
    return {
      chatId: ctx.getCurrentChatId?.(), chatLen: ctx.chat.length, mes0: ctx.chat[0]?.mes?.slice(-120), isUser0: ctx.chat[0]?.is_user, isSystem0: ctx.chat[0]?.is_system,
      blocks: own?.blocks?.map(b => b.id + ':' + b.enabled + ':' + b.visible), display: own?.display,
      mesEls: document.querySelectorAll('#chat .mes').length, mesid: [...document.querySelectorAll('#chat .mes')].map(e => e.getAttribute('mesid')),
      generating: document.body.dataset.generating, stop: (() => { const s = document.getElementById('mes_stop'); return s ? getComputedStyle(s).display : null; })(),
    };
  });
  const css = await page.evaluate(async () => {
    const pick = el => { const c = getComputedStyle(el); return { transform: c.transform, filter: c.filter, contain: c.contain, willChange: c.willChange, height: c.height, position: c.position, overflow: c.overflow, backdrop: c.backdropFilter, containerType: c.containerType }; };
    globalThis.StoryBlock && document.querySelector('#story_block_handle')?.click();
    await new Promise(r => setTimeout(r, 600));
    const side = document.querySelector('#story_block_sidebar');
    const r = side?.getBoundingClientRect();
    return { html: pick(document.documentElement), body: pick(document.body), openRect: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vh: innerHeight };
  });
  console.log('css', JSON.stringify(css));
  await page.screenshot({ path: out + '/st-' + size + '.png' });
  console.log(size, JSON.stringify(info, null, 0));
  console.log(logs.slice(0, 8).join('\n'));
  await page.close();
}
await browser.close();
