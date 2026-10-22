// Live probe: a UI command, then the chat is deleted while Story Block's save is pending.
import fs from 'node:fs';
import { launch, openPage, openNarrator, queue, clearQueue, chatId, cmd, fileChat, idle, sendText, sleep, J, CHATS } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
clearQueue();
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
for (const d of [0, 150, 300, 380]) {
    await openNarrator(page);
    await cmd(page, 'party.create', { name: 'Del', preset: 'fighter' });
    queue(R('D reply.', ['+ coin 5'])); await sendText(page, 'D one'); await idle(page);
    await sleep(800);
    const D = await chatId(page);
    await cmd(page, 'scene.present', { add: 'W2' + Date.now() });
    await sleep(d);
    await page.evaluate(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/delchat'); });
    await sleep(2500);
    const exists = fs.existsSync(`${CHATS}/${D}.jsonl`);
    console.log(`delay ${d}: deleted chat file exists afterwards: ${exists}${exists ? ` (${fileChat(D).length} messages)` : ''}; now on ${await chatId(page)}`);
}
console.log('errors', J(errors.filter(e => !/404/.test(e)).slice(0, 8)));
await browser.close();
