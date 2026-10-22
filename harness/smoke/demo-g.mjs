import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const O = `${S}/shots/final`;
const FILE = 'The Narrator - 2026-10-18@01h44m00s947ms';
const tidy = h => h.ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
{
  const h = await open({ width: 390, height: 844, mobile: true });
  await h.openNarrator(FILE); await tidy(h);
  await h.page.locator('#story_block_handle').click().catch(() => {}); await h.page.waitForTimeout(900);
  await h.tab('ext:npc-state-delta-cast'); await h.page.screenshot({ path: `${O}/npc-state-delta-phone.png` });
  await h.browser.close();
}
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const side = file => page.screenshot({ path: `${O}/${file}.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
const buttons = () => ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent && !b.disabled).map(b => b.textContent.trim()).filter(Boolean));
await h.openNarrator(FILE); await h.dock(); await tidy(h);
await h.tab('ext:story-director'); await h.click('^Reveal'); await page.waitForTimeout(600); await side('story-director');
await h.tab('ext:npc-state-delta-cast'); await side('npc-state-delta-present');
console.log('present:', (await h.pane()).slice(0, 220));
// The plan.
const r5 = await ev(r => { const ctx = SillyTavern.getContext(); const inv = window.StoryBlock.blockInText(ctx.chat[8].mes, 'Inventory'); return r.replace('<CYOA>', `<Inventory>\n${(inv?.text ?? '').trim()}\n</Inventory>\n<CYOA>`); }, fs.readFileSync(`${S}/demo/r5.txt`, 'utf8'));
console.log('r5 at', await h.turn(r5, 'We follow the drag-marks into the reeds and find their den. I mean to finish this.'));
await page.waitForTimeout(3000); await tidy(h);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('offer:', (await h.pane()).slice(0, 300));
await side('rpg-battle-offer');
await h.click('^Fight'); await page.waitForTimeout(3500);
console.log('setup:', (await h.pane()).slice(0, 500));
await side('rpg-battle-plan');
await h.click('^Start'); await page.waitForTimeout(1500);
// Two turns by hand: Attack, then the first enemy.
for (let i = 0; i < 2; i++) {
  await ev(() => [...document.querySelectorAll('.story-block-pane button')].find(b => b.offsetParent && /^Attack/.test(b.textContent.trim()))?.click()); await page.waitForTimeout(300);
  await ev(() => document.querySelector('.rpg-battle-card.is-enemy.is-pickable')?.click()); await page.waitForTimeout(900);
}
await side('rpg-battle-fight');
for (let stage = 0; stage < 4; stage++) {
  for (let i = 0; i < 20; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(1500); }
  const text = await h.pane();
  console.log(`after stage ${stage + 1}:`, text.slice(0, 380));
  if ((await buttons()).includes('Go on')) {
    if (stage === 0) await side('rpg-battle-between');
    await h.click('^Go on'); await page.waitForTimeout(2000);
  } else break;
}
await side('rpg-battle-result');
console.log('result buttons:', JSON.stringify(await buttons()));
console.log('handoff:', (await h.pane()).match(/HAND-OFF TO THE STORY (.*)/)?.[1]?.slice(0, 700));
await h.click('^Return to story'); await page.waitForTimeout(1500);
await h.tab('ext:rpg-party'); await page.waitForTimeout(700); await side('rpg-battle-party');
console.log('inventory loot:', (await ev(() => window.StoryBlock.getBlock('Inventory')?.text))?.split('[Loot]')[1]);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
