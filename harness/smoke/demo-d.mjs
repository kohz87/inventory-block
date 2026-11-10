import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const O = `${S}/shots/readme`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const read = f => fs.readFileSync(`${S}/demo/${f}`, 'utf8');
const side = file => page.screenshot({ path: `${O}/${file}.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
const tidy = () => ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
await h.dock(); await tidy();
console.log('r3 at', await h.turn(read('r3.txt'), 'We take the river path east to the weir. I look for tracks as we go, sword loose in its scabbard.'));
await page.waitForTimeout(3000); await tidy();
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('offer:', (await h.pane()).slice(0, 200));
await side('rpg-offer');
await h.click('^Fight'); await page.waitForTimeout(3000);
console.log('setup:', (await h.pane()).slice(0, 300));
await side('rpg-setup');
await h.click('^Start'); await page.waitForTimeout(1500);
await side('rpg-fight-start');
// Play: Sidestep Cut when ready, else attack, picking the first enemy.
for (let i = 0; i < 4; i++) {
  await h.click('^Auto'); await page.waitForTimeout(1600);
  if (i === 1) await side('rpg-fight');
  if (!(await ev(() => [...document.querySelectorAll('.story-block-pane button')].some(b => /^Auto/.test(b.textContent.trim()) && b.offsetParent)))) break;
}
for (let i = 0; i < 16; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(1500); }
console.log('result:', (await h.pane()).slice(0, 400));
await side('rpg-result');
await h.click('^Return to story'); await page.waitForTimeout(1500);
console.log('r4 at', await h.turn(read('r4.txt'), '*(The fight is over.)*'));
await page.waitForTimeout(3000); await tidy();
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
console.log('party after:', (await h.pane()).slice(0, 400));
await side('rpg-party-offers');
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
