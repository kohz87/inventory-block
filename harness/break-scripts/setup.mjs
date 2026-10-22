// One-time setup: Ersveil pack installed, an "Ersveil" narrator card with Wessel's first message,
// persona Wessel. Then opens a new chat, creates the character from the kit preset, sends one reply and
// dumps the request (static + tail) so the generator knows the grammar.
import fs from 'node:fs';
import { CHAR_NAME, OUT, PACK, SP, clearQueue, connectMock, launch, queue, readReq, reqNums, waitHost, ST_URL } from './lib.mjs';

const FIRST = fs.readFileSync(`${SP}/lore-ersveil/Wessel_First_Message_Bluewatch.txt`, 'utf8').split('<!--')[0].trim().replace('twenty copper a day', 'twenty marks a day');
const { browser, page } = await launch();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message}`));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`console.${m.type()} ${m.text().slice(0, 300)}`); });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
await connectMock(page);
const packText = fs.readFileSync(PACK, 'utf8');
const res = await page.evaluate(async ({ packText, FIRST, CHAR_NAME }) => {
    const out = {};
    const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
    const list = mod.packs.list();
    out.before = list.map(p => `${p.id}:${p.enabled}`);
    if (!list.some(p => p.id?.includes('ersveil'))) {
        out.install = await mod.packs.install(packText, { source: 'file', origin: 'pack.json' });
        if (!out.install.ok) {
            // B-b6-soak-1 workaround: the live capability list is wrong; store the entry as install() would.
            const raw = JSON.parse(packText);
            const es = SillyTavern.getContext().extensionSettings;
            es.storySuite ??= {}; es.storySuite.packs ??= [];
            es.storySuite.packs.push({ id: raw.id, version: raw.version, enabled: true, source: 'file', origin: 'pack.json', pack: raw });
            SillyTavern.getContext().saveSettingsDebounced();
            await new Promise(r => setTimeout(r, 2500));
        }
    }
    out.after = mod.packs.list().map(p => `${p.id}:${p.enabled}`);
    const ctx = SillyTavern.getContext();
    if (!ctx.characters.some(c => c.name === CHAR_NAME)) {
        const fd = new FormData();
        fd.append('ch_name', CHAR_NAME);
        fd.append('description', '{{char}} narrates Ersveil and plays every person in it except {{user}}.');
        fd.append('first_mes', FIRST);
        fd.append('personality', ''); fd.append('scenario', ''); fd.append('mes_example', '');
        fd.append('creator_notes', ''); fd.append('tags', ''); fd.append('talkativeness', '0.5'); fd.append('fav', 'false');
        const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
        const r = await fetch('/api/characters/create', { method: 'POST', headers, body: fd });
        out.create = `${r.status} ${await r.text()}`;
        await ctx.getCharacters?.();
    }
    return out;
}, { packText, FIRST, CHAR_NAME });
console.log(JSON.stringify(res));
await page.reload({ waitUntil: 'domcontentloaded' });
await waitHost(page);
console.log(await page.evaluate(() => SillyTavern.getContext().characters.map(c => c.name).join(',')));
console.log('errors', errors.join('\n'));
await browser.close();
