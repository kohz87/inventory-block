// Live probe: a UI command, then a chat switch (or reload) inside the 400 ms save window.
import { launch, openPage, openNarrator, queue, clearQueue, chatId, cmd, pageHead, fileChat, headOf, idle, sendText, sleep, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
clearQueue();
await openNarrator(page);
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
// chat B: a chat with two replies
console.log('B party', J(await cmd(page, 'party.create', { name: 'Bea', preset: 'fighter' })));
queue(R('B reply one.', ['+ item Rope']));
await sendText(page, 'B one'); await idle(page);
queue(R('B reply two.', ['+ item Lamp']));
await sendText(page, 'B two'); await idle(page);
await sleep(1000);
const B = await chatId(page);
console.log('chat B', B, 'file msgs', fileChat(B)?.length);
// chat A
await openNarrator(page);
console.log('A party', J(await cmd(page, 'party.create', { name: 'Ann', preset: 'fighter' })));
queue(R('A reply one.', ['+ coin 5']));
await sendText(page, 'A one'); await idle(page);
await sleep(1000);
const A = await chatId(page);
console.log('chat A', A, 'file head coin', headOf(fileChat(A))?.domains?.inventory?.wallets?.party?.coin);

const DELAY = Number(process.argv[2] ?? 100);
// UI command then switch to B within the save window
const res = await cmd(page, 'wallet.receive', { owner: 'party', amount: 7 });
console.log('ui cmd', J(res), 'live coin', (await pageHead(page))?.domains?.inventory?.wallets?.party?.coin);
await sleep(DELAY);
await page.evaluate(async b => { await SillyTavern.getContext().openCharacterChat(b); }, B);
await sleep(2500);
console.log('now on', await chatId(page), 'live msgs', await page.evaluate(() => SillyTavern.getContext().chat.length));
const fa = fileChat(A), fb = fileChat(B);
console.log('file A msgs', fa?.length, 'coin on disk', headOf(fa)?.domains?.inventory?.wallets?.party?.coin, '(live had', 12, ')');
console.log('file B msgs', fb?.length, 'head items', Object.keys(headOf(fb)?.domains?.inventory?.stacks ?? {}).length);
// back to A: what does the reader see?
await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, A);
await sleep(2000);
console.log('reopened A coin', (await pageHead(page))?.domains?.inventory?.wallets?.party?.coin);
// a reload while on B
await page.evaluate(async b => { await SillyTavern.getContext().openCharacterChat(b); }, B);
await sleep(1500);
const before = fileChat(B)?.length;
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await sleep(2000);
await page.evaluate(async b => { await SillyTavern.getContext().openCharacterChat(b); }, B);
await sleep(2000);
console.log('after reload, chat B on disk before reload', before, 'messages shown now', await page.evaluate(() => SillyTavern.getContext().chat.length));
console.log('errors', errors.slice(0, 10));
await browser.close();
