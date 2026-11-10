import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Adventurer Guild Post')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nRat Tail | 5 | material · AGI, poison\nBrood-Mother Skull | 1 | uncommon material · MDEF');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; });
const pick = t => t.split('\n').filter(l => /Coin|Rat Tail|Skull|On Order/.test(l)).join(' / ');
await h.openNarrator('The Narrator - 2026-10-18@11h00m00s000ms');
await h.dock();
await h.turn(base, 'I go to the guild post.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-trade'); await page.waitForTimeout(1000);
console.log('trade pane:', (await h.pane()).slice(0, 420));
console.log('before:', pick(await inv()));
// Sell 3 rat tails to whoever is first in the list.
await ev(() => { const q = document.querySelector('.rpg-trade-qty'); q.value = '3'; q.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(300);
console.log('sell button:', await ev(() => document.querySelector('.rpg-trade-sell')?.textContent));
await ev(() => document.querySelector('.rpg-trade-sell').click());
await page.waitForTimeout(1500);
console.log('after sale:', pick(await inv()));
// Order a Skull Ring from the bone-carver.
await ev(() => {
  const person = document.querySelector('.rpg-trade-person'); person.value = person.options[person.options.length - 1].value; person.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(300);
await ev(() => { const n = document.querySelector('.rpg-trade-name'); n.value = 'the bone-carver'; n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(300);
await ev(() => { const p = document.querySelector('.rpg-trade-piece'); p.value = 'Skull Ring'; p.dispatchEvent(new Event('input', { bubbles: true })); p.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(300);
await ev(() => { const box = [...document.querySelectorAll('.rpg-trade-pick')].find(b => /Skull/.test(b.closest('li').textContent)); box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(300);
await ev(() => { const w = document.querySelector('.rpg-trade-when'); w.value = 'order'; w.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(300);
console.log('kind:', await ev(() => document.querySelector('.rpg-trade-kind').value), '· preview:', await ev(() => document.querySelector('.rpg-trade-preview')?.textContent));
await ev(() => document.querySelector('.rpg-trade-craft').click());
await page.waitForTimeout(1500);
console.log('after order:', pick(await inv()));
console.log('collect buttons:', await ev(() => document.querySelectorAll('.rpg-trade-collect').length));
await ev(() => document.querySelector('.rpg-trade-collect').click());
await page.waitForTimeout(1500);
console.log('after collect:', pick(await inv()));
console.log('told:', await ev(() => [...document.querySelectorAll('.rpg-trade-told li')].map(li => li.textContent).join(' | ')));
// The next reply's prompt: the interceptor sets the trade note.
const note = await ev(async () => { const c = SillyTavern.getContext(); c.chat.push({ name: c.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'I pocket the coin.', extra: {} }); await window.rpgBattleInterceptor(c.chat, 8000, () => {}, 'normal'); const p = c.extensionPrompts?.rpg_battle_trade; c.chat.pop(); return p ? `${p.depth}: ${p.value}` : 'none'; });
console.log('trade note:', note);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
