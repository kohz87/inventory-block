import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const read = f => fs.readFileSync(`${S}/demo/${f}`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(read('r3.txt'), 'We take the river path east to the weir.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('setup:', (await h.pane()).slice(0, 160));
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(1000); }
console.log('handoff:\n' + await ev(() => document.querySelector('.rpg-battle-section.is-handoff .rpg-battle-handoff')?.textContent ?? 'none'));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
