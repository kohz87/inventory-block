import { allHost, H, turnMod } from './lib.mjs';
const { STATIC_KEY } = turnMod;
const statics = h => h.st.promptLog.filter(e => e.key === STATIC_KEY && e.value).map(e => e.value);
const h = await allHost();
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
// A: fy.all
console.log('A fy.all prompt flag:', h.registry.feature('fy.all').prompt);
await h.send('a', 'One.');
const s1 = statics(h).at(-1);
const ev = []; h.sdk.on('feature', e => ev.push(e));
h.features.set('fy.all', false);
await h.send('b', 'Two.');
const s2 = statics(h).at(-1);
console.log('A static changed:', s1 !== s2, 'event', ev.at(-1), 'contains FY:', s1.includes('FY static'), s2.includes('FY static'));
h.features.set('fy.all', true);
// B: onBlocked under off fy.hooks
H.calls.length = 0; H.block = true;
const r = await h.send('c', 'Three.');
H.block = false;
console.log('B blocked:', r.aborted, 'calls while off:', H.calls.filter(c => !c.on));
// C: preview/commit across toggle
h.features.set('fz.cmd', true);
const pv = await h.sdk.preview('fz.poke', {});
h.features.set('fz.cmd', false);
const before = h.head().domains.fzc.pokes;
const cm = await h.sdk.commit(pv.token);
console.log('C preview ok', pv.ok, 'commit while off:', cm.ok, cm.code, 'pokes', before, '->', h.head().domains.fzc.pokes);
// D: reread while off
await h.send('d', 'Four.\n<Changes>\n~ tick Delta | n: 4\n</Changes>');
const idx = h.ctx.chat.length - 1;
console.log('D ticks', JSON.stringify(h.head().domains.fzk.ticks));
h.features.set('fz.kind', false);
const rr = await h.sdk.reread(idx);
console.log('D reread off:', rr.ok, rr.problems?.map(p => p.code), JSON.stringify(h.head().domains.fzk.ticks));
h.features.set('fz.kind', true);
console.log('D after on:', JSON.stringify(h.head().domains.fzk.ticks));
