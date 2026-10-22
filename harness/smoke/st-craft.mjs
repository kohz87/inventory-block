import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
const withLoot = base.replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nGranary Cellar Rat Tail | 5\nMinor Healing Draught | 3 | heal 20\nBrood-Mother Skull | 1 | uncommon material');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(withLoot, 'I count what I took from the cellar.');
await page.waitForTimeout(2500);
// The crafter's reply: the model kept the skull and wrote its own charm, and says what was made.
const craft = withLoot.replace('Brood-Mother Skull | 1 | uncommon material', 'Brood-Mother Skull | 1 | uncommon material\nSkull Charm | 1 | a charm of yellowed bone')
  .replace('</Inventory>', '</Inventory>\n<Crafted>\nSkull Charm from the Brood-Mother Skull, 2 Rat Tail\n</Crafted>');
const at = await h.turn(craft, 'I ask the bonewright to make a charm from the skull.');
await page.waitForTimeout(3000);
const inv = await ev(i => (SillyTavern.getContext().chat[i].mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0], at);
console.log(inv.split('\n').filter(l => /Skull|Tail|Draught/.test(l)).join('\n'));
const shown = await ev(i => document.querySelector(`#chat .mes[mesid="${i}"] .mes_text`)?.innerText ?? '', at);
console.log('Crafted tag visible in narration:', /<Crafted>|Skull Charm from/.test(shown));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
