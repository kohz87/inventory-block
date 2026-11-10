import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const logs = []; page.on('console', m => { if (/Story (Block|Director)|error|Error/.test(m.text())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => logs.push('pageerror: ' + e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1200);
const WS = (time, off) => `<World_State>
**📅 Time:** ${time} | **🌤 Loc:** Auvoth | Seventh Seal Terrace | [59.0, 110.0] | **🌡 Wx:** Freezing rain
---
**🧍 Ren:**
* *Outfit:* Soaked drake armor
---
**👥 NPCs Present:**
**Chiyo:**
* *Mood:* Exhausted
---
**📡 Off-Screen:**
${off}
**🌍 World:**
* Canal Street Granary Fires — Lower city ablaze | then: citywide night curfew declared | on: Haywane 12, 06:00 pm
**🔥 Hooks:**
* River stranger — who pulled Ren from the sump | then: he sends word | on: Haywane 15
**⏳ Clocks:**
* Hollin's Reach graves — the dead rise | due: Goldwane 28 | shown: sign
</World_State>`;
const r = await page.evaluate(async ({ ws1 }) => {
  const ctx = SillyTavern.getContext(); const sb = window.StoryBlock; const out = {};
  ctx.extensionSettings.storyDirector = { ...(ctx.extensionSettings.storyDirector || {}), calendar: { preset: 'custom', era: 'CY', daysPerMonth: 30, months: ['Dawnwane','Rainmoot','Greengale','Highsun','Goldwane','Haywane','Emberwane','Nightfall','Frostfall','Deepwinter','Icewane','Yearsend'].map(name => ({ name, days: 30 })) } };
  out.blocks = sb.listBlocks().map(b => b.tag).join(',');
  out.settingsPanel = Boolean(document.querySelector('#story_director_settings .story-director-settings, #story_director_settings'));
  const i = ctx.chat.length - 1;
  ctx.chat[i].mes = 'The water rose another inch.\n<!-- STORY_BLOCKS_V1\n<Blocks>\n' + ws1 + '\n</Blocks>\n-->';
  await ctx.saveChat();
  sb.refresh();
  return out;
}, { ws1: WS('CY 611, Haywane 12, 05:35 pm', '* **Senior Listener Geva — now:** District Bailiff Court | then: argues with magistrates | on: Haywane 12, 05:45 pm\n* Brant — now: on the frontier road with a dray | then: reaches Auvoth | leg: Bluewatch Village → Auvoth 70 F, wagon 14/day → 5 | arrive: Haywane 17, evening') });
console.log('setup', JSON.stringify(r));
await page.waitForTimeout(600);
// Open the sidebar Director tab and seed.
await page.evaluate(() => { const t = document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]'); t?.click(); });
await page.waitForTimeout(500);
const seedBtn = await page.$('.story-director-tab button:has-text("Seed")');
console.log('seed button in tab:', Boolean(seedBtn));
if (seedBtn) { await seedBtn.click(); await page.waitForTimeout(500); await page.click('dialog[open] .popup-button-ok').catch(e => console.log('no popup', e.message)); await page.waitForTimeout(1200); }
const afterSeed = await page.evaluate(() => { const sb = window.StoryBlock; return sb.getBlock('Director')?.text; });
console.log('director after seed:\n' + afterSeed);
// Note for the next reply (time 05:50 pm: Geva due 05:45).
const note = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, mes: 'I check on Chiyo and ask about Geva.', send_date: Date.now(), extra: {} });
  await window.storyDirectorInterceptor(ctx.chat, 8000, () => {}, 'normal');
  return ctx.extensionPrompts?.story_director;
});
console.log('note:', JSON.stringify({ position: note?.position, depth: note?.depth, role: note?.role }), '\n' + note?.value);
// A reply with changes; the scene moves to 06:10 pm.
const reply = await page.evaluate(async ({ ws2 }) => {
  const ctx = SillyTavern.getContext(); const sb = window.StoryBlock;
  const msg = { name: 'Seraphina', is_user: false, is_system: false, mes: 'Chiyo shivers by the fire.\n' + ws2 + '\n<Director>\n! Senior Listener Geva — the magistrates refuse | then: reissues the warrants | on: Haywane 13, 09:00 am\n+ agenda Courier — now: rides south from Shorn | then: delivers the writ | on: Haywane 13\n~ Nobody Known — then: vanishes\n</Director>', send_date: Date.now(), extra: {} };
  ctx.chat.push(msg); ctx.addOneMessage(msg);
  const id = ctx.chat.length - 1;
  await ctx.eventSource.emit(ctx.eventTypes.MESSAGE_RECEIVED, id);
  await new Promise(res => setTimeout(res, 1500));
  return { rendered: document.querySelector(`#chat .mes[mesid="${id}"] .mes_text`)?.textContent.trim(), director: sb.getBlock('Director')?.text, offscreen: (sb.getBlock('World_State')?.text.match(/\*\*📡 Off-Screen:\*\*[\s\S]*?(?=\n\*\*🌍)/) || [''])[0] };
}, { ws2: WS('CY 611, Haywane 12, 06:10 pm', '* **Senior Listener Geva — now:** District Bailiff Court | then: argues with magistrates | on: Haywane 12, 05:45 pm') });
console.log('reply:', JSON.stringify(reply, null, 1));
await page.evaluate(() => window.StoryBlock.refresh()); await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(500);
await page.screenshot({ path: `shots/director-${W}.png` });
const tabText = await page.evaluate(() => document.querySelector('.story-director-tab')?.innerText.slice(0, 900));
console.log('tab text:\n' + tabText);
console.log('logs:\n' + logs.slice(-8).join('\n'));
await browser.close();
