import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@12h00m00s000ms');
await h.dock();
const was = await ev(() => { const c = SillyTavern.getContext(); const b = c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory'); const w = b.enabled; b.enabled = true; c.saveSettingsDebounced(); return w; });
try {
  const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
  await h.turn(base.replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 2 | heal 20'), 'I check my pack.');
  await page.waitForTimeout(1500);
  const changes = base.replace(/<Inventory>[\s\S]*?<\/Inventory>/, '<Inventory_Changes>\n[Consumables]\n+ Minor Healing Draught | 2\n[Loot]\n+ Brood-Mother Skull | 1 | uncommon material · MDEF\n</Inventory_Changes>');
  const at = await h.turn(changes, 'I loot the nest.');
  await page.waitForTimeout(2500);
  await h.tab('block:inventory');
  const chips = await ev(() => [...document.querySelectorAll('.story-block-found-chip')].map(c => `${c.querySelector('.story-block-found-name').textContent} [${c.className.replace('story-block-found-chip', '').trim()}]`));
  console.log('chips:', JSON.stringify(chips));
  const tint = await ev(() => [...document.querySelectorAll('.story-block-tree-item-label.story-block-rarity')].map(n => `${n.textContent}:${getComputedStyle(n).color}`));
  console.log('tinted names:', JSON.stringify(tint));
  await ev(() => [...document.querySelectorAll('.story-block-found-chip')].find(c => /Skull/.test(c.textContent))?.querySelector('.story-block-found-leave')?.click());
  await page.waitForTimeout(1500);
  const inv = await ev(i => (SillyTavern.getContext().chat[i].mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0], at);
  console.log('after Leave:', inv.split('\n').filter(l => /Skull|Draught|\[Loot\]/.test(l)).join(' / '));
  console.log('chips after:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-found-name')].map(n => n.textContent))));
  // What's sent, in the settings panel.
  const sent = await ev(() => { const f = document.querySelector('#story_block_settings details[data-fold="sent"]'); if (!f) return 'no fold'; f.open = true; f.dispatchEvent(new Event('toggle')); const pre = f.querySelector('.story-block-preview-text'); return `${f.querySelector('.story-suite-fold-hint').textContent} | ${pre ? pre.textContent.slice(0, 60).replace(/\n/g, ' / ') : 'no text'} | inventory section: ${/Inventory_Changes/.test(pre?.textContent ?? '')}`; });
  console.log("settings What's sent:", sent);
  // The overlay's What's sent.
  await ev(() => globalThis.StorySuite?.api?.('story-block')?.openSuite?.('overview'));
  await page.waitForTimeout(1000);
  const overlay = await ev(() => { const f = document.querySelector('#story_suite_overlay .story-suite-pane .story-suite-folds > details[data-fold="sent"]'); if (!f) return 'no sent fold'; const out = []; for (const d of f.querySelectorAll('details.story-suite-fold')) { d.open = true; d.dispatchEvent(new Event('toggle')); out.push(`${d.dataset.providerId}=${[...d.querySelectorAll('.story-block-preview-head')].map(x => x.textContent.replace(/Copy$/, '')).join('+') || 'empty'}`); } return `${f.querySelector('.story-suite-fold-hint').textContent} | ${out.join(' ; ')}`; });
  console.log("overlay What's sent:", overlay);
} finally {
  await ev(w => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock.blocks.find(x => x.template === 'inventory').enabled = w; c.saveSettingsDebounced(); }, was);
  await page.waitForTimeout(800);
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
