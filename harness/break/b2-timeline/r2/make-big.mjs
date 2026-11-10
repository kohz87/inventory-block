// Builds big chat files (real records from the r2 runtime) straight into the instance's chat folder.
process.env.B2ROOT = '/home/user/_break/b2-timeline-r2';
const { allHost } = await import('../lib/host.mjs');
import fs from 'node:fs';
console.warn = () => {}; process.on("exit", c => console.error("exit", c, n));
const DIR = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/inst/b2-timeline/data/default-user/chats/The Narrator';
const sizes = process.argv.slice(2).map(Number);
const h = await allHost({ st: { char: 'The Narrator', user: 'User' } });
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
let n = 0;
const ITEMS = ['Rope', 'Lamp', 'Torch', 'Apple'];
for (const target of sizes) {
    while (n < target) {
        n++;
        const pad = 'The rain keeps falling on the village roofs and the story goes on. '.repeat(12);
        await h.send(`I act ${n}.`, `[B${n}] ${pad}\n<Changes>\n+ item ${ITEMS[n % 4]} | note: ${'n'.repeat(40)}\n+ coin ${n % 7 + 1} | from: Fenna\n! time +1h\n+ hook Rumor ${n} — an open thread\n</Changes>`);
    }
    const date = (i) => `October 21, 2026 ${String(Math.floor(i / 60) % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}pm`;
    const msgs = structuredClone(h.ctx.chat).map((m, i) => ({ ...m, send_date: date(i), swipe_info: m.swipe_info?.map(s => ({ ...s, send_date: date(i) })), name: m.is_user ? 'User' : 'The Narrator' }));
    // records were written with send_date '' marks; re-mark by clearing marks (old records without a mark fit)
    for (const m of msgs) { for (const x of [m.extra, ...(m.swipe_info ?? []).map(s => s.extra)]) if (x?.storySuite) delete x.storySuite.mark; }
    const header = { user_name: 'unused', character_name: 'unused', chat_metadata: {} };
    const name = `big-${target}`;
    fs.writeFileSync(`${DIR}/${name}.jsonl`, [header, ...msgs].map(x => JSON.stringify(x)).join('\n'));
    console.log(name, msgs.length, 'messages', fs.statSync(`${DIR}/${name}.jsonl`).size, 'bytes');
}
