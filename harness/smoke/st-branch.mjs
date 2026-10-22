import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
const at = (time, lines) => r4.replace('1203, March 3, 09:50 am', time).replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
const quests = async () => { await h.tab('ext:story-director-quests'); await page.waitForTimeout(800); const p = await h.pane(); return /Lone Grey Wolf/.test(p) ? `wolf ${/Lone Grey Wolf[^A-Z]*?(pay waiting)/.test(p) ? '(pay waiting)' : '(open)'}` : 'no wolf'; };
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(at('CY 611, Goldwane 12, 07:00 am', "+ quest Lone Grey Wolf — Hunt the wolf pack | type: bounty | giver: Verna | reward: 1 gold"), "I'll take the wolf bounty.");
for (let i = 0; i < 26; i++) await h.turn(at(`CY 611, Goldwane 12, 0${(i % 9) + 1}:${String(i).padStart(2, '0')} pm`, i === 14 ? '~ Lone Grey Wolf — step: turn in voucher' : `~ Guild Post Closure — step: boat ${i}`), `I wait ${i}.`);
await page.waitForTimeout(1500);
await ev(() => SillyTavern.getContext().saveMetadata?.());
await page.waitForTimeout(1500);
const cps = () => ev(() => JSON.stringify((SillyTavern.getContext().chatMetadata.storyDirector?.checkpoints ?? []).map(p => p.message)));
console.log('main: messages', await ev(() => SillyTavern.getContext().chat.length), 'checkpoints', await cps(), '·', await quests());
const main = await ev(() => SillyTavern.getContext().getCurrentChatId());
for (const [label, mesId] of [['after the newest checkpoint', 50], ['before a checkpoint, after the voucher step', 44], ['before the voucher step', 30], ['before the quest', 8]]) {
  await ev(async m => { await SillyTavern.getContext().openCharacterChat(m); }, main);
  await page.waitForTimeout(2500);
  const ok = await ev(async m => { const b = document.querySelector(`#chat .mes[mesid="${m}"] .mes_create_branch`); b?.click(); return Boolean(b); }, mesId);
  await page.waitForTimeout(4000);
  console.log(`branch at #${mesId} (${label}): clicked ${ok}, chat ${await ev(() => SillyTavern.getContext().getCurrentChatId())}, messages ${await ev(() => SillyTavern.getContext().chat.length)}, checkpoints ${await cps()} · ${await quests()}`);
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
