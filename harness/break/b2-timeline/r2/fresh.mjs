process.env.B2ROOT='/home/user/_break/b2-timeline-r2';
const { storeMod, persist } = await import('../lib/host.mjs');
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('dumps/fresh.json'));
const mk = () => storeMod.createStore({ chat: () => structuredClone(d.chat), save: async () => {} });
const a = mk(), b = mk();
console.log('fresh twice equal', JSON.stringify(a.head()) === JSON.stringify(b.head()));
console.log('fresh problems', a.problems().map(p => [p.index, p.block, p.why?.slice(0, 90)]));
// at each carrier then head (warm cache path)
const c = mk(); d.chat.forEach((m, i) => { if (!m.is_user) c.at(i); });
console.log('warm path head == fresh', JSON.stringify(c.head()) === JSON.stringify(a.head()), 'live==fresh', JSON.stringify(d.live) === JSON.stringify(a.head()), 'live==warm', JSON.stringify(d.live) === JSON.stringify(c.head()));
console.log('log tail', d.log.slice(-8).join(' '));
d.chat.forEach((m, i) => { const r = persist.readRecord(m); if (r) console.log(i, 'cp', !!r.checkpoint, 'covers', r.covers?.length, 'sid', r.sid, 'rc', r.receipts.map(x => x.type).join(',').slice(0, 80)); });
