// Re-break r2, b2-timeline: a change not yet saved when SillyTavern renames the open chat is lost.
// SillyTavern 1.19 renameChat: the server renames the file, characters[].chat becomes the new name, then
// reloadCurrentChat() reads it back (new message objects). The store sees another chat id ("moved"),
// hands the change to rescue(), which reads the OLD file name (gone), fails three times and gives up
// ("another chat was opened before it was saved"); the renamed chat, which is the same chat, never gets
// it. The change can be one inside the 400 ms window or one whose save is being retried after a refusal.
// Drop into Story_block/tests/v2/break/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { storeSaving } from '../../../src/v2/runtime.js';
import { createStore } from '../../../src/v2/store.js';
import { aiMessage } from '../../../testkit/fake-st.js';

const settle = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); };

test('B-b2-timeline-r2-2: a change pending while the open chat is renamed is saved into the renamed chat', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    t.mock.method(console, 'warn', () => {});
    const files = new Map();
    const ctx = {
        chat: [aiMessage('Hello.')], characterId: 0, characters: [{ name: 'N', avatar: 'n.png' }], chatMetadata: {},
        id: 'chat-A', getCurrentChatId() { return this.id; }, getRequestHeaders: () => ({}),
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
    store.scheduleSave();
    // renameChat: the file is renamed on the server, then the chat is read back under its new name.
    files.set('chat-B', files.get('chat-A'));
    files.delete('chat-A');
    ctx.id = 'chat-B';
    ctx.chat.splice(0, ctx.chat.length, ...structuredClone(files.get('chat-B')).slice(1));
    for (let i = 0; i < 12; i++) { t.mock.timers.tick(16000); await settle(); }
    const onDisk = createStore({ chat: () => structuredClone(files.get('chat-B')).slice(1), save: async () => {} }).head();
    assert.equal(onDisk.domains.n.x, 7, `the renamed chat's file holds the change (actual: ${onDisk.domains.n.x}; told: ${JSON.stringify(errors)})`);
});
