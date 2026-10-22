import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const withDirector = lines => r4.replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(withDirector('+ hook Wolf Cull — wolves at the east fold | giver: Nelke'), 'What work is there?');
await page.waitForTimeout(2000);
await h.turn(withDirector(`+ quest Wolf Cull — Cull up to four timber wolves harassing the communal fold | type: contract | giver: Nelke | goal: bring 4 right wolf ears to Nelke or gatehouse | reward: 8 silver (minus 10% Guild cut) | step: kill 4 wolves at sheepfold | due: Goldwane 13, 08:00 am | difficulty: easy
- Hook Wolf Cull — accepted by Wessel
! Dockside Payout — Marrit settles her crew accounts at the wharf table, docking food costs; Lower Wharves
~ Road to Auvoth — due: Goldwane 14, 08:00 pm
Director`), 'I take the contract.');
await page.waitForTimeout(3000);
await h.tab('ext:story-director-quests'); await page.waitForTimeout(800);
console.log('open quest:', await ev(() => [...document.querySelectorAll('.story-director-record.is-quest:not(.is-finished)')].map(n => n.querySelector('.story-director-record-key').textContent).join(', ')));
console.log('finished:', await ev(() => [...document.querySelectorAll('.story-director-record.is-finished')].map(n => n.textContent).join(' | ')));
console.log('toasts:', await ev(() => [...document.querySelectorAll('#toast-container .toast')].map(n => n.textContent).join(' || ') || 'none'));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
