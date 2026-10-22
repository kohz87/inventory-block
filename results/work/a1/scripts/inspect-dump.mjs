// node inspect-dump.mjs <dump.json>: a cold store over the dumped chat: head rev, problems, each carrier's record summary.
import fs from 'node:fs';
import { storeMod, persist } from './lib/host.mjs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const chat = d.chat;
const s = storeMod.createStore({ chat: () => chat, save: async () => {} });
console.log('head rev', s.head()?.meta?.rev, 'problems', JSON.stringify(s.problems()).slice(0, 600));
chat.forEach((m, i) => { if (m.is_user) return; const raw = m.extra?.storySuite; const r = persist.readRecord(m); console.log(i, 'raw', !!raw, 'read', !!r, raw ? JSON.stringify({ sid: raw.sid, swipe: raw.swipe, mark: raw.mark, rev: raw.rev, n: raw.ops?.length, send: m.send_date, gen: m.gen_started }) : ''); });
