import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
export async function open({ width = 1440, height = 900, mobile = false } = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror ' + e.message));
  page.on('dialog', d => d.accept(page.__dialogText ?? ''));
  await page.addInitScript(url => { window.__MOCK_URL = url; }, process.env.MOCK_URL || 'http://127.0.0.1:5099/v1');
  await page.goto(process.env.ST_URL || 'http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.NPCStateDelta && window.StoryDirector && typeof window.rpgBattleInterceptor === 'function', null, { timeout: 60000 });
  await page.waitForTimeout(3500);
  const ev = (fn, a) => page.evaluate(fn, a);
  const h = {
    browser, page, errors, ev,
    pane: () => ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.innerText ?? '').replace(/\s+/g, ' '); }),
    tab: async id => { await ev(i => document.querySelector(`.story-block-sidebar-tab[data-tab-id="${i}"]`)?.click(), id); await page.waitForTimeout(700); },
    click: src => ev(s => { const r = new RegExp(s); const b = [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent && !n.disabled).find(n => r.test(n.textContent.trim())); b?.click(); return b?.textContent.trim() ?? null; }, src),
    openNarrator: async (file = null) => {
      await ev(async f => {
        const ctx = SillyTavern.getContext();
        await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
        await new Promise(r => setTimeout(r, 2500));
        if (f) { await ctx.openCharacterChat(f); await new Promise(r => setTimeout(r, 2500)); }
      }, file);
    },
    dock: async () => {
      if (await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(700); }
    },
    // One turn in SillyTavern's order: the user message, the interceptors, then the reply.
    turn: (mes, user) => ev(async ([m, u]) => {
      const ctx = SillyTavern.getContext();
      ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: u, extra: {} });
      await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
      ctx.chat.push({ name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes: m, swipes: [m], swipe_id: 0, extra: {} });
      await ctx.saveChat(); await ctx.reloadCurrentChat();
      await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1);
      await ctx.eventSource.emit(ctx.eventTypes?.CHARACTER_MESSAGE_RENDERED ?? ctx.event_types.CHARACTER_MESSAGE_RENDERED, ctx.chat.length - 1);
      return ctx.chat.length - 1;
    }, [mes, user]),
  };
  return h;
}
