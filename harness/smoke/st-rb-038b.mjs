import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Market Square')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 2 | heal 20\n\n[Loot]\nRat Tail | 5 | material');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; });
const party = () => ev(() => window.StoryBlock.getBlock('Party')?.text ?? '');
const set = (selector, value) => ev(([sel, v]) => { const n = document.querySelector(sel); n.value = v; n.dispatchEvent(new Event('change', { bubbles: true })); }, [selector, value]);
await h.openNarrator('The Narrator - 2026-10-18@11h00m00s000ms');
await h.dock();
await h.turn(base, 'I go to the market.');
await page.waitForTimeout(2500);
const tabs = await ev(() => [...document.querySelectorAll('[data-tab-id], .story-block-tab')].map(t => t.textContent.trim()).filter(Boolean).join(' | '));
console.log('sidebar tabs:', tabs.slice(0, 200));
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
await h.click('^Trade'); await page.waitForTimeout(800);
console.log('traders:', await ev(() => [...document.querySelectorAll('.rpg-trade-person option')].map(o => o.textContent).join(', ')));
await set('.rpg-trade-person', 'kind:apothecary'); await page.waitForTimeout(500);
console.log('apothecary stock:', await ev(() => [...document.querySelectorAll('.rpg-trade-buy-list .rpg-trade-item')].map(li => li.innerText.replace(/\s+/g, ' ')).join(' | ')));
await ev(() => document.querySelector('.rpg-trade-buy:not([disabled])')?.click()); await page.waitForTimeout(1200);
await set('.rpg-trade-person', 'kind:general'); await page.waitForTimeout(500);
await ev(() => [...document.querySelectorAll('.rpg-trade-sell')].find(b => /Sell/.test(b.textContent) && /Rat Tail/.test(b.closest('li').textContent))?.click()); await page.waitForTimeout(1200);
console.log('told:', await ev(() => [...document.querySelectorAll('.rpg-trade-told li')].map(li => li.textContent).join(' | ')));
console.log('inventory:', (await inv()).split('\n').filter(l => /Coin|Draught|Antidote|Tonic|Rat Tail/.test(l)).join(' / '));
// Item use: back to Party, Use item, Use.
await h.click('^Party'); await page.waitForTimeout(600);
await ev(async () => { const c = SillyTavern.getContext(); const i = c.chat.length - 1; const t = window.StoryBlock.getBlock('Party').text.replace(/(## Ren[\s\S]*?HP: )\d+/, '$140'); await window.StoryBlock.setBlockText(i, 'Party', t); });
await page.waitForTimeout(800);
const hp0 = ((await party()).match(/## Ren[\s\S]*?HP: (\d+\/\d+)/) ?? [])[1];
await h.click('^Use item'); await page.waitForTimeout(800);
console.log('use buttons:', await ev(() => [...document.querySelectorAll('.rpg-battle-use')].map(b => `${b.textContent.trim()}${b.disabled ? '(off)' : ''}`).join(', ')));
await ev(() => document.querySelector('.rpg-battle-use:not([disabled])')?.click()); await page.waitForTimeout(800);
const box = await ev(() => document.getElementById('send_textarea').value);
console.log('message box:', JSON.stringify(box), '· HP before:', hp0);
// The notes as the interceptor sets them (the harness reloads the chat after, which clears prompts).
const notes = await ev(async b => { const c = SillyTavern.getContext(); c.chat.push({ name: c.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: b, extra: {} }); await window.rpgBattleInterceptor(c.chat, 8000, () => {}, 'normal'); const p = c.extensionPrompts ?? {}; c.chat.pop(); return [p.rpg_battle_item?.value ?? '', p.rpg_battle_trade?.value ?? '', p.rpg_battle_item?.depth, p.rpg_battle_trade?.depth]; }, box);
console.log('item note:', notes[0], '· depth', notes[2]);
console.log('trade note:', notes[1].split('\n')[0], '· depth', notes[3]);
const t = await h.turn(base.replace('Rat Tail | 5 | material', ''), box || 'I drink.');
await page.waitForTimeout(3000);
console.log('HP after:', ((await party()).match(/## Ren[\s\S]*?HP: (\d+\/\d+)/) ?? [])[1], '· draughts:', ((await inv()).match(/Minor Healing Draught \| \d+/) ?? ['none'])[0]);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
