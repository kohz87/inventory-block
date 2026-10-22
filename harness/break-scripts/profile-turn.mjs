// CPU profile of a few live replies on an existing soak chat: where capture and the prompt build spend time.
// usage: node profile-turn.mjs <chat id> [replies=4] [out.json]
// Prints the top functions by self time and by inclusive time (Story Suite files only), from Chromium's
// sampling profiler, between MESSAGE_RECEIVED and the turn event and over the whole send.
import fs from 'node:fs';
import { launchRaw } from './cdp-page.mjs';
import { CHAR_NAME, MOCK_Q, ST_URL, clearQueue, connectMock, queue, waitHost } from './lib.mjs';
import { createGen } from './gen.mjs';
const [chatId, n = '4', outFile] = process.argv.slice(2);
const { browser, page } = await launchRaw({ port: 9395 });
await page.goto(ST_URL);
await waitHost(page);
await connectMock(page);
await page.evaluate(async ({ chatId, CHAR_NAME }) => {
    const ctx = SillyTavern.getContext();
    await ctx.executeSlashCommandsWithOptions('/persona-set mode=temp Wessel');
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
    await new Promise(r => setTimeout(r, 1000));
    await ctx.openCharacterChat(chatId);
    await new Promise(r => setTimeout(r, 3000));
}, { chatId, CHAR_NAME });
console.log('messages', await page.evaluate(() => SillyTavern.getContext().chat.length));
await page.evaluate(() => {
    const s = window.__prof = { turns: [], recvAt: null };
    const ctx = SillyTavern.getContext();
    ctx.eventSource.makeFirst(ctx.eventTypes.MESSAGE_RECEIVED, () => { s.recvAt = performance.now(); });
    StoryBlock.sdk.on('turn', () => s.turns.push(performance.now() - s.recvAt));
});
clearQueue();
const gen = createGen(99);
await page.cdp('Profiler.enable');
await page.cdp('Profiler.setSamplingInterval', { interval: 200 });
await page.cdp('Profiler.start');
for (let i = 0; i < Number(n); i += 1) {
    const out = gen.next({});
    queue(out.reply);
    const before = await page.evaluate(() => window.__prof.turns.length);
    await page.fill('#send_textarea', out.user);
    await page.click('#send_but');
    await page.waitForFunction(b => window.__prof.turns.length > b && getComputedStyle(document.querySelector('#mes_stop')).display === 'none', before, { timeout: 120000 });
    await page.waitForTimeout(1500);
}
const { profile } = await page.cdp('Profiler.stop', {}, 300000);
console.log('capture ms', await page.evaluate(() => window.__prof.turns.map(Math.round)));
if (outFile) fs.writeFileSync(outFile, JSON.stringify(profile));
// Aggregate: self time per node, inclusive time per function (url:line:name).
const byId = new Map(profile.nodes.map(node => [node.id, node]));
const parent = new Map();
for (const node of profile.nodes) for (const c of node.children ?? []) parent.set(c, node.id);
const self = new Map();
const dt = profile.timeDeltas;
for (let i = 0; i < profile.samples.length; i += 1) self.set(profile.samples[i], (self.get(profile.samples[i]) ?? 0) + (dt[i] ?? 0));
const key = node => { const f = node.callFrame; return `${f.functionName || '(anon)'} ${f.url.replace(/^.*\/(third-party|scripts|lib)\//, '$1/')}:${f.lineNumber + 1}`; };
const selfBy = new Map(), incl = new Map();
for (const [id, us] of self) {
    const node = byId.get(id);
    selfBy.set(key(node), (selfBy.get(key(node)) ?? 0) + us);
    const seen = new Set();
    for (let cur = id; cur !== undefined; cur = parent.get(cur)) { const k = key(byId.get(cur)); if (seen.has(k)) continue; seen.add(k); incl.set(k, (incl.get(k) ?? 0) + us); }
}
const top = (m, filter = () => true, k = 25) => [...m].filter(([name]) => filter(name)).sort((a, b) => b[1] - a[1]).slice(0, k).map(([name, us]) => `${String(Math.round(us / 1000)).padStart(7)} ms  ${name}`).join('\n');
const total = [...self.values()].reduce((a, b) => a + b, 0);
console.log(`total sampled ${Math.round(total / 1000)} ms`);
console.log('--- self time\n' + top(selfBy));
console.log('--- inclusive, Story Suite files\n' + top(incl, name => /third-party\//.test(name), 40));
await browser.close();
