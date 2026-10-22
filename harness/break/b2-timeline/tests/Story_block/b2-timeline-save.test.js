// Break round F103, b2-timeline: saves (invariant #7). Drop into Story_block/tests/v2/break/.
//
// B-b2-timeline-1: the 400 ms UI save fires after SillyTavern has switched chats. SillyTavern 1.19 never
// saves the old chat on a switch (clearChat cancels its own debounced save), empties the shared chat
// array in place, sets the new file name, then awaits getChat. Story Block's pending timer then calls
// ctx.saveChat(), which saves whatever chat is current: the UI command is lost for chat A, and when the
// timer lands while getChat is in flight an EMPTY chat is written over chat B's file.
//
// B-b2-timeline-2: ctx.saveChat is saveChatConditional in SillyTavern 1.19: it catches its own errors
// (console.error) and returns quietly on a save timeout, so a failed save resolves. The store marks the
// state saved; SPEC §3.3's "verify the head carrier's rev after the save" is not implemented.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../../testkit/index.js';
import { createStore } from '../../../src/v2/store.js';

const settle = () => new Promise(resolve => setImmediate(resolve));
const coin = state => state?.domains?.inventory?.wallets?.party?.coin ?? 0;

// SillyTavern's chat switch (openCharacterChat → clearChat → getChat) on the testkit's fake, in place:
// the chat array is emptied and the file name changes before the new chat arrives from the server.
function stSwitch(h, files, id) {
    const { ctx, st } = h;
    ctx.chat.length = 0;              // clearChat({ clearData: true })
    ctx.chatId = id;                  // characters[this_chid].chat = file_name
    return async function arrive() {  // getChat() resolves
        ctx.chat.push(...structuredClone(files[id]));
        await st.eventSource.emit('chat_id_changed', id);
    };
}

test('B-b2-timeline-1: a UI command, then another chat opened within 400 ms: chat B is not overwritten and A keeps the command', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    t.mock.method(console, 'warn', () => {});
    const h = await createHost();
    t.after(() => h.close());
    const files = {};
    // The fake's saveChat writes ctx.chat to the file of the current chat id, like SillyTavern's.
    h.ctx.saveChat = async () => { files[h.ctx.chatId] = structuredClone(h.ctx.chat); };
    await h.send('In A.', 'Chat A.\n<Changes>\n+ coin 5\n</Changes>');
    files['chat-B'] = [structuredClone(h.ctx.chat[0]), { name: 'You', is_user: true, mes: 'B1', extra: {} }, structuredClone(h.ctx.chat[2]), { name: 'You', is_user: true, mes: 'B2', extra: {} }, structuredClone(h.ctx.chat[2])];
    const bLength = files['chat-B'].length;
    assert.equal((await h.sdk.command('wallet.receive', { owner: 'party', amount: 7 })).ok, true);
    assert.equal(coin(h.head()), 12);
    const arrive = stSwitch(h, files, 'chat-B');    // the reader opens chat B 0-399 ms later
    t.mock.timers.tick(400);                        // Story Block's scheduled save fires during getChat
    await settle(); await settle();
    await arrive();
    assert.equal(files['chat-B'].length, bLength, `chat B's file still holds its ${bLength} messages (actual: ${files['chat-B'].length})`);
    const savedA = createStore({ chat: () => structuredClone(files['chat-1']), save: async () => {} }).head();
    assert.equal(coin(savedA), 12, 'chat A on disk holds the command made in it (actual: 5, the command is lost)');
});

test('B-b2-timeline-2: a save SillyTavern swallows (saveChatConditional) leaves the state marked unsaved (SPEC §3.3)', async t => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'error', () => {});
    const h = await createHost();
    t.after(() => h.close());
    const files = {};
    let failing = false;
    // SillyTavern 1.19's ctx.saveChat: try { await saveChat() } catch (e) { console.error(e) } — never throws.
    h.ctx.saveChat = async () => {
        try {
            if (failing) throw new Error('500 Internal Server Error');
            files[h.ctx.chatId] = structuredClone(h.ctx.chat);
        } catch (error) {
            console.error('Error saving chat', error);
        }
    };
    let told = 0;
    await h.send('One.', 'Fine.\n<Changes>\n+ coin 5\n</Changes>');
    failing = true;
    assert.equal((await h.sdk.command('wallet.receive', { owner: 'party', amount: 7 })).ok, true);
    await h.store.flush().catch(() => { told += 1; });
    const onDisk = createStore({ chat: () => structuredClone(files['chat-1']), save: async () => {} }).head();
    assert.equal(coin(onDisk), 5, 'precondition: the file does not hold the command');
    assert.ok(h.store.dirty() || told > 0, 'the store knows the command was not saved (actual: dirty() is false and nothing was reported)');
});
