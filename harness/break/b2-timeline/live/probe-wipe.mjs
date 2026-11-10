// Live probe: a UI command in chat A, then opening chat B while Story Block's 400 ms save is pending.
// When the save fires during SillyTavern's getChat (chat array already emptied, file name already B),
// it writes an empty chat over B's file.
import { launch, openPage, openNarrator, queue, clearQueue, chatId, cmd, fileChat, idle, sendText, sleep, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
clearQueue();
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
await openNarrator(page);
await cmd(page, 'party.create', { name: 'Bea', preset: 'fighter' });
queue(R('B reply one.', ['+ item Rope'])); await sendText(page, 'B one'); await idle(page);
queue(R('B reply two.', ['+ item Lamp'])); await sendText(page, 'B two'); await idle(page);
await sleep(1000);
const B = await chatId(page);
await openNarrator(page);
await cmd(page, 'party.create', { name: 'Ann', preset: 'fighter' });
queue(R('A reply one.', ['+ coin 5'])); await sendText(page, 'A one'); await idle(page);
await sleep(1000);
const A = await chatId(page);
// a slow server (remote SillyTavern, phone on mobile data): loading a chat takes 600 ms
if (process.env.SLOW) await page.route('**/api/chats/get', async route => { await sleep(600); await route.continue(); });
console.log('A', A, 'B', B, 'B on disk', fileChat(B).length, 'messages');
let wiped = null;
for (let d = Number(process.env.D0 ?? 340); d <= Number(process.env.D1 ?? 400) && !wiped; d += Number(process.env.DS ?? 4)) {
    await cmd(page, 'scene.present', { add: 'W1' + Date.now() });
    await sleep(d);
    await page.evaluate(async b => { await SillyTavern.getContext().openCharacterChat(b); }, B);
    await sleep(1500);
    const n = fileChat(B)?.length;
    console.log(`delay ${d}: B on disk ${n} messages, B shown ${await page.evaluate(() => SillyTavern.getContext().chat.length)}`);
    if (n === 0) { wiped = d; break; }
    await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, A);
    await sleep(1500);
}
if (wiped) {
    // The reader goes somewhere else and comes back (or reloads): B is read from disk.
    await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, A);
    await sleep(1500);
    await page.evaluate(async b => { await SillyTavern.getContext().openCharacterChat(b); }, B);
    await sleep(1500);
    console.log('reopened B: messages shown', await page.evaluate(() => SillyTavern.getContext().chat.length), 'on disk', fileChat(B)?.length);
}
console.log('errors', J(errors.filter(e => !/404/.test(e)).slice(0, 8)));
await browser.close();
