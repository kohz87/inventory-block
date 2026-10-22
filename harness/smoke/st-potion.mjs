import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
const inv = n => (n.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0];
const r1 = base.replace(/<Encounter>[\s\S]*?<\/Encounter>/, '').replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 4 | heal 20\nWolfsbane Tonic | 2 | heal 25');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(r1, 'I check my satchel.');
await page.waitForTimeout(2000);
// The model retells both potions and the sword.
const r2 = r1.replace('heal 20', 'Weak restorative fluid (heals minor wounds)').replace('heal 25', 'Bitter green tonic').replace('Equipped · Common · ATK +4 · Notched near the guard', 'A notched blade, still keen');
const at = await h.turn(r2, 'I walk on.');
await page.waitForTimeout(3000);
const mes = await ev(i => SillyTavern.getContext().chat[i].mes, at);
console.log(inv(mes).split('\n').filter(l => /Draught|Tonic|Sword/.test(l)).join('\n'));
// Human foes, and the potions usable in the fight.
const r3 = r2.replace('</Inventory>', '</Inventory>\n<Encounter>\n2 hired muscle (weak)\n</Encounter>');
await h.turn(r3, 'Two men block the lane.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
const setup = await ev(() => { const s = SillyTavern.getContext().chatMetadata.rpgBattle; const f = s?.fight?.setup ?? s?.plan; return JSON.stringify({ items: f?.party?.[0]?.items?.map(i => `${i.name} ${JSON.stringify(i.effect)}`), foes: f?.enemies?.map(e => `${e.name}: ${Array.isArray(e.loot) ? e.loot.map(r => r.name).join(', ') : e.loot} coins=${e.coins}`) }); });
console.log(setup);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
