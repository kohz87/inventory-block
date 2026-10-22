// a4 storage harness: a testkit host with all four modules, saving through the real chat-file path
// (src/v2/chat-file.js) to a fake SillyTavern server with failure modes.
const B = process.env.A4ROOT ?? '/home/user/cell/a4';
const { createHost } = await import(`${B}/Story_block/testkit/index.js`);
const RB = await import(`${B}/rpg_battle/src/v2/module.js`);
const SD = await import(`${B}/Story_director/src/v2/module.js`);
const NSD = await import(`${B}/npc_state_delta/src/storysuite-v2.js`);
export const persist = await import(`${B}/Story_block/src/v2/persist.js`);
export const storeMod = await import(`${B}/Story_block/src/v2/store.js`);
export const fakeSt = await import(`${B}/Story_block/testkit/fake-st.js`);
export const seededMod = await import(`${B}/Story_block/tests/v2/qa/helpers/seeded.js`);
export const oracle = await import(`${B}/Story_block/tests/v2/qa/helpers/oracle.js`);

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const plain = v => (v === null || v === undefined ? null : JSON.parse(JSON.stringify(v)));
export const J = v => JSON.stringify(plain(v));

// The fake server. mode: ok | throw (fetch rejects) | sync (fetch throws synchronously) | 500 | integrity | hang | slow
// `fails` = how many next saves get `mode` (then ok). Hung saves are kept in `hung` until release().
export function makeServer() {
    const s = { files: new Map(), mode: 'ok', fails: 0, delay: 0, hung: [], writes: 0, log: [] };
    s.release = () => { const h = s.hung.splice(0); for (const fn of h) fn(); return h.length; };
    const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, statusText: '', json: async () => structuredClone(data) });
    s.fetch = (url, init = {}) => {
        const body = JSON.parse(init.body);
        if (url.endsWith('/get')) {
            const f = s.files.get(body.file_name);
            return Promise.resolve(reply(200, f ? structuredClone(f) : {}));
        }
        if (!url.endsWith('/save')) return Promise.resolve(reply(404, {}));
        const mode = s.fails > 0 ? s.mode : 'ok';
        if (s.fails > 0) s.fails--;
        s.log.push(`${mode}:${body.file_name}:${body.chat.length}`);
        const commit = () => { s.files.set(body.file_name, structuredClone(body.chat)); s.writes++; };
        if (mode === 'sync') throw new Error('sync fetch failure');
        if (mode === 'throw') return Promise.reject(new TypeError('Failed to fetch'));
        if (mode === '500') return Promise.resolve(reply(500, { error: 'disk full' }));
        if (mode === 'integrity') return Promise.resolve(reply(400, { error: 'integrity' }));
        if (mode === 'hang') {
            // the server writes the file on arrival; its answer comes when released
            commit();
            return new Promise(res => { const go = () => res(reply(200, { ok: true })); s.hung.push(go); setTimeout(() => { const i = s.hung.indexOf(go); if (i >= 0) { s.hung.splice(i, 1); go(); } }, 300); });
        }
        if (mode === 'reorder') return new Promise(res => s.hung.push(() => { commit(); res(reply(200, { ok: true })); }));
        // no write, and the answer (a failure) comes late, by itself
        if (mode === 'hangfail') return sleep(s.delay || 20).then(() => reply(500, { error: 'late' }));
        if (mode === 'slow') return sleep(s.delay || 30).then(() => { commit(); return reply(200, { ok: true }); });
        commit();
        return Promise.resolve(reply(200, { ok: true }));
    };
    return s;
}

export async function allHost({ server, modules: withModules = true, stSaveOnEnd = true } = {}) {
    let sdk = null;
    const mods = [];
    if (withModules) {
        const rb = RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} });
        const sd = SD.createModule({ host: { settings: id => sdk?.settings?.(id) ?? null, substitute: t => sdk?.substitute?.(t) } });
        const adapter = NSD.createStorySuiteV2Adapter({ suiteApi: { npcs: () => [] }, delta: () => ({ isEnabled: () => true, getNpc: () => null }), host: () => null, doc: null, logger: { warn() {} } });
        mods.push(rb, sd);
        if (adapter.definition) mods.push(adapter.definition);
    }
    globalThis.fetch = server.fetch;
    const h0 = { pending: null };
    // ctx fields chat-file.js needs must exist before the runtime is made? where() is asked per save.
    const host = await createHost({ modules: mods });
    sdk = host.sdk;
    const { ctx, st } = host;
    ctx.getRequestHeaders = () => ({});
    ctx.characters = [{ name: 'Narrator', avatar: 'narrator.png' }];
    ctx.characterId = 0;
    // SillyTavern's own saveChat (saveChatConditional): writes the open chat with its metadata, swallows errors.
    ctx.saveChat = async () => {
        try {
            // SillyTavern's own saves get the failure modes only with STFAIL=1 (else a delete it never saved
            // shows up as a Story Block #7 alarm).
            const body = { file_name: ctx.chatId, chat: [{ chat_metadata: ctx.chatMetadata }, ...ctx.chat] };
            if (!process.env.STFAIL) { server.files.set(body.file_name, structuredClone(body.chat)); server.log.push(`st:${body.file_name}:${body.chat.length}`); return; }
            const res = await server.fetch('/api/chats/save', { body: JSON.stringify(body) });
            if (!res.ok) throw new Error(String(res.status));
        } catch { /* SillyTavern swallows it */ }
    };
    // SillyTavern saves the chat itself after each generation (saveChatConditional), and fails with the server.
    if (stSaveOnEnd) st.eventSource.on('generation_ended', () => ctx.saveChat());
    globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
    void h0;
    return host;
}

// SillyTavern's ensureSwipes on load.
export const ensureSwipes = chat => { for (const m of chat) { if (!m || m.is_user || !Array.isArray(m.swipes)) continue; if (!Array.isArray(m.swipe_info)) m.swipe_info = []; for (let i = 0; i < m.swipes.length; i++) if (!m.swipe_info[i] || typeof m.swipe_info[i] !== 'object') m.swipe_info[i] = { send_date: '', extra: {} }; } return chat; };

// Open chat `id` from the server (header → chatMetadata), as SillyTavern does.
export async function openFromServer(h, server, id) {
    const file = server.files.get(id);
    // A new chat: SillyTavern writes its file with the greeting when it is made.
    if (!file) server.files.set(id, [{ chat_metadata: {} }, fakeSt.aiMessage('The story begins.')]);
    const [header, ...messages] = structuredClone(server.files.get(id));
    h.ctx.chatMetadata = header?.chat_metadata ?? {};
    await h.st.loadChat(ensureSwipes(messages), id);
}

export function freshHead(h, chat) {
    const validate = (state, names) => names.flatMap(name => {
        const fn = h.registry.validator(name);
        if (typeof fn !== 'function') return [];
        try { const e = fn(state?.domains?.[name], state); return Array.isArray(e) ? e.map(String) : []; } catch (error) { return [`The ${name} check failed: ${error?.message ?? error}`]; }
    });
    const s = storeMod.createStore({ chat: () => chat, save: async () => {}, validate, scratch: name => h.registry.scratch(name) });
    return s.head();
}
export function fileHead(h, server, id) {
    const f = server.files.get(id);
    if (!f) return undefined;
    return freshHead(h, ensureSwipes(structuredClone(f).slice(1)));
}

// SillyTavern 1.19 createOrEditCharacter, the pristine-chat branch: the greeting is made again from the card.
export async function cardEdit(h) {
    const { ctx, st } = h;
    const pristine = !ctx.chatMetadata?.tainted && ctx.chat.length === 1 && !ctx.chat[0].is_user && !ctx.chat[0].is_system;
    if (!pristine) return false;
    ctx.chat.splice(0, ctx.chat.length, fakeSt.aiMessage('The story begins (card edited).', { name: ctx.name2 }));
    await st.eventSource.emit('message_received', 0, 'first_message');
    await ctx.saveChat();
    return true;
}

// SillyTavern 1.19 renameChat: server renames the file, the chat is read back, CHAT_CHANGED, then CHAT_RENAMED.
export async function renameChat(h, server, to, { event = true } = {}) {
    const from = h.ctx.chatId;
    const f = server.files.get(from);
    if (f) { server.files.set(to, f); server.files.delete(from); }
    await openFromServer(h, server, to);
    if (event) await h.st.eventSource.emit('chat_renamed', { oldFileName: `${from}.jsonl`, newFileName: `${to}.jsonl` });
}
