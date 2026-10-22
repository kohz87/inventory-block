import { launch, openPage, openNarrator, queue, clearQueue, sleep, sendText, idle, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
let lost = 0; const N = Number(process.argv[2] ?? 6);
for (let k = 0; k < N; k++) {
    await openNarrator(page);
    await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
    await page.evaluate(() => { const c = SillyTavern.getContext(); window.__ev = []; c.eventSource.makeFirst(c.eventTypes.GENERATION_STARTED, (t, o, d) => window.__ev.push(`${t}/${d}`)); });
    clearQueue(); queue(`First.\n<Changes>\n+ item First${k}\n</Changes>`);
    await sendText(page, 'Hello.'); await idle(page); await sleep(1500);
    const got = await page.evaluate(n => { const s = StoryBlock.sdk.view().state.domains.inventory; return Object.values(s.stacks).some(x => s.defs[x.def].name === n); }, `First${k}`);
    if (!got) lost++;
    console.log(k, 'first reply captured', got, J(await page.evaluate(() => window.__ev)));
}
console.log('lost', lost, 'of', N);
await browser.close();
