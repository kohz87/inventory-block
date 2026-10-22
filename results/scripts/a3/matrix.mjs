// Matrix: a config (sb | rb | sd | nsd | all) at a width; play a few replies with markers, then walk every surface.
import fs from 'node:fs';
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue } from './lib.mjs';
import { walk } from './walk.mjs';
const W = Number(process.argv[2] || 1440);
const CFG = process.argv[3] || 'all';
const EXTS = { sb: ['Story_block'], rb: ['Story_block', 'rpg_battle'], sd: ['Story_block', 'Story_director'], nsd: ['Story_block', 'npc_state_delta'], all: ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'] }[CFG];
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: EXTS });
const tag = `${CFG}-${W}`;
const log = (...a) => console.log(`[${tag}]`, ...a);
log('modules', await ev(() => StoryBlock.sdk.modules().map(m => m.id).join(',')));
await newChat(page);
export async function createViaWizard() {
  const has = await ev(() => !![...document.querySelectorAll('button')].find(b => b.offsetParent && /^create$|create your character/i.test(b.textContent.trim())));
  if (!has) return 'no entry';
  await ev(() => [...document.querySelectorAll('button')].find(b => b.offsetParent && /^create$|create your character/i.test(b.textContent.trim())).click()); await sleep(1200);
  for (let s = 0; s < 10; s++) {
    const where = await ev(() => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); return d ? [...d.querySelectorAll('.cc-step')].filter(x => x.offsetParent).map(x => x.className).join() + ' ' + (d.querySelector('.cc-problem')?.textContent ?? '') : 'closed'; }); if (where === 'closed') break; if (process.env.DBG) log('  wiz', where);
    await ev(async () => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); if (!d) return; if (d.querySelector('.cc-race')?.offsetParent && !d.querySelector('.cc-race .cc-card[aria-pressed="true"]')) { d.querySelector('.cc-race .cc-card')?.click(); await new Promise(r => setTimeout(r, 400)); } if (d.querySelector('.cc-stats')?.offsetParent) { for (let k = 0; k < 30; k++) { const p = [...d.querySelectorAll('.cc-stat button')].filter(b => !b.disabled && b.textContent.trim() === '+'); if (!p.length) break; p[k % p.length].click(); await new Promise(r => setTimeout(r, 80)); } }
      const go = d.querySelector('.cc-go'); if (go?.offsetParent) { go.click(); return; } [...d.querySelectorAll('button')].find(b => b.offsetParent && /^next/i.test(b.textContent.trim()))?.click(); });
    await sleep(1300);
  }
  return ev(() => document.querySelectorAll('.ss-dialog').length === 0 ? 'created' : 'dialog still open');
}
if (CFG === 'rb' || CFG === 'all') log('create', await createViaWizard());
const X = '<b>MARK</b><img src=x onerror="window.__xss=1">';
log('r1', await send(page, `hi ${X}`, R(`The barge bumps the quay. Odda waves. ${X}`, ['~ place Bluewatch Quay | kind: dock', '+ present Odda', `+ item Rope ${X} | qty: 2`, '+ coin 30 | from: a dropped purse', '~ npc Odda | trust: +5', '+ quest Find the brass key | giver: Odda', '! time +1h'])));
log('r2', await send(page, 'look around', R('Rain. A rat bigger than a dog.', ['- coin 5 | to: Odda', '+ item Lantern | qty: 1', '~ npc Odda | affection: +3', '? loot Rusty Key, Lantern Oil x2 — on a shelf'])));
log('xss', await ev(() => window.__xss ?? null), 'overflow', JSON.stringify(await overflow(page)));
const problems = await walk(page, tag, { clicks: true, shots: true, log });
log('walk problems', problems.length);
log('xss after walk', await ev(() => window.__xss ?? null));
const errs = ourErrors(errors);
fs.writeFileSync(`${OUT}/scripts/run-${tag}.errors.json`, JSON.stringify(errs, null, 1));
log('ERRORS', errs.length, JSON.stringify(errs.slice(0, 12), null, 1));
await browser.close();
