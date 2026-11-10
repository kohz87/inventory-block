import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/sb-after`;
for (const [w, hgt, tag] of [[1440, 1000, 'desk'], [390, 844, 'phone']]) {
  const h = await open({ width: w, height: hgt });
  const { page, ev } = h;
  await h.openNarrator('The Narrator - 2026-10-18@12h00m00s000ms');
  await h.dock();
  const was = await ev(() => { const c = SillyTavern.getContext(); const b = c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory'); const w = b.enabled; b.enabled = true; c.saveSettingsDebounced(); return w; });
  try {
    if (tag === 'desk') {
      const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
      await h.turn(base.replace('</Inventory>', '</Inventory>\n<Inventory_Changes>\n[Loot]\n+ Brood-Mother Skull | 1 | uncommon material · MDEF\n+ Wolf-fang Charm | 1 | rare · LUK +2\n</Inventory_Changes>').replace(/<Inventory>[\s\S]*?<\/Inventory>/, '<Inventory>\nCoin Pouch | 1 | 6 Silver, 8 Copper\n\n[Equipment > Weapons]\nShort Sword | 1 | Equipped · Common · ATK +4\n\n[Gear]\nRope | 1 | 30 ft, hemp\nFlint & Steel | 1\n</Inventory>'), 'I look around.');
      await page.waitForTimeout(2000);
    }
    await ev(() => { if (window.innerWidth < 600) document.querySelector('#story_block_handle')?.click(); });
    await page.waitForTimeout(800);
    await h.tab('block:inventory');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${tag}-inventory.png` });
    const tabs = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.querySelector('.story-block-sidebar-tab-short')?.textContent).join(' | '));
    console.log(tag, 'tabs:', tabs);
    console.log(tag, 'short list class:', await ev(() => document.querySelector('.story-block-tree-browser')?.className));
    if (tag === 'desk') {
      await ev(() => { const p = document.querySelector('#story_block_settings'); p?.scrollIntoView(); document.querySelector('#extensions-settings-button .drawer-toggle, #extensions-settings-button')?.click(); });
      await page.waitForTimeout(1200);
      await ev(() => { const d = document.querySelector('#story_block_settings .inline-drawer-toggle'); d?.click(); });
      await page.waitForTimeout(800);
      await ev(() => { const f = document.querySelector('#story_block_settings details[data-fold="blocks"]'); if (f) { f.open = true; f.scrollIntoView(); } });
      await page.waitForTimeout(600);
      const meta = await ev(() => [...document.querySelectorAll('#story_block_settings .story-block-row-meta')].slice(0, 3).map(m => `${m.getBoundingClientRect().height.toFixed(0)}px`).join(','));
      console.log('meta line heights:', meta);
      await page.screenshot({ path: `${OUT}/desk-settings.png` });
    }
  } finally {
    await ev(w => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory').enabled = w; c.saveSettingsDebounced(); }, was);
    await page.waitForTimeout(600);
  }
  console.log(tag, 'errors:', h.errors.join('\n') || 'none');
  await h.browser.close();
}
