import { createHost } from '/home/user/cell/a1/Story_block/testkit/index.js';
import { mock } from 'node:test';
const told = []; console.warn = (...a) => told.push(a.map(String).join(' ').slice(0, 120));
const settle = () => new Promise(r => setImmediate(r));
for (const order of ['rename-then-timeout', 'timeout-then-rename', 'late-lands-before-rename-no-newer']) {
    told.length = 0;
    const h = await createHost();
    const files = {}; const late = []; let hold = false;
    h.ctx.getRequestHeaders = () => ({}); h.ctx.characters = [{ name: 'N', avatar: 'n.png' }]; h.ctx.characterId = 0;
    globalThis.fetch = (url, init = {}) => { const b = JSON.parse(init.body); const go = () => { if (url === '/api/chats/save') files[b.file_name] = structuredClone(b.chat); return { ok: true, status: 200, json: async () => (url === '/api/chats/get' ? structuredClone(files[b.file_name] ?? []) : {}) }; };
        if (hold && url === '/api/chats/save') { hold = false; return new Promise((res, rej) => { late.push(go); init.signal?.addEventListener?.('abort', () => rej(new Error('aborted'))); }); } return Promise.resolve(go()); };
    mock.timers.enable({ apis: ['setTimeout'] });
    const run = async n => { for (let s = 0; s < n; s++) { mock.timers.tick(1000); for (let i = 0; i < 5; i++) await settle(); } };
    await h.sdk.command('scene.present', { add: 'Ann' }); await run(1);
    hold = true;
    h.sdk.command('scene.present', { add: 'Bo' });
    const rename = async () => { files['R'] = files['chat-1']; delete files['chat-1']; await h.st.loadChat(structuredClone(files['R']).slice(1), 'R'); await h.st.eventSource.emit('chat_renamed', { oldFileName: 'chat-1.jsonl', newFileName: 'R.jsonl' }); };
    if (order === 'rename-then-timeout') { await run(5); await rename(); await run(60); late.shift()(); await run(400); }
    else if (order === 'timeout-then-rename') { await run(25); await rename(); await run(60); late.shift()(); await run(400); }
    else { await run(25); late.shift()(); await run(1); await rename(); await run(400); }
    const has = n => JSON.stringify(files[n] ?? '').includes('"Bo"');
    console.log(order, { R: has('R'), ghost: Boolean(files['chat-1']), dirty: h.store.dirty(), head: JSON.stringify(h.head().domains.scene.present), told: told.length });
    mock.timers.reset(); h.close();
}
