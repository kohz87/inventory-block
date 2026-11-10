import { launch, openPage, openNarrator, queue, clearQueue, sleep, sendText, idle, setStream, liveChat, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
await openNarrator(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
await page.evaluate(() => { const c = SillyTavern.getContext(); window.__ev = []; c.eventSource.makeFirst(c.eventTypes.GENERATION_STARTED, (t, o, d) => window.__ev.push(`started ${t} dry=${d}`)); });
for (const [n, stream] of [[20, false], [120, false], [20, true], [120, true]]) {
    await setStream(page, stream);
    await page.evaluate(() => { window.__ev = []; });
    const names = Array.from({ length: n }, (_, i) => `Lamp${n}${stream ? 's' : 'n'}${i}`);
    clearQueue(); queue(`Lamps.\n<Changes>\n${names.map(x => `+ item ${x}`).join('\n')}\n</Changes>`);
    await sendText(page, `Lamps ${n}.`); await idle(page); await sleep(1500);
    const got = await page.evaluate(p => { const s = StoryBlock.sdk.view().state.domains.inventory; return Object.values(s.stacks).map(x => s.defs[x.def].name).filter(x => x.startsWith(p)).length; }, `Lamp${n}${stream ? 's' : 'n'}`);
    const last = (await liveChat(page)).at(-1);
    const notes = await page.evaluate(() => [...document.querySelectorAll('#chat .mes:last-child [class*="note"], #chat .mes:last-child [class*="reply-note"]')].map(e => e.textContent.trim().slice(0, 160)));
    console.log(n, stream ? 'stream' : 'plain', 'captured', got, 'bare', /<Changes>/.test(String(last.mes).replace(/<!--[\s\S]*?-->/g, '')), 'events', J(await page.evaluate(() => window.__ev)), 'notes', J(notes));
}
await browser.close();
