import { createHost } from '/home/user/cell/a1/Story_block/testkit/index.js';
import { createStore } from '/home/user/cell/a1/Story_block/src/v2/store.js';
console.warn = () => {};
const reply = (text, lines) => `${text}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
const s = async (n = 30) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
async function deleteSwipe(h, index, del, show) {
    const m = h.ctx.chat[index];
    m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
    m.swipes.splice(del, 1); m.swipe_info.splice(del, 1);
    m.swipe_id = show; m.mes = m.swipes[show]; m.extra = structuredClone(m.swipe_info[show].extra);
    await h.st.eventSource.emit('message_swipe_deleted', { messageId: index, swipeId: del, newSwipeId: show });
}
for (const [del, show] of [[0, 1], [2, 1], [1, 1], [0, 0]]) for (const stDeleteSave of [false, true]) {
    const h = await createHost();
    const files = {}; const late = []; let hold = false;
    h.ctx.getRequestHeaders = () => ({}); h.ctx.characters = [{ name: 'N', avatar: 'n.png' }]; h.ctx.characterId = 0;
    globalThis.fetch = (url, init) => { const b = JSON.parse(init.body); const go = () => { if (url === '/api/chats/save') files[b.file_name] = structuredClone(b.chat); return { ok: true, status: 200, json: async () => (url === '/api/chats/get' ? structuredClone(files[b.file_name] ?? []) : {}) }; };
        if (hold && url === '/api/chats/save') { hold = false; return new Promise(r => late.push(() => r(go()))); } return Promise.resolve(go()); };
    await h.send('a', reply('One.', ['+ item Rope']));
    await h.send('b', reply('Two.', ['+ item Lamp']));
    await h.swipe(reply('Two b.', ['+ item Torch']));
    await h.swipe(reply('Two c.', ['+ item Apple']));
    await h.store.flush();
    hold = true;
    const p = h.sdk.command('scene.present', { add: 'Ann' });
    await s();
    const i = h.ctx.chat.length - 1;
    await deleteSwipe(h, i, del, show);
    if (stDeleteSave) files['chat-1'] = [{ chat_metadata: h.ctx.chatMetadata }, ...structuredClone(h.ctx.chat)];   // ST saves after deleteSwipe
    late.shift()?.();
    await p; await s();
    let err = null; try { await h.store.flush(); } catch (e) { err = e.message; }
    await s();
    const live = JSON.stringify(h.head());
    const disk = JSON.stringify(createStore({ chat: () => structuredClone(files['chat-1'].slice(1)), save: async () => {} }).head());
    console.log(`del ${del} show ${show} stSave ${stDeleteSave}: flush ${err ?? 'ok'} dirty ${h.store.dirty()} disk==live ${disk === live} present ${JSON.stringify(h.head().domains.scene.present)}`);
    h.close();
}
