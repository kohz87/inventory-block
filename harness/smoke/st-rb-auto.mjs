import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@11h00m00s000ms');
await h.dock();
await h.turn(r3, 'I draw.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(2500);
await h.click('^Start'); await page.waitForTimeout(2000);
const round = () => ev(() => (document.querySelector('.story-block-pane:not([style*="none"])')?.innerText.match(/Round \d+/i) ?? ['?'])[0]);
console.log('start', await round());
// As the reviewer's script: Attack or Auto three times, then Auto.
for (let i = 0; i < 3; i++) { const c = await h.click('^Attack|^Auto'); console.log('clicked', c, await round()); if (!c) break; await page.waitForTimeout(700); }
for (let i = 0; i < 30; i++) { const c = await h.click('^Auto'); if (!c) break; await page.waitForTimeout(500); }
console.log('end:', (await h.pane()).slice(0, 200));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
