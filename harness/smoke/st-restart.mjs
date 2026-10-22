import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const read = f => fs.readFileSync(`${S}/demo/${f}`, 'utf8');
let h = await open({ width: 1440, height: 1000 });
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(read('r3.txt'), 'We take the river path east to the weir.');
await h.page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await h.page.waitForTimeout(800);
await h.click('^Fight'); await h.page.waitForTimeout(3000);
await h.click('^Start'); await h.page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await h.page.waitForTimeout(800); }
console.log('fight over, no message sent; closing the browser');
await h.browser.close();
// "Restart": a fresh browser, the same chat.
h = await open({ width: 1440, height: 1000 });
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.page.waitForTimeout(1500);
const report = await h.ev(() => {
  const fold = document.querySelector('.rpg-battle-settings details[data-fold="diagnostics"]');
  fold.open = true; fold.dispatchEvent(new Event('toggle'));
  return fold.querySelector('.rpg-battle-diagnostics').textContent;
});
console.log(report.split('\nBlocks in reply')[0]);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
