import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/sb-fix2`;
for (const [device, size] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
  const h = await open(size);
  const { page, ev } = h;
  const was = await ev(() => { const c = SillyTavern.getContext(); const b = c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory'); const w = b.enabled; b.enabled = true; c.saveSettingsDebounced(); return w; });
  const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
  await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
  if (device === 'desktop') await h.dock();
  await h.turn(base, 'I look around the cellar.');
  await page.waitForTimeout(2000);
  const changes = base.replace(/<Inventory>[\s\S]*?<\/Inventory>/, '<Inventory_Changes>\n[Loot]\n+ Burlap Sack | 2 | coarse\n+ Wolf Core | 2 | dull beast cores\n+ Cellar Rat Tail | 6 | material\n+ Gnawed Bone | 3 | material\n+ Brood-Mother Skull | 1 | uncommon material · MDEF\n~ Rope | 1 | frayed\n- Waterskin\n</Inventory_Changes>');
  await h.turn(changes, 'I gather what the rats left.');
  await page.waitForTimeout(2500);
  if (device === 'mobile') { await ev(() => document.querySelector('#story_block_handle')?.click()); await page.waitForTimeout(800); }
  await h.tab('block:inventory'); await page.waitForTimeout(800);
  const folded = await ev(() => { const s = document.querySelector('.story-block-tree-changes'); return s ? { open: s.open, summary: s.querySelector('summary').innerText.replace(/\s+/g, ' '), chipsVisible: [...s.querySelectorAll('.story-block-found-chip')].some(c => c.offsetParent) } : null; });
  console.log(device, 'folded:', JSON.stringify(folded));
  await page.screenshot({ path: `${OUT}/${device}-collapsed.png` });
  await ev(() => { const s = document.querySelector('.story-block-tree-changes'); s.open = true; });
  await page.waitForTimeout(400);
  const chips = await ev(() => [...document.querySelectorAll('.story-block-found-chip')].map(c => { const n = c.querySelector('.story-block-found-name'); const l = c.querySelector('.story-block-found-leave'); return `${n.textContent}|h=${Math.round(c.getBoundingClientRect().height)}|leaveH=${Math.round(l.getBoundingClientRect().height)}`; }));
  console.log(device, 'chips:', chips.join('  '));
  await page.screenshot({ path: `${OUT}/${device}-expanded.png` });
  if (device === 'desktop') {
    await ev(() => [...document.querySelectorAll('.story-block-found-chip')].find(c => /Brood-Mother/.test(c.textContent))?.querySelector('.story-block-found-leave').click());
    await page.waitForTimeout(2000);
    const mes = await ev(() => SillyTavern.getContext().chat.at(-1).mes);
    console.log('after Leave, skull in reply:', /Brood-Mother Skull/.test((mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]));
  }
  await ev(w => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory').enabled = w; c.saveSettingsDebounced(); }, was);
  await page.waitForTimeout(500);
  console.log(device, 'errors:', h.errors.join(' | ') || 'none');
  await h.browser.close();
}
