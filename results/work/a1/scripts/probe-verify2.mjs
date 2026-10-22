import { allHost } from './lib/host.mjs';
const h = await allHost({});
const { sdk, store, st, ctx } = h;
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
console.warn = () => {};
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('a', R('one', ['+ item Rope']));
await h.send('b', R('two', ['+ item Lamp', '+ coin 3']));
await h.swipe(R('two b', ['+ item Torch', '+ coin 4']));
await store.flush();
const i = ctx.chat.length - 1;
const rec = ctx.chat[i].extra.storySuite;
const r1 = await sdk.rewind({ index: i, beforeRev: rec.receipts.at(-1).rev });
console.log('rewind1', r1.ok, 'dirty', store.dirty(), 'shown', ctx.chat[i].swipe_id, '/', ctx.chat[i].swipes.length);
const m = ctx.chat[i];
// swipe to 0 (ST syncs the shown swipe first)
m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
await st.swipeTo(i, 0);
console.log('swipeTo 0, dirty', store.dirty());
// delete swipe 0, show swipe 0 (the old swipe 1)
m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
m.swipes.splice(0, 1); m.swipe_info.splice(0, 1); m.swipe_id = 0; m.mes = m.swipes[0]; m.extra = structuredClone(m.swipe_info[0].extra);
await st.eventSource.emit('message_swipe_deleted', { messageId: i, swipeId: 0, newSwipeId: 0 });
console.log('swipe delete, dirty', store.dirty());
try { await store.flush(); console.log('flush ok'); } catch (e) { console.log('flush threw:', e.message); }
h.close(); process.exit(0);
