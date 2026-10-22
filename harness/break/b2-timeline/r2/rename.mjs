// A change pending (the 400 ms save) when SillyTavern renames the open chat.
const SB = '/home/user/_break/b2-timeline-r2/Story_block';
const { storeSaving } = await import(`${SB}/src/v2/runtime.js`);
const { createStore } = await import(`${SB}/src/v2/store.js`);
const { aiMessage } = await import(`${SB}/testkit/fake-st.js`);
console.warn = () => {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const files = new Map();
const ctx = {
    chat: [aiMessage('Hello.')], characterId: 0, characters: [{ name: 'N', avatar: 'n.png' }], chatMetadata: {},
    _id: 'chat-A', getCurrentChatId() { return this._id; }, getRequestHeaders: () => ({}),
};
const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    if (url.endsWith('/save')) { files.set(body.file_name, structuredClone(body.chat)); return { ok: true, json: async () => ({}) }; }
    if (url.endsWith('/get')) { const f = files.get(body.file_name); return { ok: true, json: async () => (f ? structuredClone(f) : []) }; }
    return { ok: false, status: 404, json: async () => ({}) };
};
const errors = [];
const store = createStore({ ...storeSaving({ ctx, live: () => ctx, fetch, onSaveError: e => errors.push(e.message) }) });
store.ensureInitial({ v: 2, meta: { rev: 0, claims: {} }, domains: { n: { x: 0 } } });
await store.flush();
store.append({ ops: [{ op: 'replace', path: '/domains/n/x', value: 7 }, { op: 'replace', path: '/meta/rev', value: 1 }], receipt: { id: 'rc_aaaaaaaa', type: 't', cause: 'system', rev: 1 } });
store.scheduleSave();                         // a system change: saved within 400 ms
// SillyTavern renames the chat (server renames the file; the page opens it under the new name)
files.set('chat-B', files.get('chat-A')); files.delete('chat-A');
ctx._id = 'chat-B';
const loaded = structuredClone(files.get('chat-B')).slice(1);
ctx.chat.length = 0; ctx.chat.push(...loaded);
await sleep(30000);
const onDisk = files.get('chat-B')?.slice(1);
const disk = onDisk ? createStore({ chat: () => onDisk, save: async () => {} }).head() : null;
console.log('dirty', store.dirty(), 'live x', store.head()?.domains?.n?.x, 'on disk x', disk?.domains?.n?.x, 'chat-A recreated', files.has('chat-A'), 'errors', JSON.stringify(errors));
