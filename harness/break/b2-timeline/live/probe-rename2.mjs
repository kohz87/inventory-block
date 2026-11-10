import { launch, openPage, openNarrator, chatId, pageHead, fileChat, headOf, sleep, J, queue, clearQueue, sendText, idle } from './lib.mjs';
const browser = await launch();
const page = await openPage(browser, {});
const st = async (label, id) => { const f = fileChat(id ?? await chatId(page)); const h = headOf(f); console.log(label, 'file msgs', f?.length, 'pc', !!h?.domains?.party?.pc, 'present', J(h?.domains?.scene?.present), '| live pc', !!(await pageHead(page))?.domains?.party?.pc, 'present', J((await pageHead(page))?.domains?.scene?.present)); };
for (const withReply of [false, true]) {
    await openNarrator(page);
    await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
    await sleep(1500);
    if (withReply) { clearQueue(); queue('Hello.\n<Changes>\n+ item Rope\n</Changes>'); await sendText(page, 'Hi.'); await idle(page); await sleep(1500); }
    await st(`[${withReply ? 'reply' : 'greeting only'}] after party.create`);
    await page.evaluate(() => StoryBlock.sdk.command('scene.present', { add: 'Ann' }));
    await sleep(1500);
    await st('after UI command');
    const old = await chatId(page);
    await page.evaluate(async ([o, n]) => { await SillyTavern.getContext().renameChat(o, n); }, [old, `Plain rename ${Date.now() % 100000}`]);
    await sleep(5000);
    await st('after a rename with nothing pending');
}
await browser.close();
