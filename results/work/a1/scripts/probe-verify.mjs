import { allHost } from './lib/host.mjs';
const h = await allHost({});
const { sdk, store, st, ctx } = h;
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
console.warn = () => {};
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('a', R('one', ['+ item Rope']));
await h.send('b', R('two', ['+ item Lamp']));
await h.swipe(R('two b', ['+ item Torch']));
await store.flush();
const i = ctx.chat.length - 1, m = ctx.chat[i];
console.log('swipes', m.swipes.length, 'shown', m.swipe_id, 'dirty', store.dirty());
// ST deleteSwipe of the shown swipe 1 -> swipe 0 shown
m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
m.swipes.splice(1, 1); m.swipe_info.splice(1, 1); m.swipe_id = 0; m.mes = m.swipes[0]; m.extra = structuredClone(m.swipe_info[0].extra);
await st.eventSource.emit('message_swipe_deleted', { messageId: i, swipeId: 1, newSwipeId: 0 });
console.log('after swipe delete dirty', store.dirty());
await st.deleteMessage(1);   // a middle delete (the first user message)
console.log('after middle delete dirty', store.dirty());
try { await store.flush(); console.log('flush ok'); } catch (e) { console.log('flush threw:', e.message); }
try { const r = await sdk.rewind({ index: ctx.chat.length - 1, beforeRev: store.head().meta.rev }); console.log('rewind', JSON.stringify(r)); } catch (e) { console.log('rewind threw:', e.message); }
h.close(); process.exit(0);
