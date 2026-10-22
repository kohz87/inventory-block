import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/dossier scan failed|status of 40[04]|Bad Request|Failed to load resource/.test(m.text())) errors.push('console ' + m.text().slice(0, 240)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite && window.NPCStateDelta, null, { timeout: 60000 });
await page.waitForTimeout(4500);
const ev = (fn, a) => page.evaluate(fn, a);
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
console.log('versions:', await ev(() => window.StorySuite.providers().map(p => `${p.id}@${p.version}${p.enabled === false ? ' off' : ''}`).join(', ')));
// NSD speaker cards: a reply whose chatter has an untracked speaker and a line with no speaker.
await ev(async () => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'I pay the fee.' });
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), swipes: null, mes: 'The clerk takes the coin.\n<NPC_Inner_Chatter>\nLieke: One silver won\'t stop the Captain taking the chairs come noon.\nPalisade Sentry: Another river rat after a Watch bounty.\nSeraphina: I should keep an eye on this one.\n</NPC_Inner_Chatter>' });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1);
});
await page.waitForTimeout(3000);
if (await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(500); }
await ev(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:npc-state-delta-cast"]')?.click()); await page.waitForTimeout(1200);
console.log('cast pane:', await ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 600); }));
console.log('cells:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane .npc-state-delta-present-cell')].filter(n => n.offsetParent).map(n => n.className.replace(/npc-state-delta-present-cell-?/g, '').trim() + ' :: ' + n.querySelector('.npc-state-delta-present-card-name')?.textContent))));
await page.screenshot({ path: `${S}/shots/nsd-speakers.png` });
// Clean up the test turn.
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.splice(ctx.chat.length - 2, 2); await ctx.saveChat(); await ctx.reloadCurrentChat(); });
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
