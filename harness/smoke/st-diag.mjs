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
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(800); }
await h.click('^Return to story'); await page.waitForTimeout(1500);
// The narrating reply (r4: <XP>, a quest closed), then one more with <XP> and <Rest>.
await h.turn(read('r4.txt'), '*(The fight is over.)*'); await page.waitForTimeout(3000);
const r5 = read('r4.txt').replace(/<XP>[\s\S]*?<\/XP>/, '<XP>minor: found the sluice key</XP>\n<Rest>short: caught their breath by the weir</Rest>').replace(/<Director>[\s\S]*?<\/Director>/, '<Director>\n+ quest Herb run — moonleaf | giver: Mother Ysolde | reward: 5 copper\n- Herb run — delivered, Ysolde paid\n</Director>');
await h.turn(r5, 'We rest by the weir.'); await page.waitForTimeout(3500);
const report = await ev(() => {
  const fold = document.querySelector('.rpg-battle-settings details[data-fold="diagnostics"]');
  fold.open = true; fold.dispatchEvent(new Event('toggle'));
  return fold.querySelector('.rpg-battle-diagnostics').textContent;
});
console.log(report);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
