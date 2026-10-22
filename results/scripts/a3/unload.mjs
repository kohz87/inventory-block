// Unload saving: a CJK chat whose save body is > 64 KiB as UTF-8 but < 61440 UTF-16 units.
// Expect: beforeunload asks (body too big for keepalive) or the keepalive save lands. Actual: see log.
import fs from 'node:fs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { open, newChat, send, R, sleep, ourErrors, OUT, clearQueue, ST_URL, connect } from './lib.mjs';
const MODE = process.argv[2] || 'cjk';
clearQueue();
const { browser, ctx, page, errors, ev } = await open({ width: 1440, exts: ['Story_block'] });
const log = (...a) => console.log(`[unload-${MODE}]`, ...a);
// 0) the browser's own rule
log('raw keepalive 90KB utf8 / 30k units:', await ev(async () => { const body = JSON.stringify({ t: '雨'.repeat(30000) }); try { const r = await fetch('/version', { method: 'POST', body, keepalive: true }); return 'sent ' + r.status; } catch (e) { return 'REJECTED ' + e.message; } }));
const chatId = await newChat(page);
const unit = MODE === 'cjk' ? '雨の中、ミラは港の灯りを見つめていた。' : 'In the rain Mira watched the harbour lights. ';
const per = MODE === 'cjk' ? 450 : 200;  // cjk: ~9k units per reply (~27 KB); ascii: ~9k units
for (let i = 0; i < 3; i++) log('reply', i, await send(page, `go ${i}`, R(unit.repeat(per), ['+ item Rope | qty: 1'])));
const sizes = await ev(() => { const c = SillyTavern.getContext(); const t = JSON.stringify({ chat: [c.chatMetadata ?? {}, ...c.chat] }); return { units: t.length, bytes: new TextEncoder().encode(t).length }; });
log('chat body', JSON.stringify(sizes), 'keepalive limit 61440 units / 65536 bytes');
await sleep(3000); // let saves settle
const saves = []; page.on('request', r => { if (r.url().includes('/api/chats/save')) saves.push({ len: (r.postData() || '').length }); });
page.on('requestfailed', r => { if (r.url().includes('/api/chats/save')) saves.push({ failed: r.failure()?.errorText }); });
const dialogs = []; page.removeAllListeners('dialog'); page.on('dialog', d => { dialogs.push(d.type()); d.accept().catch(() => {}); });
// dirty the state, then close at once
const r = await ev(() => { const x = StoryBlock.sdk.command('scene.present', { add: 'UnloadMark' }); return JSON.stringify(x)?.slice(0, 100); });
log('command', r);
await page.close({ runBeforeUnload: true }); await sleep(2500);
log('dialogs on close', JSON.stringify(dialogs), 'save requests', JSON.stringify(saves));
// reopen and read the chat file from the server
const p2 = await ctx.newPage(); await p2.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await p2.waitForFunction(() => window.StoryBlock?.apiVersion === 2 && SillyTavern.getContext().characters.length, null, { timeout: 90000 }); await sleep(3000);
const kept = await p2.evaluate(async id => { const c = SillyTavern.getContext(); const i = c.characters.findIndex(x => x.name === 'The Narrator'); await c.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 2500)); await c.openCharacterChat(id); await new Promise(r => setTimeout(r, 3000)); return JSON.stringify(StoryBlock.sdk.view().state?.domains?.scene ?? null).includes('UnloadMark'); }, chatId);
log('UnloadMark kept after reopen:', kept);
log('ERRORS', JSON.stringify(ourErrors(errors), null, 1));
await browser.close();
