// Confirm soak: what the 16k context costs per reply on the final chat. A copy of the chat gets N sends at
// SillyTavern's default 4,095 and N at 16,384 (alternating), and each send's send→request, Story Block's
// interceptor time (its save before the reply included) and the request size are measured.
// usage: node confirm-ab-context.mjs <chat id> [n=6]   (env from confirm.env)
import fs from 'node:fs';
import { launchRaw } from './cdp-page.mjs';
import { CHAR_NAME, MOCK_LOG, ST_DATA, ST_URL, clearQueue, connectMock, queue, readReq, reqNums, waitHost } from './lib.mjs';
import { createGen } from './gen.mjs';
const [chatId, n = '6'] = process.argv.slice(2);
const dir = `${ST_DATA}/default-user/chats/${CHAR_NAME}`;
const copy = `${chatId} AB`;
fs.copyFileSync(`${dir}/${chatId}.jsonl`, `${dir}/${copy}.jsonl`);
const { browser, page } = await launchRaw({ port: 9466 });
const ev = (fn, a) => page.evaluate(fn, a);
await page.goto(ST_URL); await waitHost(page); await connectMock(page);
await ev(async ({ copy, CHAR_NAME }) => {
    const ctx = SillyTavern.getContext();
    await ctx.executeSlashCommandsWithOptions('/persona-set mode=temp Wessel');
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
    await new Promise(r => setTimeout(r, 1000));
    await ctx.openCharacterChat(copy);
    await new Promise(r => setTimeout(r, 3000));
    const s = window.__ab = { intercept: [], saveMs: 0, inIntercept: false };
    const realFetch = window.fetch;
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : input?.url ?? '';
        const t0 = performance.now();
        try { return await realFetch.apply(this, arguments); } finally { if (s.inIntercept && url.includes('/api/chats/save')) s.saveMs += performance.now() - t0; }
    };
    const orig = window.storyBlockGenerationInterceptor;
    window.storyBlockGenerationInterceptor = async (...a) => {
        const t0 = performance.now(); s.inIntercept = true; s.saveMs = 0;
        try { return await orig(...a); } finally { s.inIntercept = false; s.intercept.push({ ms: performance.now() - t0, save: s.saveMs, size: a[1] }); }
    };
}, { copy, CHAR_NAME });
console.log('messages', await ev(() => SillyTavern.getContext().chat.length));
const gen = createGen(4242);
const results = { 4095: [], 16384: [] };
clearQueue();
for (let i = 0; i < Number(n) * 2; i += 1) {
    const size = i % 2 ? 16384 : 4095;
    await ev(size => { window.jQuery('#openai_max_context').val(size).trigger('input'); }, size);
    await page.waitForTimeout(300);
    queue(gen.next({}).reply);
    const before = reqNums().at(-1) ?? 0;
    const k = await ev(() => window.__ab.intercept.length);
    const t0 = Date.now();
    await page.fill('#send_textarea', 'I look around and listen.');
    await page.click('#send_but');
    for (let w = 0; w < 600; w += 1) { await page.waitForTimeout(100); if (await ev(k => window.__ab.intercept.length > k && !(getComputedStyle(document.querySelector('#mes_stop')).display !== 'none'), k)) break; }
    await page.waitForTimeout(1500);
    const reqs = reqNums().filter(x => x > before).map(x => ({ x, body: readReq(x), at: fs.statSync(`${MOCK_LOG}/req-${x}.json`).mtimeMs }));
    const main = reqs.find(r => JSON.stringify(r.body).includes('[Story Suite: how this story is kept]'));
    const ic = await ev(k => window.__ab.intercept[k], k);
    results[size].push({ sendToRequest: main ? Math.round(main.at - t0) : null, interceptMs: Math.round(ic?.ms ?? 0), saveInIntercept: Math.round(ic?.save ?? 0), ctx: ic?.size, msgs: main?.body.messages.length, reqChars: main ? JSON.stringify(main.body.messages).length : null });
    console.log(size, JSON.stringify(results[size].at(-1)));
}
const med = xs => { const s = xs.filter(x => x != null).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const size of [4095, 16384]) console.log('median', size, ['sendToRequest', 'interceptMs', 'saveInIntercept', 'msgs', 'reqChars'].map(k => `${k} ${med(results[size].map(r => r[k]))}`).join(', '));
fs.writeFileSync(`${process.env.SOAK_OUT ?? '.'}/ab-context.json`, JSON.stringify(results, null, 1));
await browser.close();
