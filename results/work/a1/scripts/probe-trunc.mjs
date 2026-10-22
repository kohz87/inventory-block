// node probe-trunc.mjs <dump.json>: every (carrier, receipt) rewind dry run on the dumped chat; reports refusals.
import fs from 'node:fs';
import { allHost, persist } from './lib/host.mjs';
console.warn = () => {};
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const h = await allHost({ pack: process.env.PACK === '1' });
await h.st.loadChat(structuredClone(d.chat), 'x');
const chat = h.ctx.chat;
console.log('head rev', h.store.head()?.meta?.rev, 'problems', h.store.problems().length);
for (let i = 0; i < chat.length; i++) {
    const rec = persist.readRecord(chat[i]);
    if (!rec) continue;
    for (const rc of rec.receipts) {
        try { const plan = h.store.truncate(i, rc.rev, { dryRun: true, chat: chat.slice(0, i + 1) }); }
        catch (e) { console.log(`refused i=${i} beforeRev=${rc.rev} (${rc.type}):`, e.message); }
    }
}
h.close(); process.exit(0);
