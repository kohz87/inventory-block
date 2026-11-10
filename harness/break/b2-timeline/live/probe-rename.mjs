// r3 live: a change not yet saved (its save refused and being retried) when the open chat is renamed.
import fs from 'node:fs';
import { launch, openPage, openNarrator, chatId, pageHead, fileChat, headOf, sleep, J, CHATS, queue, clearQueue, sendText, idle } from './lib.mjs';
const errors = [];
const logs = [];
const browser = await launch();
const page = await openPage(browser, { errors });
page.on('console', m => { if (/Story|story|rename|save/i.test(m.text())) logs.push(`${m.type()} ${m.text().slice(0, 200)}`); });
page.on('request', r => { if (/api\/chats\/(save|rename|get)/.test(r.url())) { let b = {}; try { b = JSON.parse(r.postData() ?? '{}'); } catch {} logs.push(`${Date.now() % 100000} REQ ${r.url().split('/api/')[1]} ${b.file_name ?? b.renamed_file ?? ''} msgs=${Array.isArray(b.chat) ? b.chat.length : ''}`); } });
page.on('response', r => { if (/api\/chats\/(save|rename)/.test(r.url())) logs.push(`${Date.now() % 100000} RES ${r.url().split('/api/')[1]} ${r.status()}`); });
const present = h => h?.domains?.scene?.present ?? [];
const toasts = () => page.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(n => n.textContent.trim().slice(0, 160)));
for (const mode of ['retrying', 'window']) {
    await openNarrator(page);
    await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
    await sleep(1200);
    clearQueue(); queue('Hello.\n<Changes>\n+ item Rope\n</Changes>'); await sendText(page, 'Hi.'); await idle(page); await sleep(1500);   // not a pristine chat
    const old = await chatId(page);
    const name = `Ren-${mode}-${Date.now() % 100000}`;
    const nu = `Renamed ${mode} ${Date.now() % 100000}`;
    logs.length = 0;
    if (mode === 'retrying') {
        await page.route('**/api/chats/save', r => r.fulfill({ status: 500, body: '{}', contentType: 'application/json' }));
        await page.evaluate(n => StoryBlock.sdk.command('scene.present', { add: n }), name);
        await page.unroute('**/api/chats/save');
    } else {
        // a UI action and the rename in the same moment
        page.evaluate(n => StoryBlock.sdk.command('scene.present', { add: n }), name);
    }
    await page.evaluate(async ([o, n]) => { await SillyTavern.getContext().renameChat(o, n); }, [old, nu]);
    await sleep(20000);
    const now = await chatId(page);
    const disk = present(headOf(fileChat(now)));
    console.log(mode, 'open', JSON.stringify(now), 'renamed file has the change', disk.includes(name), 'live has it', present(await pageHead(page)).includes(name),
        'pc on disk', !!headOf(fileChat(now))?.domains?.party?.pc, 'msgs', fileChat(now)?.length, 'old file exists', fs.existsSync(`${CHATS}/${old}.jsonl`), 'toasts', J(await toasts()));
}
console.log(logs.join('\n'));
console.log('errors', J(errors.filter(e => !/404|No message|500/.test(e)).slice(0, 4)));
await browser.close();
