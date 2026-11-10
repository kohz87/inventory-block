import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open();
const { page, ev } = h;
const GREETING = fs.readFileSync(`${S}/demo/greeting.txt`, 'utf8');
console.log(await ev(async greeting => {
  const ctx = SillyTavern.getContext();
  // Persona Ren.
  const personas = ctx.powerUserSettings.personas;
  for (const key of Object.keys(personas)) personas[key] = 'Ren';
  ctx.name1 = 'Ren';
  await ctx.executeSlashCommandsWithOptions('/persona Ren').catch(() => {});
  ctx.saveSettingsDebounced?.();
  // Blocks: the ones a session like this uses.
  const s = ctx.extensionSettings.storyBlock;
  for (const b of s.blocks) {
    if (['character-sheet', 'scene-notes', 'dice-everyone'].includes(b.id)) b.enabled = false;
    if (['inventory', 'world-state', 'choices', 'dice', 'inner-chatter'].includes(b.id)) b.enabled = true;
  }
  ctx.saveSettingsDebounced?.();
  await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
  await new Promise(r => setTimeout(r, 2500));
  await ctx.executeSlashCommandsWithOptions('/newchat');
  await new Promise(r => setTimeout(r, 2500));
  ctx.chat[0].mes = greeting;
  ctx.chat[0].swipes = [greeting]; ctx.chat[0].swipe_id = 0;
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return JSON.stringify({ name1: ctx.name1, chatId: ctx.getCurrentChatId(), len: ctx.chat.length });
}, GREETING));
await page.waitForTimeout(2500);
await h.dock();
console.log('tabs:', await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(',')));
await h.tab('ext:rpg-party');
console.log('party:', (await h.pane()).slice(0, 300));
// Create Ren: points into AGI, DEX and STR.
const order = ['AGI', 'DEX', 'STR', 'AGI', 'VIT', 'DEX', 'AGI', 'STR', 'LUK', 'AGI'];
for (const stat of order) { await page.locator(`.story-block-pane .rpg-battle-stepper[data-stat="${stat}"] .is-plus`).first().click().catch(() => {}); await page.waitForTimeout(80); }
console.log('create:', await h.click('^Create character')); await page.waitForTimeout(2500);
console.log('after create:', (await h.pane()).slice(0, 500));
console.log('buttons:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(Boolean))));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
