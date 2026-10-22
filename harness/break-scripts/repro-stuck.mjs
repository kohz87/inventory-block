// Repro: a reply whose <Changes> block is left open and is followed by NSD's hidden block.
// For each variant: fresh chat, kit character, one reply; how long SillyTavern stays "generating".
import fs from 'node:fs';
import { CHAR_NAME, OUT, clearQueue, connectMock, launch, queue, waitHost, ST_URL } from './lib.mjs';

const STORY = 'Lamplight leaks through the shutters of the Stray Oar.\n\nThe moment hangs there, waiting for you.';
const NSD = '\n\n<!--npc_state_delta\n{"npcs":[{"name":"Dov","present":true,"role":"hired spear","mood":"tired","relationshipImpact":"none","relationshipDelta":{"trust":-2,"affection":0,"desire":0,"tension":1}}],"relationshipsCovered":true}\n-->';
const LINES = '+ present Dov\n+ coin 3 | from: Dov';
const variants = {
    'closed+nsd': `${STORY}\n\n<Changes>\n${LINES}\n</Changes>${NSD}`,
    'open-only': `${STORY}\n\n<Changes>\n${LINES}`,
    'open+nsd': `${STORY}\n\n<Changes>\n${LINES}${NSD}`,
    'nsd-only': `${STORY}${NSD}`,
};
const only = process.argv[2];
const { browser, page } = await launch();
const logs = [];
page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()} ${m.text().slice(0, 300)}`); });
page.on('pageerror', e => logs.push(`pageerror ${e.message}`));
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
await connectMock(page);
const ev = (fn, a) => page.evaluate(fn, a);
const generating = () => ev(() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); });
const results = {};
for (const [name, reply] of Object.entries(variants)) {
    if (only && name !== only) continue;
    clearQueue();
    logs.length = 0;
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
    queue(reply);
    await page.fill('#send_textarea', 'I buy a round and listen to the talk.');
    const t0 = Date.now();
    await page.click('#send_but');
    await page.waitForTimeout(1500);
    let freed = null;
    while (Date.now() - t0 < 150000) { if (!(await generating())) { freed = Date.now() - t0; break; } await page.waitForTimeout(250); }
    const mes = await ev(() => SillyTavern.getContext().chat.at(-1)?.mes);
    results[name] = { freedAfterMs: freed, stillGenerating: freed === null, lastMes: mes, logs: [...logs].slice(0, 20) };
    console.log(name, JSON.stringify({ freedAfterMs: freed }), JSON.stringify(mes).slice(0, 600));
    for (const l of logs.slice(0, 12)) console.log('   ', l.slice(0, 250));
    if (freed === null) { await ev(() => window.jQuery('#mes_stop').trigger('click')); await page.waitForTimeout(2000); if (await generating()) { await page.reload(); await waitHost(page); } }
}
fs.writeFileSync(`${OUT}/run-repro-stuck.json`, JSON.stringify(results, null, 1));
await browser.close();
