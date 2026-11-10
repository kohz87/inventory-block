// Repro: one reply whose NSD block names N new NPCs; then plain replies. How many extra model calls each
// reply triggers and how long the reader waits (send → generation over) per reply.
// usage: node repro-nsd.mjs [N=12] [delayMs=0]   (delay: the mock's side-call latency, via side-delay file)
import fs from 'node:fs';
import { CHAR_NAME, MOCK_LOG, OUT, clearQueue, connectMock, launch, queue, waitHost, ST_URL } from './lib.mjs';

const N = Number(process.argv[2] ?? 12);
const STORY = 'Lamplight leaks through the shutters of the Stray Oar.\n\nThe moment hangs there, waiting for you.';
const npc = i => ({ name: `Dockhand ${String.fromCharCode(65 + (i % 26))}${i}`, present: true, role: 'dockhand', mood: 'tired', relationshipImpact: 'none', relationshipDelta: { trust: 0, affection: 0, desire: 0, tension: 0 } });
const CROWD = `${STORY}\n\n<Changes>\n+ present Dov\n</Changes>\n\n<!--npc_state_delta\n${JSON.stringify({ npcs: Array.from({ length: N }, (_, i) => npc(i)), relationshipsCovered: true })}\n-->`;
const PLAIN = `${STORY}\n\n<Changes>\n! time +20m\n</Changes>`;
const served = () => { try { return fs.readFileSync(`${MOCK_LOG}/served.txt`, 'utf8').split('\n').filter(Boolean); } catch { return []; } };

const { browser, page } = await launch();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
await connectMock(page);
const ev = (fn, a) => page.evaluate(fn, a);
const generating = () => ev(() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); });
clearQueue();
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
const rows = [];
for (const [i, reply] of [CROWD, PLAIN, PLAIN, PLAIN].entries()) {
    queue(reply);
    const before = served().length;
    await page.fill('#send_textarea', `Turn ${i + 1}.`);
    const t0 = Date.now();
    await page.click('#send_but');
    await page.waitForTimeout(800);
    while (Date.now() - t0 < 300000 && await generating()) await page.waitForTimeout(200);
    const calls = served().slice(before);
    const row = { reply: i + 1, kind: i ? 'plain' : `block with ${N} NPCs`, readerWaitMs: Date.now() - t0, modelCalls: calls.length, backfillCalls: calls.filter(l => l.includes('backfill')).length, scannerCalls: calls.filter(l => l.includes('dossier scanner')).length };
    rows.push(row);
    console.log(JSON.stringify(row));
    await page.waitForTimeout(500);
}
const npcs = await ev(async () => { try { const r = StoryBlock.sdk.query('npc.present'); return Array.isArray(r) ? r.length : JSON.stringify(r).slice(0, 200); } catch (e) { return e.message; } });
console.log('npc.present answers', npcs);
fs.writeFileSync(`${OUT}/run-repro-nsd-${N}.json`, JSON.stringify(rows, null, 1));
await browser.close();
