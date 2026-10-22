import { allHost, storeMod } from './lib.mjs';
console.warn = () => {};
for (const how of ['junk', 'receiptsNull', 'badCheckpoint']) {
const h = await allHost({ extra: [] });
const { ctx, st, store } = h;
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('One.', 'Reply.\n<Changes>\n+ item Rope\n</Changes>');
const m = ctx.chat.at(-1);
const rec = structuredClone(m.extra.storySuite);
if (how === 'junk') rec.ops = 'junk'; else if (how === 'receiptsNull') rec.receipts = null; else rec.checkpoint = { v: 2, meta: { rev: 'x' }, domains: [] };
m.extra.storySuite = rec; m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
await st.loadChat(structuredClone(ctx.chat));
let res; try { res = (await h.sdk.command('scene.present', { add: 'Fenna' })).ok; } catch (e) { res = 'THREW ' + e.message; }
await store.flush?.();
const fresh = storeMod.createStore({ chat: () => structuredClone(ctx.chat), save: async () => {}, scratch: n => h.registry.scratch(n) });
console.log(how, res, 'live', JSON.stringify(h.head().domains.scene.present), 'fresh', JSON.stringify(fresh.head()?.domains.scene.present), JSON.stringify(persist(m)));
h.close();
}
function persist(m) { const r = m.extra.storySuite; return { ops: Array.isArray(r.ops) ? r.ops.length : r.ops, spans: r.spans }; }
