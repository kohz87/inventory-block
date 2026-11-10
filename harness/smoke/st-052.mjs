import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const O = `${S}/shots/v052`; fs.mkdirSync(O, { recursive: true });
let h = await open({ width: 1440, height: 1000 });
// Soul Class tiers, XP rate 1.
await h.ev(async () => { const ctx = SillyTavern.getContext(); const s = ctx.extensionSettings.rpgBattle; s.terms = { levelName: 'Soul Class', xpName: 'XP', tiers: { size: 10 } }; s.xpRate = 1; ctx.saveSettingsDebounced(); });
await h.page.waitForTimeout(2500); await h.browser.close();
h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const side = file => page.screenshot({ path: `${O}/${file}.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
const greeting = fs.readFileSync(`${S}/demo/greeting.txt`, 'utf8').replace(/<Joins>[\s\S]*?<\/Joins>\n/, '');
console.log('chat:', await ev(async g => {
  const ctx = SillyTavern.getContext();
  await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
  await new Promise(r => setTimeout(r, 2000));
  await ctx.executeSlashCommandsWithOptions('/newchat');
  await new Promise(r => setTimeout(r, 2500));
  ctx.chat[0].mes = g; ctx.chat[0].swipes = [g]; ctx.chat[0].swipe_id = 0;
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return ctx.getCurrentChatId();
}, greeting));
await page.waitForTimeout(2500); await h.dock();
await h.tab('ext:rpg-party');
for (const stat of ['AGI', 'DEX', 'STR', 'AGI', 'VIT', 'DEX', 'AGI', 'STR', 'LUK', 'AGI']) { await page.locator(`.story-block-pane .rpg-battle-stepper[data-stat="${stat}"] .is-plus`).first().click().catch(() => {}); await page.waitForTimeout(60); }
await h.click('^Create character'); await page.waitForTimeout(2500);
await h.click('^Add it'); await page.waitForTimeout(1500);
await ev(() => document.querySelector('.story-block-pane .rpg-battle-learn-template')?.click()); await page.waitForTimeout(2000);
console.log('party:', (await h.pane()).slice(0, 260));
const fightRow = async (label, text, shot) => {
  await h.turn(text, 'I go on.'); await page.waitForTimeout(3000);
  await h.tab('ext:rpg-battle'); await h.click('^Fight\\?$'); await page.waitForTimeout(3500);
  console.log(`${label} setup:`, (await h.pane()).slice(0, 330));
  console.log(`${label} new tooltip:`, await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-new')].map(n => n.title).join(' | ')));
  await side(`${shot}-setup`);
  await h.click('^Start$'); await page.waitForTimeout(1500);
  console.log(`${label} card badges:`, await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-card.is-enemy')].map(c => c.innerText.replace(/\s+/g, ' ').slice(0, 60)).join(' | ')));
  await side(`${shot}-fight`);
  for (let i = 0; i < 20; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(1400); }
  console.log(`${label} result:`, (await h.pane()).slice(0, 420));
  await side(`${shot}-result`);
  await h.click('^Return to story'); await page.waitForTimeout(1200);
  await h.turn('The fight is narrated.', '*(The fight is over.)*'); await page.waitForTimeout(2000);
};
await fightRow('dogs', 'Two dogs burst from the ditch.\n<Encounter>2 feral ditch-dog (weak)</Encounter>', 'dogs');
await h.tab('ext:rpg-party');
console.log('party after dogs:', (await h.pane()).match(/XP\s*\S+/g)?.slice(0, 3), '|', (await h.pane()).slice(0, 200));
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.extensionSettings.rpgBattle.xpRate = 2; ctx.saveSettingsDebounced(); });
await page.waitForTimeout(500);
await fightRow('razor dog', 'Something bigger comes out of the gorse: a lean, scarred hound with a ridge of blade-like bristles.\n<Encounter>razor dog (strong)</Encounter>', 'razor');
await h.tab('ext:rpg-party');
await ev(() => { for (const d of document.querySelectorAll('.story-block-pane details')) d.open = true; }); await page.waitForTimeout(500);
const pt = await h.pane();
console.log('bestiary:', pt.slice(pt.indexOf('BESTIARY'), pt.indexOf('BESTIARY') + 400));
console.log('xp now:', pt.match(/XP\s*[0-9/ ]+/g)?.slice(0, 2));
console.log('settings row:', await ev(() => { const r = [...document.querySelectorAll('.story-suite-row')].find(n => /XP rate/.test(n.textContent)); return r ? r.innerText.replace(/\s+/g, ' ') : 'missing'; }));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
