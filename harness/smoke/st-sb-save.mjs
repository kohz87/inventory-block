import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@12h00m00s000ms');
const was = await ev(() => { const c = SillyTavern.getContext(); const b = c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory'); const w = b.enabled; b.enabled = true; c.saveSettingsDebounced(); return w; });
try {
  const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
  await h.turn(base, 'I look around.');
  await page.waitForTimeout(1500);
  const at = await h.turn(base.replace(/<Inventory>[\s\S]*?<\/Inventory>/, '<Inventory_Changes>\n[Loot]\n+ Brood-Mother Skull | 1 | uncommon material\n</Inventory_Changes>'), 'I loot.');
  await page.waitForTimeout(2500);
  const quiet = await h.turn(base.replace(/<Inventory>[\s\S]*?<\/Inventory>/, ''), 'I rest.');
  await page.waitForTimeout(2500);
  await h.openNarrator('The Narrator - 2026-10-18@12h00m00s000ms');
  await page.waitForTimeout(1500);
  const saved = await ev(([a, q]) => { const c = SillyTavern.getContext().chat; const pick = i => (c[i]?.mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; return { changes: /Brood-Mother Skull \| 1/.test(pick(a)) && !/Inventory_Changes/.test(c[a].mes), carried: /Brood-Mother Skull/.test(pick(q)) }; }, [at, quiet]);
  console.log('after reload:', JSON.stringify(saved));
} finally {
  await ev(w => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory').enabled = w; c.saveSettingsDebounced(); }, was);
  await page.waitForTimeout(600);
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
