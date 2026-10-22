// r2 live: open another chat while a streamed reply is being written (SillyTavern's TypeError in
// StreamingProcessor). Where does the reply go, is it captured, is anything left bare or uncaptured?
import { launch, openPage, openNarrator, queue, clearQueue, chatId, liveChat, fileChat, sleep, sendText, idle, setStream, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors, stream: true });
const warns = [];
page.on('console', m => { if (/Story Suite|Story Block|Story Director|RPG/i.test(m.text())) warns.push(`${m.type()} ${m.text().slice(0, 220)}`); });
const open = async id => { await page.evaluate(async c => { await SillyTavern.getContext().openCharacterChat(c); }, id); };
const bare = msgs => (msgs ?? []).filter(m => !m.is_user && /<Changes>/.test(String(m.mes).replace(/<!--[\s\S]*?-->/g, ''))).length;
const tagged = (msgs, tok) => (msgs ?? []).filter(m => String(m.mes).includes(tok));
await openNarrator(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Bea', preset: 'fighter' }));
const B = await chatId(page);
await openNarrator(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ann', preset: 'fighter' }));
const A = await chatId(page);
await page.evaluate(() => {
    const c = SillyTavern.getContext(); window.__ev = [];
    for (const name of ['message_received', 'generation_started', 'generation_ended', 'generation_stopped', 'chat_id_changed', 'message_sent', 'message_deleted', 'chat_completion_prompt_ready']) {
        c.eventSource.makeFirst?.(c.eventTypes[Object.keys(c.eventTypes).find(k => c.eventTypes[k] === name)] ?? name, (...a) => window.__ev.push(`${Math.round(performance.now())} ${name} ${JSON.stringify(a[0])?.slice(0, 40)} len=${SillyTavern.getContext().chat.length} id=${SillyTavern.getContext().getCurrentChatId()?.slice(-12)}`));
    }
});
const rows = [];
for (let k = 0; k < Number(process.argv[2] ?? 10); k++) {
    await setStream(page, true);
    const tok = `[S${k}]`;
    clearQueue();
    queue(`${tok} ${'Rain falls on the roofs. '.repeat(120)}\n<Changes>\n+ item Rope${k}\n+ coin 3 | from: Fenna\n</Changes>`);
    const e0 = errors.length;
    await page.evaluate(() => { window.__ev = []; });
    await sendText(page, `Go ${k}.`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#mes_stop')).display !== 'none', null, { timeout: 5000 }).catch(() => {});
    await sleep(150 + k * 120);
    await open(B);
    await sleep(4000);
    await idle(page, { timeout: 15000 });
    const inB = tagged(await liveChat(page), tok);
    const errs = errors.slice(e0).filter(e => !/404|No message/.test(e)).map(e => e.slice(0, 120));
    await open(A); await sleep(2000);
    const inA = tagged(await liveChat(page), tok);
    const items = await page.evaluate(() => { const s = StoryBlock.sdk.view().state?.domains?.inventory; return s ? Object.values(s.stacks).map(x => s.defs[x.def]?.name) : []; });
    // the next ordinary reply in A, right after (not streamed)
    await setStream(page, false);
    clearQueue(); queue(`[N${k}] Next.\n<Changes>\n+ item Next${k}\n</Changes>`);
    const w0 = warns.length;
    const sess0 = await page.evaluate(() => JSON.stringify(window.__sbTurn?.session?.() ?? null)).catch(() => null);
    await sendText(page, `Then ${k}.`); await idle(page); await sleep(1200);
    const nextWarns = warns.slice(w0);
    const ev = await page.evaluate(() => { const e = window.__ev; window.__ev = []; return e; });
    if (!process.env.QUIET) console.log(ev.join('\n'));
    const items2 = await page.evaluate(() => { const s = StoryBlock.sdk.view().state?.domains?.inventory; return s ? Object.values(s.stacks).map(x => s.defs[x.def]?.name) : []; });
    const nextMsg = tagged(await liveChat(page), `[N${k}]`)[0];
    const nextCaptured = items2.includes(`Next${k}`);
    const nextBare = nextMsg ? bare([nextMsg]) > 0 : null;
    rows.push({ nextWarns, nextCaptured, nextBare, nextLanded: !!nextMsg, k, delay: 150 + k * 120, inA: inA.map(m => ({ len: m.mes.length, rec: !!m.extra?.storySuite, bareBlock: bare([m]) > 0 })), inB: inB.map(m => ({ len: m.mes.length, rec: !!m.extra?.storySuite, bareBlock: bare([m]) > 0 })),
        fileA: tagged(fileChat(A), tok).length, fileB: tagged(fileChat(B), tok).length, ropeCaptured: items.includes(`Rope${k}`), errs });
    console.log(JSON.stringify(rows.at(-1)));
}
await browser.close();
