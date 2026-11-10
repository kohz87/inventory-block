import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/dossier scan failed|status of 40[04]|Bad Request|Failed to load resource/.test(m.text())) errors.push('console ' + m.text().slice(0, 240)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.rpgBattleInterceptor === 'function', null, { timeout: 60000 });
await page.waitForTimeout(4000);
const ev = (fn, a) => page.evaluate(fn, a);
const pane = () => ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.innerText ?? '').replace(/\s+/g, ' '); });
const clickTab = id => ev(i => document.querySelector(`.story-block-sidebar-tab[data-tab-id="${i}"]`)?.click(), id);
const clickBtn = src => ev(s => { const r = new RegExp(s); const b = [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent && !n.disabled).find(n => r.test(n.textContent.trim())); b?.click(); return b?.textContent.trim() ?? null; }, src);
const tabs = () => ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).filter(t => /rpg/.test(t)).join(','));
// One turn in SillyTavern's order: the user message, the interceptors, then the reply.
const turn = (mes, user) => ev(async ([m, u]) => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: u });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  const handoff = ctx.extensionPrompts?.rpg_battle?.value ?? '';
  const rules = ctx.extensionPrompts?.rpg_battle_rules?.value ?? '';
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: String(Date.now()), mes: m, swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1);
  return { gotResult: /Battle resolved/.test(handoff), askedForEncounter: /<Encounter>/.test(rules) };
}, [mes, user]);

async function fight(label) {
  await clickTab('ext:rpg-battle'); await page.waitForTimeout(600);
  console.log(`  offer: ${(await pane()).slice(0, 200)}`);
  await clickBtn('^Fight'); await page.waitForTimeout(2500);
  console.log(`  setup: ${(await pane()).slice(0, 400)}`);
  await page.screenshot({ path: `${S}/shots/waves-${label}-setup.png` });
  await clickBtn('^Start'); await page.waitForTimeout(1500);
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const text = await pane();
    for (const m of text.matchAll(/Reinforcements arrive: [^.]*\./g)) seen.add(m[0]);
    if (!(await clickBtn('^Auto'))) break;
    await page.waitForTimeout(1800);
  }
  const result = await pane();
  for (const m of result.matchAll(/Reinforcements arrive: [^.]*\./g)) seen.add(m[0]);
  console.log(`  waves joined: ${[...seen].join(' | ') || 'none'}`);
  console.log(`  result: ${result.slice(0, 520)}`);
  await page.screenshot({ path: `${S}/shots/waves-${label}-result.png` });
  await clickBtn('^Return to story'); await page.waitForTimeout(1200);
}

console.log('chat:', await ev(async () => {
  const ctx = SillyTavern.getContext();
  const id = ctx.characters.findIndex(c => c.name === 'Seraphina');
  await ctx.selectCharacterById(String(id));
  await new Promise(r => setTimeout(r, 2500));
  const res = await fetch('/api/characters/chats', { method: 'POST', headers: ctx.getRequestHeaders(), body: JSON.stringify({ avatar_url: ctx.characters[id].avatar }) });
  const list = Object.values(await res.json());
  // The longest chat is the one the earlier fights ran in (it has the party).
  list.sort((a, b) => (Number(b.chat_items) || 0) - (Number(a.chat_items) || 0));
  const file = String(list[0].file_name).replace(/\.jsonl$/, '');
  await ctx.openCharacterChat(file);
  await new Promise(r => setTimeout(r, 3000));
  return `${file} (${ctx.chat.length} messages, party: ${Boolean(window.StoryBlock.getBlock('Party')?.text)})`;
}));
if (await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(500); }

console.log('\n== 1. One reply, dogs one by one: waves in a single <Encounter>');
let t = await turn('The first dog breaks from the treeline, the others waiting behind it.\n<Encounter>1 feral ditch-dog (weak); then: 1 feral ditch-dog (weak); then: mangy ditch-dog (boss, even)</Encounter>', 'I head to the pen.');
console.log('  that reply was asked for <Encounter>:', t.askedForEncounter, '| tabs:', await tabs());
await fight('pack');

console.log('\n== 2. The narrating reply starts the next fight (a second pack arrives as the first falls)');
t = await turn('The last dog drops. Then, from the gorse, two more come at a run.\n<Encounter>2 feral ditch-dog (weak)</Encounter>', '*(The fight is over.)*');
console.log('  narrating reply got the result:', t.gotResult, '| tabs:', await tabs());
await fight('second');

console.log('\n== 3. A later reply, a different fight (bandits on the road)');
t = await turn('You walk back toward the palisade, the hides over your shoulder.', 'I head back.');
console.log('  narration got the result:', t.gotResult, '| asked for <Encounter> again:', t.askedForEncounter);
t = await turn('Two men step out from the willows, knives low.\n<Encounter>2 bandit (weak) | to the death</Encounter>', 'I keep walking.');
console.log('  that reply got an old result:', t.gotResult, '| asked for <Encounter>:', t.askedForEncounter, '| tabs:', await tabs());
await fight('bandits');
console.log('\ninventory:\n' + await ev(() => window.StoryBlock.getBlock('Inventory')?.text));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
