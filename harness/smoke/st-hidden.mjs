import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
const at = (time, lines) => r4.replace('1203, March 3, 09:50 am', time).replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
const quests = async label => { await h.tab('ext:story-director-quests'); await page.waitForTimeout(800); console.log(label, '·', (await h.pane()).slice(0, 220)); };
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const first = await h.turn(at('CY 611, Goldwane 12, 07:00 am', "+ quest Lone Grey Wolf — Hunt the wolf pack | type: bounty | giver: Verna | reward: 1 gold"), "I'll take the wolf bounty.");
await page.waitForTimeout(1200);
await h.turn(at('CY 611, Goldwane 12, 09:00 am', '~ Lone Grey Wolf — step: turn in voucher at bailiff hatch on Friday noon'), 'I hunt.');
await page.waitForTimeout(1200);
for (let i = 0; i < 3; i++) { await h.turn(at(`CY 611, Goldwane 13, 0${i + 1}:00 pm`, '~ Guild Post Closure — step: boat underway'), 'I wait.'); await page.waitForTimeout(800); }
await quests('before hiding:');
// Hide every message up to the second reply, as an auto-hide extension or /hide does.
await ev(async upTo => { const ctx = SillyTavern.getContext(); for (let i = 0; i <= upTo + 2; i++) ctx.chat[i].is_system = true; await ctx.saveChat(); await ctx.reloadCurrentChat(); }, first);
await page.waitForTimeout(2500);
await h.turn(at('CY 611, Goldwane 13, 06:00 pm', '~ Guild Post Closure — step: boat docked'), 'I sleep.');
await page.waitForTimeout(1500);
await quests('after hiding:');
console.log('hidden:', await ev(() => SillyTavern.getContext().chat.filter(m => m.is_system).length));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
