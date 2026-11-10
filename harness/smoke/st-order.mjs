import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
const inv = i => ev(k => (SillyTavern.getContext().chat[k].mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0], i);
const pick = t => t.split('\n').filter(l => /Skull|On Order/.test(l)).join(' / ') || '(none)';
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(base.replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nBrood-Mother Skull | 1 | uncommon material · MDEF'), 'I take the skull to the bone-carver.');
await page.waitForTimeout(2000);
// The order: the model already took the skull out of the Inventory.
const a = await h.turn(base.replace('</Inventory>', '</Inventory>\n<Crafted>\nSkull Ring from Brood-Mother Skull | ready: Goldwane 14\n</Crafted>'), 'Make it a ring.');
await page.waitForTimeout(3000);
console.log('ordered:', pick(await inv(a)));
// A later reply retells the order row.
const b = await h.turn(base.replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[On Order]\nSkull Ring | 1 | being carved at the lean-to'), 'I wait two days.');
await page.waitForTimeout(3000);
console.log('retold:', pick(await inv(b)));
const c = await h.turn(base.replace('</Inventory>', '</Inventory>\n<Crafted>\nSkull Ring — collected from the bone-carver\n</Crafted>'), 'I collect the ring.');
await page.waitForTimeout(3000);
console.log('collected:', pick(await inv(c)));
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
console.log('party pane:', (await h.pane()).replace(/.*?(Gear|GEAR)/, '$1').slice(0, 220));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
