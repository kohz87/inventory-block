import { createHost } from '/home/user/cell/a1/Story_block/testkit/index.js';
const told = [];
console.warn = (...a) => told.push(a.map(String).join(' ').slice(0, 160));
const s = async (n = 20) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
for (const mode of ['renamed', 'deleted', 'renamed-then-open', 'deleted-group']) {
    told.length = 0;
    const errs = [];
    const h = await createHost();
    h.store; 
    const files = {}; let refuse = 0;
    h.ctx.getRequestHeaders = () => ({});
    if (mode.endsWith('group')) h.ctx.groupId = 'g1'; else { h.ctx.characters = [{ name: 'N', avatar: 'n.png' }]; h.ctx.characterId = 0; }
    const key = b => b.file_name ?? b.id;
    globalThis.fetch = async (url, init) => { const b = JSON.parse(init.body);
        if (/save/.test(url)) { if (refuse > 0) { refuse--; return { ok: false, status: 500, json: async () => ({}) }; } files[key(b)] = structuredClone(b.chat); }
        return { ok: true, status: 200, json: async () => (/get/.test(url) ? structuredClone(files[key(b)] ?? (mode.endsWith('group') ? [] : {})) : {}) }; };
    for (let i = 1; i <= 2; i++) await h.send(`u${i}`, `r${i}\n<Changes>\n+ item Rope\n</Changes>`);
    await h.store.flush();
    refuse = 1;
    await h.sdk.command('scene.present', { add: 'Ann' });
    const A = h.ctx.chatId;
    await h.st.loadChat([structuredClone(h.ctx.chat[0])], 'chat-B');
    files['chat-B'] = [{ chat_metadata: {} }, ...structuredClone(h.ctx.chat)];
    if (mode.startsWith('renamed')) {
        files['A2'] = files[A]; delete files[A];
        await h.st.eventSource.emit('chat_renamed', { oldFileName: `${A}.jsonl`, newFileName: 'A2.jsonl' });
    } else delete files[A];
    let threw = null;
    try {
        for (let k = 0; k < 6; k++) { try { await h.store.flush(); } catch (e) { errs.push(e.message.slice(0, 120)); } await s(); }
        if (mode === 'renamed-then-open') { await h.st.loadChat(structuredClone(files['A2']).slice(1), 'A2'); }
    } catch (e) { threw = e.message; }
    const holds = name => (files[name] ?? []).some(m => JSON.stringify(m?.extra?.storySuite ?? '').includes('Ann'));
    console.log(mode, { threw, dirty: h.store.dirty(), A2: holds('A2'), ghostA: Boolean(files[A]), headAnn: JSON.stringify(h.head()?.domains?.scene?.present), errs, told });
    h.close();
}
