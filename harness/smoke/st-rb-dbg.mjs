import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const logs = []; page.on('console', m => { if (/RPG|Error|error/.test(m.text())) logs.push(m.text().slice(0, 300)); });
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Market Square')
  .replace('**👥 NPCs Present:**', '**👥 NPCs Present:**\n**Greta:**\n* *Mood:* brisk')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 2 | heal 20');
await h.openNarrator('The Narrator - 2026-10-18@11h00m00s000ms');
await h.dock();
await h.turn(base, 'I go to the market.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-trade'); await page.waitForTimeout(1000);
console.log('pane:', (await h.pane()).slice(0, 700));
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
console.log('party buttons:', await ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(Boolean).join(' | ')));
console.log('logs:', logs.slice(0, 8).join('\n'));
await h.browser.close();
