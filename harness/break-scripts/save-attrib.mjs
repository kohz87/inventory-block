// Who saves the chat, and how often: replays N generated replies in a fresh chat and attributes every
// POST /api/chats/save to the extension on its JS call stack (CDP Network.requestWillBeSent initiator).
// usage: node save-attrib.mjs [replies=60] [seed=11]
import fs from 'node:fs';
import { CHAR_NAME, OUT, clearQueue, connectMock, launch, queue, waitHost, ST_URL } from './lib.mjs';
import { createGen } from './gen.mjs';

const N = Number(process.argv[2] ?? 60);
const gen = createGen(Number(process.argv[3] ?? 11));
const { browser, page } = await launch();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
let current = 'setup';
const tally = {};
const per = [];
const frameOwner = url => (/third-party\/Story_block/.test(url) ? 'story-block' : /third-party\/npc_state_delta/.test(url) ? 'npc-state-delta' : /third-party\/rpg_battle/.test(url) ? 'rpg-battle' : /third-party\/Story_director/.test(url) ? 'story-director' : null);
cdp.on('Network.requestWillBeSent', e => {
    if (!e.request.url.includes('/api/chats/save') && !e.request.url.includes('/api/files/upload')) return;
    const frames = [];
    for (let s = e.initiator?.stack; s; s = s.parent) frames.push(...(s.callFrames ?? []));
    const owners = [...new Set(frames.map(f => frameOwner(f.url)).filter(Boolean))];
    const kind = e.request.url.includes('chats/save') ? 'chat-save' : 'file-upload';
    const who = owners.length ? owners.join('+') : 'sillytavern';
    const key = `${kind} by ${who}`;
    tally[key] = (tally[key] ?? 0) + 1;
    per.at(-1)?.saves.push(key);
});
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
await connectMock(page);
clearQueue();
const ev = (fn, a) => page.evaluate(fn, a);
await ev(async CHAR_NAME => {
    const ctx = SillyTavern.getContext();
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
    await new Promise(r => setTimeout(r, 1000));
    await ctx.executeSlashCommandsWithOptions('/newchat');
    await new Promise(r => setTimeout(r, 2000));
}, CHAR_NAME);
await page.keyboard.press('Escape');
await ev(async () => {
    document.querySelector('.ss-dialog-close')?.click();
    const p = StoryBlock.sdk.query('creation.content').presets[0];
    await StoryBlock.sdk.command('creation.finish', { name: SillyTavern.getContext().name1, preset: p.id, race: p.race, talents: p.talents, points: p.points });
});
await page.waitForTimeout(1500);
const generating = () => ev(() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); });
for (let i = 0; i < N; i += 1) {
    const out = gen.next({});
    queue(out.reply);
    per.push({ reply: i + 1, lines: out.meta.lines, saves: [] });
    await page.fill('#send_textarea', out.user);
    await page.click('#send_but');
    await page.waitForTimeout(700);
    for (let t = 0; t < 200 && await generating(); t += 1) await page.waitForTimeout(150);
    // A reader click between replies (one UI command), as in play.
    if (i % 4 === 3) await ev(async () => { await StoryBlock.sdk.command('party.rest', { kind: 'short' }); });
    await page.waitForTimeout(900);
}
const summary = { replies: N, tally, perReplyMean: Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, Math.round(v / N * 100) / 100])), perReply: per };
fs.writeFileSync(`${OUT}/run-save-attrib.json`, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ tally, perReplyMean: summary.perReplyMean }, null, 1));
console.log(per.slice(0, 8).map(p => `${p.reply} lines=${p.lines}: ${p.saves.join(', ')}`).join('\n'));
await browser.close();
