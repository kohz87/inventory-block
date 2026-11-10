import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/dossier scan failed|status of 40[04]|Bad Request|Failed to load resource/.test(m.text())) errors.push('console ' + m.text().slice(0, 240)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 });
await page.waitForTimeout(4500);
const ev = (fn, a) => page.evaluate(fn, a);
const paneText = () => ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.dataset.tabId ?? '') + ' :: ' + (p?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 1200); });
const tabs = () => ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(','));
const clickTab = id => ev(i => document.querySelector(`.story-block-sidebar-tab[data-tab-id="${i}"]`)?.click(), id);
const buttons = () => ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent).map(n => n.textContent.trim()).filter(Boolean));
const clickBtn = src => ev(s => { const r = new RegExp(s); const b = [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent && !n.disabled).find(n => r.test(n.textContent.trim())); b?.click(); return b?.textContent.trim() ?? null; }, src);
const say = (mes, user = 'Go on.') => ev(async ([m, u]) => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: u });
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: m, swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1);
}, [mes, user]);
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
if (await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(500); }
await ev(() => { const ctx = SillyTavern.getContext(); if (ctx.chatMetadata.rpgBattle) ctx.chatMetadata.rpgBattle.pending = null; });
console.log('tabs before:', await tabs());

async function fight(label, text, shot) {
  await say(text); await page.waitForTimeout(2500);
  console.log(`\n== ${label}\ntabs:`, await tabs());
  await clickTab('ext:rpg-battle'); await page.waitForTimeout(600);
  console.log('offer:', (await paneText()).slice(0, 300));
  console.log('fight?:', await clickBtn('^Fight')); await page.waitForTimeout(2500);
  console.log('setup:', (await paneText()).slice(0, 500));
  console.log('setup inputs:', await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-tab input, .story-block-pane .rpg-battle-tab select, .story-block-pane .rpg-battle-tab textarea')].filter(n => n.offsetParent).length));
  console.log('setup buttons:', JSON.stringify(await buttons()));
  await page.screenshot({ path: `${S}/shots/${shot}-setup.png` });
  console.log('start:', await clickBtn('^Start')); await page.waitForTimeout(1500);
  for (let i = 0; i < 12; i++) { const a = await clickBtn('^Auto'); if (!a) break; await page.waitForTimeout(2000); }
  console.log('result:', (await paneText()).slice(0, 900));
  console.log('result buttons:', JSON.stringify(await buttons()));
  await page.screenshot({ path: `${S}/shots/${shot}-result.png` });
  console.log('return:', await clickBtn('^Return to story')); await page.waitForTimeout(1500);
}
await fight('wolves', 'Wolves pour out of the alders.\n<Encounter>3 wolf (weak)</Encounter>', 'r042-wolf');
const handoff = async () => ev(() => { const s = SillyTavern.getContext().chatMetadata.rpgBattle?.pending; return s ? { attached: s.handoff?.attachedTo ?? s.attachedTo ?? null, has: Boolean(s.handoff) } : null; });
await clickTab('ext:rpg-party'); await page.waitForTimeout(500);
console.log('party notice before narration:', /waiting to be narrated/.test(await paneText()), JSON.stringify(await handoff()));
// The narrating reply, in SillyTavern's order: the user message, the interceptor, then the reply.
const turn = (mes, user) => ev(async ([m, u]) => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: u });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  const prompt = ctx.extensionPrompts?.rpg_battle?.value ?? '';
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: m, swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1);
  return /Battle resolved/.test(prompt);
}, [mes, user]);
console.log('narrating reply got the result:', await turn('You skin the wolves by the ditch and bag the pelts.', 'I field dress them.')); await page.waitForTimeout(2000);
await clickTab('ext:rpg-party'); await page.waitForTimeout(500);
console.log('after narrating reply: notice', /waiting to be narrated/.test(await paneText()), JSON.stringify(await handoff()));
// A swipe of that reply: SillyTavern hands the interceptor the chat without it.
const swipe = await ev(async () => { const ctx = SillyTavern.getContext(); await window.rpgBattleInterceptor(ctx.chat.slice(0, -1), 8000, () => {}, 'swipe'); return /Battle resolved/.test(ctx.extensionPrompts?.rpg_battle?.value ?? ''); });
console.log('swipe of it still gets the result:', swipe);
console.log('next reply got the result:', await turn('You walk back toward town.', 'We head back.')); await page.waitForTimeout(2000);
await clickTab('ext:rpg-party'); await page.waitForTimeout(500);
console.log('after next reply: notice', /waiting to be narrated/.test(await paneText()), JSON.stringify(await handoff()));
await fight('bandits to the death', 'Two bandits block the road, blades out.\n<Encounter>2 bandit (weak) | to the death</Encounter>', 'r042-bandit');
await ev(() => { const ctx = SillyTavern.getContext(); if (ctx.chatMetadata.rpgBattle) ctx.chatMetadata.rpgBattle.pending = null; });
const last = await ev(() => SillyTavern.getContext().chat.at(-1).mes);
console.log('\nenvelopes in last reply:', (last.match(/STORY_BLOCKS_V1\b/g) ?? []).length);
console.log('inventory:\n' + await ev(() => window.StoryBlock.getBlock('Inventory')?.text));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
