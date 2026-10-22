// Live: the chat save fails (server 500). Does Story Block notice? (no generation: UI commands only)
import { launch, openPage, openNarrator, chatId, cmd, pageHead, fileChat, headOf, sleep, J } from './lib.mjs';
const errors = [];
const browser = await launch();
const page = await openPage(browser, { errors });
await openNarrator(page);
const id = await chatId(page);
await cmd(page, 'party.create', { name: 'Ren', preset: 'fighter' });
await sleep(1500);
console.log('saved rev on disk', headOf(fileChat(id))?.meta?.rev);
let failed = 0;
await page.route('**/api/chats/save', async route => { failed++; await route.fulfill({ status: 500, body: '{"error":"disk full"}', contentType: 'application/json' }); });
const r = await cmd(page, 'scene.present', { add: 'W9' + Date.now() });
console.log('command', J(r));
await sleep(2000);
const toasts = await page.evaluate(() => [...document.querySelectorAll('#toast-container .toast')].map(n => n.textContent.trim()));
console.log('save requests refused by the server:', failed, '| toasts:', J(toasts));
console.log('page rev', (await pageHead(page))?.meta?.rev, 'disk rev', headOf(fileChat(id))?.meta?.rev);
await page.unroute('**/api/chats/save');
// nothing else happens in the chat; a later reload
await sleep(1500);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await sleep(1000);
await page.evaluate(async c => { const ctx = SillyTavern.getContext(); const i = ctx.characters.findIndex(x => x.name === 'The Narrator'); await ctx.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 1500)); await ctx.openCharacterChat(c); }, id);
await sleep(2000);
console.log('after reload: coin', J((await pageHead(page))?.domains?.scene?.present), '(the command added W9...)');
console.log('console errors', J(errors.filter(e => !/404|No message/.test(e)).slice(0, 4)));
await browser.close();
