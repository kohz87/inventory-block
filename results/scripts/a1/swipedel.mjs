// probe: swipe-delete variants vs save verification and cold rebuild
import { createHost } from '/home/user/cell/a1/Story_block/testkit/index.js';
import { createStore } from '/home/user/cell/a1/Story_block/src/v2/store.js';
console.warn = () => {};
const reply = (text, lines) => `${text}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
async function deleteSwipe(h, index, del, show) {
    const m = h.ctx.chat[index];
    m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
    m.swipes.splice(del, 1); m.swipe_info.splice(del, 1);
    m.swipe_id = show; m.mes = m.swipes[show]; m.extra = structuredClone(m.swipe_info[show].extra);
    await h.st.eventSource.emit('message_swipe_deleted', { messageId: index, swipeId: del, newSwipeId: show });
}
const names = h => Object.values(h.head().domains.inventory.stacks).map(s => h.head().domains.inventory.defs[s.def].name).sort().join(',');
const cold = h => JSON.stringify(createStore({ chat: () => structuredClone(h.ctx.chat), save: async () => {} }).head());
async function base() {
    const h = await createHost();
    await h.send('a', reply('One.', ['+ item Rope']));
    await h.send('b', reply('Two.', ['+ item Lamp']));
    await h.swipe(reply('Two b.', ['+ item Torch']));
    await h.swipe(reply('Two c.', ['+ item Apple']));
    await h.store.flush();
    return h;
}
const cases = {
    async activeLast(h) { const i = h.ctx.chat.length - 1; await deleteSwipe(h, i, 2, 1); return 'Rope,Torch'; },
    async earliest(h) { const i = h.ctx.chat.length - 1; await deleteSwipe(h, i, 0, 1); return 'Apple,Rope'; },
    async middle(h) { const i = h.ctx.chat.length - 1; await deleteSwipe(h, i, 1, 1); return 'Apple,Rope'; },
    async backThenDelActive(h) { const i = h.ctx.chat.length - 1; const m = h.ctx.chat[i]; m.swipe_info[m.swipe_id].extra = structuredClone(m.extra); await h.st.swipeTo(i, 1); await deleteSwipe(h, i, 1, 1); return 'Apple,Rope'; },
    async backThenDelOther(h) { const i = h.ctx.chat.length - 1; const m = h.ctx.chat[i]; m.swipe_info[m.swipe_id].extra = structuredClone(m.extra); await h.st.swipeTo(i, 0); await deleteSwipe(h, i, 2, 0); return 'Lamp,Rope'; },
    async delLastMsg(h) { await h.st.deleteMessage(h.ctx.chat.length - 1); return 'Rope'; },
    async delLastThenCmd(h) { await h.st.deleteMessage(h.ctx.chat.length - 1); await h.st.deleteMessage(h.ctx.chat.length - 1); return 'Rope'; },
};
for (const [name, fn] of Object.entries(cases)) {
    const h = await base();
    let out = '';
    try {
        const want = await fn(h);
        const got = names(h);
        const cmd = await h.sdk.command('scene.present', { add: 'Ann' });
        let flushErr = null;
        try { await h.store.flush(); } catch (e) { flushErr = e.message; }
        const c = cold(h) === JSON.stringify(h.head());
        const saved = h.st.saved();
        const fromDisk = JSON.stringify(createStore({ chat: () => saved, save: async () => {} }).head()) === JSON.stringify(h.head());
        out = `${got === want ? 'ok' : `BAD items ${got} want ${want}`} cmd:${cmd.ok} flush:${flushErr ?? 'ok'} dirty:${h.store.dirty()} cold:${c} disk:${fromDisk}`;
    } catch (e) { out = 'THREW ' + e.message; }
    console.log(name.padEnd(18), out);
    h.close();
}
