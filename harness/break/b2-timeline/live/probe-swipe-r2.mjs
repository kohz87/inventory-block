// r2 live: after a swipe right, the page head is one rev ahead of the replay of the page's own chat.
import { launch, openPage, openNarrator, queue, clearQueue, chatId, liveChat, pageHead, fileChat, headOf, sleep, sendText, idle, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
await openNarrator(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ann', preset: 'fighter' }));
const id = await chatId(page);
const R = n => (process.env.NOLINES && n >= 10 ? `[W${n}] A plain swipe reply with no change lines at all.` : `[W${n}] Reply.\n<Changes>\n+ item Thing${n}\n</Changes>`);
clearQueue(); queue(R(0)); await sendText(page, 'One.'); await idle(page); await sleep(1200);
const show = async label => {
    const chat = await liveChat(page); const head = await pageHead(page); const rep = headOf(chat);
    const last = chat.at(-1); const rec = last?.extra?.storySuite;
    console.log(label, 'page rev', head?.meta?.rev, 'replay rev', rep?.meta?.rev, 'file rev', headOf(fileChat(id))?.meta?.rev,
        '| last swipe', last?.swipe_id, '/', last?.swipes?.length, 'record', rec ? `swipe=${rec.swipe} rev=${rec.rev} receipts=${rec.receipts.map(r => r.type).join(',')}` : 'none',
        '| swipe_info recs', J((last?.swipe_info ?? []).map(s => s?.extra?.storySuite ? `${s.extra.storySuite.swipe}/${s.extra.storySuite.rev}` : null)));
    if (J(head) !== J(rep)) console.log('   diff keys', Object.keys(head?.domains ?? {}).filter(k => J(head.domains[k]) !== J(rep?.domains?.[k])), 'checks.prepared page', J(head?.domains?.checks?.prepared?.map(p => p.for)), 'replay', J(rep?.domains?.checks?.prepared?.map(p => p.for)));
};
await show('after reply');
for (let k = 1; k <= 3; k++) {
    clearQueue(); queue(R(10 + k));
    await page.locator('#chat .mes').last().locator('.swipe_right').click();
    await idle(page); await sleep(1500);
    await show(`after swipe ${k}`);
}
await page.locator('#chat .mes').last().locator('.swipe_left').click(); await idle(page); await sleep(1200);
await show('after swipe left');
console.log('errors', J(errors.filter(e => !/404|No message/.test(e)).slice(0, 4)));
await browser.close();
