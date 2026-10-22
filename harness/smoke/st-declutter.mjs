import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const ws = fs.readFileSync(`${S}/repro/ws.txt`, 'utf8');
const director = [
  '+ quest The bond — type: main | goal: pay off the bond before the collector reaches Bluewatch | desc: Wessel signed for a river bond in Glassdock; the collector rides upriver and expects forty crowns or the handcart, the cane-blade and a season of hauling. | step: earn coin from village work | difficulty: hard | due: Goldwane 30',
  '+ quest Sheepfold Wolves — type: bounty | goal: drive off or kill the wolves at the communal sheepfold | step: face the wolves outside the east palisade | giver: Reeve Nelke | reward: 6 silver and a bed | due: Goldwane 12 sunset | place: Communal Sheepfold',
].join('\n');
const mes = `The wolves stand off at thirty paces, grey shapes against the sleet.\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<World_State>\n${ws}\n</World_State>\n<Director>\n${director}\n</Director>\n</Blocks>\n-->`;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(mes, 'I face the wolves.');
await page.waitForTimeout(2500);
await h.tab('block:world-state'); await page.waitForTimeout(800);
console.log('world:', (await ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return { board: !!p?.querySelector('.story-block-scene, [class*="scene-board"], [class*="story-block-scene"]'), plain: !!p?.querySelector('[class*="plain"]'), text: p?.innerText.slice(0, 300) }; })));
const sb = page.locator('#story_block_sidebar');
await sb.screenshot({ path: `${S}/shots/declutter-world.png` });
await h.tab('ext:story-director-quests'); await page.waitForTimeout(800);
console.log('quests:', await h.pane());
await sb.screenshot({ path: `${S}/shots/declutter-quests.png` });
await ev(() => document.querySelector('.story-director-quest-abandon')?.click()); await page.waitForTimeout(400);
await ev(() => document.querySelector('.story-director-quest-desc')?.click()); await page.waitForTimeout(300);
await sb.screenshot({ path: `${S}/shots/declutter-quests-armed.png` });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
