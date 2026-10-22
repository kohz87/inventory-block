// Generic scenario: node scen.mjs <name> <width>. Configs in scenarios.mjs.
import fs from 'node:fs';
import * as D from './drv.mjs';
import { walk } from './walk.mjs';
import { setExts } from './exts.mjs';
import { CONFIGS } from './scenarios.mjs';
const [NAME, WS] = process.argv.slice(2);
const W = Number(WS ?? 1440);
const C = CONFIGS[NAME];
const TAG = `${NAME}-${W}`;
const log = s => { console.log(s); fs.appendFileSync(`${D.OUT}/run-${TAG}.log`, s + '\n'); };
fs.writeFileSync(`${D.OUT}/run-${TAG}.log`, '');
setExts(C.exts);
const p = await D.page();
D.mark(TAG); const e0 = D.errPos();
D.clearQueue();
await D.size(p, W);
await D.load(p);
const r0 = Math.max(0, ...D.reqNums());
if ('features' in C) log(`features set: ${JSON.stringify(await p.ev(C.featuresFn, C.features))}`);
const chat = await D.openChar(p, C.char, true);
log(`chat ${chat} modules ${await p.ev(() => StoryBlock.sdk.modules().map(m => m.id).join(','))}`);
if (C.before) log(`before: ${JSON.stringify(await C.before(p, D, log))}`);
// walk once before any reply (fresh chat)
if (C.walkFresh) { const pr = await walk(p, `${TAG}-fresh`, { log, forbid: C.forbid }); log(`fresh walk problems: ${JSON.stringify(pr).slice(0, 2000)}`); }
let i = 0;
for (const [t, r] of C.replies) {
  const s = await D.send(p, t, r);
  log(`send#${++i} "${t.slice(0, 30)}" ok=${s.ok} ${s.ms}ms len=${s.len} lastUser=${s.lastUser} stop=${s.stopShown} reqs=${s.reqs.length}`);
  if (C.hooks?.[i]) log(`  hook#${i}: ${JSON.stringify(await C.hooks[i](p, D, log))}`);
  if (!s.ok) { await p.shot(`${D.OUT}/shots/${TAG}-stuck-${i}.jpg`, 40); log(`  STUCK? notice=${await p.ev(() => document.querySelector('#story_suite_v2_bar .story-suite-notice-text')?.textContent ?? '')} dialog=${await p.ev(() => document.querySelector('.ss-dialog-title')?.textContent ?? '')}`); if (C.onStuck) await C.onStuck(p, D, log); }
}
const before = await D.state(p);
log('swipe ok: ' + await D.swipe(p, C.swipeReply));
const sw = await D.state(p);
await D.swipeLeft(p);
const back = await D.state(p);
log(`swipe state changed=${before !== sw} back-equal=${before === back}`);
const pre = await D.state(p);
await D.delLast(p, 2);
log(`delete-last changed=${pre !== await D.state(p)}`);
// delete a middle reply (index 4 = 2nd reply) and its user message
const midLen = await p.ev(() => SillyTavern.getContext().chat.length);
if (midLen > 6) { await D.delAt(p, 4); await D.delAt(p, 3); }
const live = await D.state(p);
await p.ev(async () => { await SillyTavern.getContext().saveChat(); });
await D.sleep(1500);
await D.reloadInto(p, C.char, chat);
const reb = await D.state(p);
log(`reload live==rebuild ${live === reb}${live === reb ? '' : `\n LIVE ${live.slice(0, 1500)}\n REB  ${reb.slice(0, 1500)}`}`);
// one more reply after reload
const s2 = await D.send(p, 'And then?', C.after ?? D.R('Time passes.', ['! time +1h']));
log(`send after reload ok=${s2.ok} ${s2.ms}ms`);
if (C.mid) log(`mid: ${JSON.stringify(await C.mid(p, D, log))}`);
const probs = await walk(p, TAG, { log, forbid: C.forbid });
log(`walk problems: ${JSON.stringify(probs).slice(0, 4000)}`);
log(`xss flag=${await p.ev(() => window.__xss ?? null)}`);
if (C.promptForbid) {
  const re = new RegExp(C.promptForbid, 'gi');
  const hits = {};
  for (const n of D.reqNums().filter(n => n > r0)) {
    const b = D.readReq(n);
    for (const m of b.messages ?? []) { const t = String(m.content); if (m.role !== 'system' && !/Story Suite|<Changes>|\[/.test(t)) continue; let mm; re.lastIndex = 0; while ((mm = re.exec(t))) { const k = `${m.role}: …${t.slice(Math.max(0, mm.index - 60), mm.index + 50).replace(/\s+/g, ' ')}…`; hits[k] = (hits[k] ?? 0) + 1; } }
  }
  log(`prompt forbidden hits (${Object.keys(hits).length}):\n${Object.entries(hits).map(([k, v]) => ` [${v}] ${k}`).join('\n')}`);
}
if (C.end) log(`end: ${JSON.stringify(await C.end(p, D, log))}`);
const errs = D.errorsSince(e0);
log(`errors (${errs.length}):\n${errs.slice(0, 50).join('\n')}`);
p.close();
