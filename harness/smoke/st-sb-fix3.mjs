import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Market Square')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nMinor Healing Draught | 2 | heal 20');
const inv = i => ev(k => (SillyTavern.getContext().chat[k].mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? ['(none)'])[0], i);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await ev(() => { const c = SillyTavern.getContext(); const b = c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory'); window.__wasOn = b.enabled; b.enabled = true; });
await h.turn(base, 'I go to market.');
await page.waitForTimeout(2000);
const signed = base.replace(/<Inventory>[\s\S]*?<\/Inventory>/, '<Inventory>\n+ Even Trophy | 2\n+ Cellar Rat Tail | 6 | material\n- Minor Healing Draught | 1\n</Inventory>');
const at = await h.turn(signed, 'I count the loot.');
await page.waitForTimeout(3000);
console.log(await inv(at));
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
await ev(() => [...document.querySelectorAll('.rpg-battle-page')].find(b => /Trade/.test(b.textContent))?.click());
await page.waitForTimeout(1000);
console.log('trade purse:', await ev(() => document.querySelector('.rpg-trade-purse')?.textContent ?? '(no purse line)'));
await page.screenshot({ path: `${S}/uiux/sb-fix3/trade-purse.png` });
await h.tab('block:inventory'); await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/uiux/sb-fix3/inventory.png` });
console.log('toasts:', await ev(() => [...document.querySelectorAll('.toast-message')].map(t => t.textContent).join(' | ') || 'none'));
await ev(() => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory').enabled = window.__wasOn; c.saveSettingsDebounced(); });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
