import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const withDirector = lines => r4.replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const quests = async label => {
  await h.tab('ext:story-director-quests'); await page.waitForTimeout(600);
  console.log(label, await ev(() => ({
    active: [...document.querySelectorAll('.story-director-section .story-director-record.is-quest')].map(n => n.querySelector('.story-director-record-key').textContent).filter(k => /Rat Culling|Wolf Hunt/.test(k)),
    offered: [...document.querySelectorAll('.story-director-fold.is-offered .story-director-record-key')].map(n => n.textContent),
    finished: [...document.querySelectorAll('.story-director-record.is-finished')].map(n => n.textContent).filter(t => /Wolf Hunt|Rat Culling/.test(t)),
  })));
};
await h.turn(withDirector('+ quest Rat Culling — Kill granary rats | type: side | giver: Danique | reward: 8 copper a sack\n+ quest Wolf Hunt — Kill ridge wolves | type: side | giver: Danique | reward: 4 silver'), 'I pay the fee and ask what work there is.');
await page.waitForTimeout(2000);
await quests('after the offer:');
// The reader accepts: the note for the next reply asks the story to record it.
const note = await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'Accept the sheep-fold wolf hunt contract and head past the ditch.', extra: {} }); await window.storyDirectorInterceptor(ctx.chat, 8000, () => {}, 'normal'); const v = ctx.extensionPrompts?.story_director?.value ?? ''; ctx.chat.pop(); return v; });
console.log('quest check:', note.split('\n').find(l => l.startsWith('Quest check')) ?? 'none');
await h.turn(withDirector('+ quest Wolf Hunt — Kill ridge wolves | type: side | giver: Danique | reward: 4 silver'), 'Accept the sheep-fold wolf hunt contract and head past the ditch.');
await page.waitForTimeout(2000);
await quests('after accepting:');
// Abandon: two clicks put the line into the message box.
await ev(() => [...document.querySelectorAll('.story-director-section .story-director-record.is-quest')].find(n => /Wolf Hunt/.test(n.textContent))?.querySelector('.story-director-quest-abandon')?.click()); await page.waitForTimeout(300);
await ev(() => [...document.querySelectorAll('.story-director-section .story-director-record.is-quest')].find(n => /Wolf Hunt/.test(n.textContent))?.querySelector('.story-director-quest-abandon')?.click()); await page.waitForTimeout(300);
const box = await ev(() => document.querySelector('#send_textarea')?.value);
console.log('message box:', JSON.stringify(box));
await ev(() => { document.querySelector('#send_textarea').value = ''; });
// The story forgets to close it: Story Director closes it in that reply.
await h.turn(withDirector('~ Wolf Hunt — now: the pack is out there'), `${box}`);
await page.waitForTimeout(3000);
console.log('reply director block:', await ev(() => (SillyTavern.getContext().chat.at(-1).mes.match(/<Director>[\s\S]*?<\/Director>/) ?? [''])[0].replace(/\n/g, ' / ')));
await quests('after abandoning:');
await page.locator('#story_block_sidebar').screenshot({ path: `${S}/shots/offers.png` });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
