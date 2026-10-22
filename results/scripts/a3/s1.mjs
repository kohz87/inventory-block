// Scenario 1: Story Block alone. usage: node s1.mjs <width>
import fs from 'node:fs';
import * as D from './drv.mjs';
import { walk } from './walk.mjs';
const W = Number(process.argv[2] ?? 1440);
const TAG = `s1-${W}`;
const p = await D.page();
const log = s => { console.log(s); fs.appendFileSync(`${D.OUT}/run-${TAG}.log`, s + '\n'); };
D.mark(TAG); const e0 = D.errPos();
D.clearQueue();
await D.size(p, W);
await D.load(p);
const chat = await D.openChar(p, 'The Narrator', true);
log(`chat ${chat} modules ${await p.ev(() => StoryBlock.sdk.modules().map(m => m.id).join(','))}`);
const replies = [
  ['I look around the quay.', D.R('The quay is slick with rain. A fishwife, Odda, sells trout from a barrow.', ['~ place Bluewatch Quay | kind: dock', '+ present Odda', '+ item Rope | qty: 2 | note: tarred', '+ coin 30 | from: a dropped purse'])],
  ['I buy a trout from Odda.', D.R('Odda wraps a trout in leaf.', ['+ item Moonveil Trout | qty: 1', '- coin 5 | to: Odda', '- item Rope | qty: 1'])],
  ['I walk up to the inn.', D.R('The Stray Oar is warm.', ['~ place The Stray Oar | kind: inn', '- present Odda', '+ present Innkeeper Brann', '+ item Brass Key | qty: 1', '? loot Rusty Key, Lantern Oil x2, Torn Map — on a shelf behind the bar'])],
  ['I sit down.', 'Nothing much happens; the fire crackles.'],
  ['I ask Brann about rooms.', D.R('"Ten a night," Brann says.', ['- coin 10 | to: Brann', '- item Lantern | qty: 1', '+ item <b>Bold</b> Mug <img src=x onerror="window.__xss=1"> | qty: 1'])],
];
for (const [t, r] of replies) { const s = await D.send(p, t, r); log(`send "${t}" ok=${s.ok} ${s.ms}ms len=${s.len} stop=${s.stopShown} reqs=${s.reqs.length}`); if (!s.ok) await p.shot(`${D.OUT}/shots/${TAG}-stuck.jpg`, 40); }
const before = await D.state(p);
log('swipe: ' + await D.swipe(p, D.R('"Twelve a night," Brann says. You pay.', ['- coin 12 | to: Brann'])));
const sw = await D.state(p);
await D.swipeLeft(p);
const back = await D.state(p);
log(`swipe state changed=${before !== sw} back-equal=${before === back}`);
log(`xss flag=${await p.ev(() => window.__xss ?? null)}`);
const pre = await D.state(p);
await D.delLast(p, 2);
const afterDel = await D.state(p);
log(`delete changed=${pre !== afterDel}`);
const live = await D.state(p);
await D.reloadInto(p, 'The Narrator', chat);
const reb = await D.state(p);
log(`reload live==rebuild ${live === reb}${live === reb ? '' : `\n LIVE ${live.slice(0, 800)}\n REB ${reb.slice(0, 800)}`}`);
const probs = await walk(p, TAG, { log });
log(`walk problems: ${JSON.stringify(probs).slice(0, 3000)}`);
log(`xss flag=${await p.ev(() => window.__xss ?? null)}`);
const errs = D.errorsSince(e0);
log(`errors (${errs.length}):\n${errs.slice(0, 40).join('\n')}`);
p.close();
