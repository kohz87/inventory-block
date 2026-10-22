import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const withDirector = lines => r4.replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const offer = async label => {
  await h.tab('ext:rpg-party'); await h.tab('ext:rpg-battle'); await page.waitForTimeout(500);
  const shown = await ev(() => document.querySelector('.rpg-battle-encounter-label')?.textContent ?? ('no fight offered: ' + ([...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none')?.innerText ?? '').slice(0, 160).split('\n').join(' / ')));
  const reach = await ev(() => window.StoryDirector.encountersAt(SillyTavern.getContext().chat.length - 1).map(e => [e.key, e.status, e.reached]));
  console.log(label, shown, '| encountersAt:', JSON.stringify(reach));
};
// The world state time in r4 is 1203, March 3, 09:50 am; plan a fight due before then.
await h.turn(withDirector('+ beat Guards sack the taproom — on: March 3, 09:00 am | place: Harrowford outskirts | encounter: 3 desperate drover, mercenary veteran (boss)'), 'I wait by the weir.');
await page.waitForTimeout(2000);
await offer('due, scene elsewhere:');
await h.turn(withDirector('! Guards sack the taproom — the drovers kick in the taproom door'), 'I head to the taproom.');
await page.waitForTimeout(2000);
await offer('the reply fired it:');
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
