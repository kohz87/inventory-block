import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Market Square')
  .replace('**👥 NPCs Present:**', '**👥 NPCs Present:**\n**Greta:**\n* *Mood:* brisk')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 2 | heal 20');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; });
await h.openNarrator('The Narrator - 2026-10-18@11h00m00s000ms');
await h.dock();
await h.turn(base, 'I go to the market.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-trade'); await page.waitForTimeout(1000);
console.log('people:', await ev(() => [...document.querySelectorAll('.rpg-trade-person option')].map(o => o.textContent).join(', ')));
console.log('purse first:', await ev(() => document.querySelector('.rpg-trade-tab')?.firstElementChild?.className));
console.log('stock:', await ev(() => [...document.querySelectorAll('.rpg-trade-buy-list .rpg-trade-item')].map(li => li.innerText.replace(/\s+/g, ' ')).join(' | ')));
await ev(() => document.querySelector('.rpg-trade-buy:not([disabled])')?.click());
await page.waitForTimeout(1500);
console.log('after buy:', (await inv()).split('\n').filter(l => /Coin|Loot|Gear|\|/.test(l)).slice(0, 12).join(' / '));
// Use an item: the marker goes in the message box.
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
const hpBefore = await ev(() => (SillyTavern.getContext().chat.at(-1).mes.match(/HP: \d+\/\d+/) ?? ['?'])[0]);
await h.click('^Use item'); await page.waitForTimeout(800);
await h.click('^Use$'); await page.waitForTimeout(800);
const box = await ev(() => document.getElementById('send_textarea').value);
console.log('message box:', box, '· HP before:', hpBefore);
const sent = await ev(() => [...document.querySelectorAll('.rpg-battle-sent-part')].map(p => p.innerText.replace(/\s+/g, ' ').slice(0, 140)).join(' || '));
console.log("what's sent:", sent || '(fold empty)');
// Send it: the reply gets the note and the effect.
await h.turn(base.replace('Minor Healing Draught | 2 | heal 20', 'Minor Healing Draught | 2 | heal 20'), box);
await page.waitForTimeout(3000);
const last = await ev(() => SillyTavern.getContext().chat.at(-1).mes);
console.log('after send HP:', (last.match(/## Ren[\s\S]*?HP: \d+\/\d+/) ?? ['?'])[0].split('\n').pop(), '· draughts:', (last.match(/Minor Healing Draught \| \d+/) ?? ['?'])[0]);
console.log('item note sent:', await ev(() => SillyTavern.getContext().extensionPrompts?.rpg_battle_item?.value?.slice(0, 160) ?? 'none'));
console.log('shop note:', await ev(() => SillyTavern.getContext().extensionPrompts?.rpg_battle_shop?.value?.slice(0, 120) ?? 'none'));
// The fight toast: once.
const enc = base.replace('</Inventory>', '</Inventory>\n<Encounter>\n2 wolf (weak)\n</Encounter>');
await h.turn(enc, 'Wolves!');
await page.waitForTimeout(2500);
await ev(async () => { const c = SillyTavern.getContext(); await c.eventSource.emit(c.eventTypes.CHARACTER_MESSAGE_RENDERED, c.chat.length - 1); });
await page.waitForTimeout(1500);
console.log('fight toasts:', await ev(() => [...document.querySelectorAll('#toast-container .toast')].filter(t => /fight is starting|wolf/i.test(t.textContent)).length));
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(2000);
console.log('fight toasts after Fight:', await ev(() => [...document.querySelectorAll('#toast-container .toast')].filter(t => /fight is starting|wolf/i.test(t.textContent)).length));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
