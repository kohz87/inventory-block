import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const PLAN = `<plan>
ARC: The Weir Bullion — who sold the weir route
BEAT: Council session opens — the legation forces a vote | on: in 2 days | place: Auvoth
BEAT: Kade presents the core — the core fails | on: in 3 days | after: Council session opens
BEAT: The vault opens — the bullion is gone | on: in 4 days
AGENDA: Senior Listener Geva — now: Bailiff Court | then: reissues the warrants | on: tomorrow at dawn
HOOK: River stranger — who pulled Ren from the sump | then: he sends word | on: in 3 days
SECRET: Kade's sale — Kade sold the weir route
</plan>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1500);
const toasts = () => page.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(t => `${t.className.replace(/.*toast-(\w+).*/, '$1')}: ${t.innerText.replace(/\s+/g, ' ')}`));
// A slow model that answers after 3 seconds, then one that fails.
await page.evaluate(plan => {
  const original = window.SillyTavern.getContext;
  window.__mode = 'ok';
  window.SillyTavern.getContext = () => ({ ...original(), generateRaw: async () => { await new Promise(r => setTimeout(r, 3000)); if (window.__mode === 'fail') throw new Error('API returned 429'); return plan; } });
}, PLAN);
await page.evaluate(() => document.querySelector('.story-director-plan')?.click() ?? document.querySelector('#story_director_settings .story-director-plan')?.click());
await page.waitForTimeout(800);
console.log('while planning:', JSON.stringify(await toasts()));
await page.screenshot({ path: `${S}/shots/sd-arc-toast.png` });
await page.evaluate(() => document.querySelector('.story-director-plan')?.click());
await page.waitForTimeout(400);
console.log('second press:', JSON.stringify(await toasts()));
await page.waitForTimeout(3500);
console.log('after:', JSON.stringify(await toasts()));
// Discard the draft, then a failing call.
await page.evaluate(async () => { await new Promise(r => setTimeout(r, 6000)); });
await page.evaluate(() => { document.querySelectorAll('#toast-container .toast').forEach(t => t.remove()); window.__mode = 'fail'; });
await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(400);
const discard = await page.$('.story-director-draft-discard'); if (discard) { await discard.click(); await page.waitForTimeout(400); }
await page.evaluate(() => document.querySelector('.story-director-plan')?.click());
await page.waitForTimeout(3800);
console.log('failure:', JSON.stringify(await toasts()));
await browser.close();
