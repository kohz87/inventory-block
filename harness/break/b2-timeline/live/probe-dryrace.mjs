// r2 live: a dry-run Generate (token count) that starts while the reader's own generation is starting
// flips turn.js's single `dryNext` flag; the real reply is then treated as a dry run and not captured.
// No chat switch: the reader sends again at varied delays after a reply.
import { launch, openPage, openNarrator, queue, clearQueue, liveChat, sleep, sendText, idle, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
await openNarrator(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ann', preset: 'fighter' }));
await page.evaluate(() => {
    const c = SillyTavern.getContext(); window.__ev = [];
    c.eventSource.makeFirst(c.eventTypes.GENERATION_STARTED, (type, opts, dry) => window.__ev.push(`${Math.round(performance.now())} started ${type} dry=${dry}`));
    c.eventSource.makeFirst(c.eventTypes.MESSAGE_RECEIVED, id => window.__ev.push(`${Math.round(performance.now())} received ${id}`));
});
const rows = [];
const delays = (process.argv[2] ?? '0,200,400,600,800,1000,1200,1500').split(',').map(Number);
for (const d of [...delays, ...delays]) {
    const k = rows.length;
    clearQueue(); queue(`[D${k}] Reply.\n<Changes>\n+ item Dry${k}\n</Changes>`);
    const evPrev = await page.evaluate(() => { const e = window.__ev; window.__ev = []; return e; });
    if (rows.length) rows[rows.length - 1].evAfter = evPrev;
    await sendText(page, `Turn ${k}.`);
    await page.waitForFunction(t => SillyTavern.getContext().chat.some(m => String(m.mes).includes(t)), `[D${k}]`, { timeout: 15000 }).catch(() => {});
    await sleep(d);   // the reader is quick
    // the next turn starts right away in the next loop; first look at this one after it settles
    const items = await page.evaluate(() => { const s = StoryBlock.sdk.view().state?.domains?.inventory; return s ? Object.values(s.stacks).map(x => s.defs[x.def]?.name) : []; });
    rows.push({ k, delayBeforeNextSend: d, captured: null, ev: null });
    if (k > 0) {
        const prev = rows[k - 1];
        prev.captured = items.includes(`Dry${k - 1}`) || prev.captured;
    }
    void items;
}
await idle(page); await sleep(1500);
const items = await page.evaluate(() => { const s = StoryBlock.sdk.view().state?.domains?.inventory; return s ? Object.values(s.stacks).map(x => s.defs[x.def]?.name) : []; });
const chat = await liveChat(page);
for (const row of rows) {
    const m = chat.find(x => String(x.mes).includes(`[D${row.k}]`));
    row.captured = items.includes(`Dry${row.k}`);
    row.bare = m ? /<Changes>/.test(String(m.mes).replace(/<!--[\s\S]*?-->/g, '')) : null;
}
console.log(rows.map(r => `D${r.k} sentAfter(prev+${rows[r.k - 1]?.delayBeforeNextSend ?? '-'}ms) captured=${r.captured} bare=${r.bare}`).join('\n'));
for (const r of rows.filter(r => !r.captured)) console.log(`D${r.k} events from its send:`, J(rows[r.k]?.evAfter));
console.log('uncaptured', rows.filter(r => !r.captured).length, 'of', rows.length);
console.log('errors', J(errors.filter(e => !/404|No message/.test(e)).slice(0, 4)));
await browser.close();
