import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const withEncounter = foes => r4.replace(/<Director>[\s\S]*?<\/Director>/, `<Encounter>\n${foes}\n</Encounter>`);
const mode = () => ev(() => document.querySelector('.rpg-battle-tab')?.dataset.mode ?? [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none')?.querySelector('[data-mode]')?.dataset.mode);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(withEncounter('2 Timber Wolf (weak)'), 'I face the wolves.');
await page.waitForTimeout(2000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(600);
await h.click('Fight'); await page.waitForTimeout(600);
await h.click('^Start'); await page.waitForTimeout(2500);
await h.click('^Auto'); await page.waitForTimeout(3000);
console.log('after the first fight:', await ev(() => [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none')?.innerText.slice(0, 80).replace(/\n/g, ' | ')));
// The narrating reply tells the fight and starts a new one.
// As SillyTavern adds a generated reply: no chat reload.
await ev(async m => {
  const ctx = SillyTavern.getContext();
  const user = { name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: '*(The fight is over.)*', extra: {} };
  ctx.chat.push(user); ctx.addOneMessage(user);
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  await window.storyDirectorInterceptor?.(ctx.chat, 8000, () => {}, 'normal');
  const reply = { name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes: m, swipes: [m], swipe_id: 0, extra: {} };
  ctx.chat.push(reply); ctx.addOneMessage(reply);
  await ctx.eventSource.emit(ctx.eventTypes.MESSAGE_RECEIVED, ctx.chat.length - 1);
  await ctx.eventSource.emit(ctx.eventTypes.CHARACTER_MESSAGE_RENDERED, ctx.chat.length - 1);
  await ctx.saveChat();
}, withEncounter('6 Granary Rat (weak)'));
await page.waitForTimeout(2500);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('after the narrating reply:', await mode(), '|', await ev(() => [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none')?.innerText.slice(0, 120).replace(/\n/g, ' | ')));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
