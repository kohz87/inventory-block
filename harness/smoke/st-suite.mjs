import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); if (/Story Suite/.test(m.text())) errors.push('suite ' + m.text()); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const state = () => page.evaluate(() => {
  const s = window.StorySuite;
  return { version: s.version, providers: s.providers().map(p => `${p.id}@${p.version}[${p.owns.join(',')}]${p.enabled ? '' : ' off'}`),
    owners: Object.fromEntries(Object.keys(s.areas).map(a => [a, s.owner(a)])) };
});
console.log('after load:', JSON.stringify(await state(), null, 1));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
console.log('after chat:', JSON.stringify(await state(), null, 1));
console.log('SD calendar():', JSON.stringify(await page.evaluate(() => window.StorySuite.api('story-director')?.calendar?.())).slice(0, 200));
console.log('RPG members():', JSON.stringify(await page.evaluate(() => window.StorySuite.api('rpg-battle')?.members?.())).slice(0, 300));
console.log('NSD npcs():', JSON.stringify(await page.evaluate(() => window.StorySuite.api('npc-state-delta')?.npcs?.())).slice(0, 300));
console.log('SB api:', await page.evaluate(() => Object.keys(window.StorySuite.api('story-block') ?? {}).join(',')));
// Source of truth sections in each settings panel.
const sections = await page.evaluate(() => [...document.querySelectorAll('select')].filter(s => /truth|source/i.test(s.id + ' ' + (s.name || ''))).map(s => `${s.id}=${s.value}`));
console.log('truth selects:', JSON.stringify(sections));
console.log('Now lines:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^Now: /.test(e.textContent.trim())).map(e => e.textContent.trim()).slice(0, 20))));
// Prompts
const prompts = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  for (const fn of [window.storyDirectorInterceptor, window.rpgBattleInterceptor]) if (typeof fn === 'function') await fn(ctx.chat, 8000, () => {}, 'normal');
  return Object.fromEntries(Object.entries(ctx.extensionPrompts ?? {}).map(([key, value]) => [key, (value?.value ?? '')]));
});
for (const [k, v] of Object.entries(prompts)) console.log(`prompt ${k} (${v.length}):`, /NPC State Delta keeps/.test(v) ? '[has NPC plans-only line]' : '', /as in World State/.test(v) ? '[NSD scene deferred]' : '');
// Story Block tab with Character Sheet notice?
await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(800);
console.log('deferred notices:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.story-block-notice.is-deferred')].map(e => e.textContent.trim()))));
await page.screenshot({ path: `${S}/shots/suite-tabs.png` });
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
