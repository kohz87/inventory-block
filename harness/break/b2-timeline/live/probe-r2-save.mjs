// r2 live: the direct save path. No generations (the mock queue is not used).
// 1 refused save → told + retried; 2 unload with an unsaved change (small vs big chat, keepalive cap);
// 3 SillyTavern's own save racing Story Block's direct save; 4 per-save cost by chat size.
import { launch, openPage, openNarrator, chatId, pageHead, fileChat, headOf, sleep, J, CHATS } from './lib.mjs';
import fs from 'node:fs';
const errors = [];
const browser = await launch();
let page = await openPage(browser, { errors });
const present = h => h?.domains?.scene?.present ?? [];
const open = async id => { await page.evaluate(async c => { const ctx = SillyTavern.getContext(); const i = ctx.characters.findIndex(x => x.name === 'The Narrator'); if (String(ctx.characterId) !== String(i)) { await ctx.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 1200)); } await ctx.openCharacterChat(c); }, id); await sleep(1500); };
const add = (name, wait = true) => page.evaluate(async ([n, w]) => { const p = StoryBlock.sdk.command('scene.present', { add: n }); if (!w) return 'sent'; const t0 = performance.now(); const r = await p; return { ok: r.ok, ms: Math.round(performance.now() - t0), code: r.code }; }, [name, wait]);
const toasts = () => page.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(n => n.textContent.trim().slice(0, 140)));
async function reload() {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
    await sleep(800);
    await page.evaluate(async () => { window.jQuery('#api_button_openai').trigger('click'); await new Promise(r => setTimeout(r, 1000)); });
}
const out = {};

// 1. refused save
await openNarrator(page);
const small = await chatId(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
await sleep(800);
let refusedCount = 0;
await page.route('**/api/chats/save', async route => { refusedCount++; await route.fulfill({ status: 500, body: '{"error":"disk full"}', contentType: 'application/json' }); });
const r1 = await add('Refused');
await sleep(2500);
out.refused = { cmd: r1, requestsRefused: refusedCount, toasts: await toasts(), onDisk: present(headOf(fileChat(small))) };
await page.unroute('**/api/chats/save');
await sleep(9000);   // the retry (1 s, 2 s, 4 s ...)
out.refused.afterRetry = present(headOf(fileChat(small)));

// 2. unload with an unsaved change: small chat, then big chats
for (const id of [small, 'big-50', 'big-200']) {
    await open(id);
    const before = present(headOf(fileChat(id)));
    const name = `Unload${Date.now() % 100000}`;
    await add(name, false);           // the reader clicks and closes/reloads at once
    await reload();
    await sleep(1500);
    const disk = present(headOf(fileChat(id)));
    (out.unload ??= []).push({ id, bytes: fs.statSync(`${CHATS}/${id}.jsonl`).size, kept: disk.includes(name), before: before.length, after: disk.length });
}

// 3. SillyTavern's own save racing the direct save (same tick), big chat
for (const id of ['big-200', 'big-300']) {
    await open(id);
    for (let k = 0; k < 4; k++) {
        const name = `Race${k}_${Date.now() % 100000}`;
        await page.evaluate(async n => { const ctx = SillyTavern.getContext(); ctx.saveChat(); await StoryBlock.sdk.command('scene.present', { add: n }); }, name);
        await sleep(4000);
        const disk = present(headOf(fileChat(id)));
        (out.race ??= []).push({ id, k, kept: disk.includes(name), live: present(await pageHead(page)).includes(name) });
    }
}

// 4. per-save cost by size: 5 UI commands each, awaited (saved before the answer)
for (const id of [small, 'big-50', 'big-200', 'big-300']) {
    await open(id);
    const ms = [];
    for (let k = 0; k < 5; k++) ms.push((await add(`Cost${k}`)).ms);
    const burst = await page.evaluate(async () => { const t0 = performance.now(); await Promise.all(Array.from({ length: 10 }, (_, i) => StoryBlock.sdk.command('scene.present', { add: `Burst${i}` }))); return Math.round(performance.now() - t0); });
    const read = await page.evaluate(async () => { const t0 = performance.now(); StoryBlock.sdk.view(); return Math.round(performance.now() - t0); });
    (out.cost ??= []).push({ id, bytes: fs.statSync(`${CHATS}/${id}.jsonl`).size, perCommandMs: ms, burst10Ms: burst, viewMs: read });
}
console.log(JSON.stringify(out, null, 1));
console.log('errors', J(errors.filter(e => !/404|No message/.test(e)).slice(0, 8)));
await browser.close();
