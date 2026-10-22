import { allHost, storeMod } from './lib.mjs';
console.warn = () => {};
const h = await allHost({ extra: [] });
const { ctx, st, store } = h;
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('One.', 'Reply.\n<Changes>\n+ item Rope\n</Changes>');
const m = ctx.chat.at(-1);
const rec = structuredClone(m.extra.storySuite);
rec.ops.push({ op: 'replace', path: '/domains/scene/nope/x', value: 1 });   // a hand edit: one op more than the spans count
m.extra.storySuite = rec; m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
await st.loadChat(structuredClone(ctx.chat));
console.log('after reload', JSON.stringify(h.head().domains.scene.present), JSON.stringify(Object.keys(h.head().domains.inventory.stacks)));
console.log(await h.sdk.command('scene.present', { add: 'Fenna' }).then(x => x.ok));
await store.flush?.();
const fresh = storeMod.createStore({ chat: () => structuredClone(ctx.chat), save: async () => {}, scratch: n => h.registry.scratch(n) });
console.log('live', JSON.stringify(h.head().domains.scene.present), 'fresh', JSON.stringify(fresh.head().domains.scene.present));
await st.loadChat(structuredClone(ctx.chat));
console.log('after 2nd reload', JSON.stringify(h.head().domains.scene.present));
console.log(JSON.stringify(store.problems?.().map(p => p.message)));
