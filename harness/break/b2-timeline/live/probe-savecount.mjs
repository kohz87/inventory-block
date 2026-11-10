import { launch, openPage, openNarrator, queue, clearQueue, sleep, sendText, idle, J } from './lib.mjs';
const browser = await launch();
const page = await openPage(browser, {});
const open = async id => { await page.evaluate(async c => { await SillyTavern.getContext().openCharacterChat(c); }, id); await sleep(1500); };
let saves = []; page.on('request', r => { if (r.url().endsWith('/api/chats/save')) saves.push({ t: Date.now(), bytes: (r.postData() ?? '').length }); });
for (const id of [null, 'big-200']) {
    if (id) await open(id); else { await openNarrator(page); await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' })); }
    await sleep(1500); saves = [];
    clearQueue(); queue(`Count.\n<Changes>\n+ item CountLamp\n+ coin 2 | from: Fenna\n</Changes>`);
    const t0 = Date.now();
    await sendText(page, 'Count saves.'); await idle(page); await sleep(2500);
    console.log(id ?? 'new chat', 'chat-file writes for one reply:', saves.length, 'bytes', J(saves.map(s => s.bytes)), 'ms since send', J(saves.map(s => s.t - t0)));
    saves = [];
    await page.evaluate(() => StoryBlock.sdk.command('scene.present', { add: 'Counted' })); await sleep(1500);
    console.log(id ?? 'new chat', 'writes for one UI action:', saves.length);
}
await browser.close();
