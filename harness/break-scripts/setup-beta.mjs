// One-time setup for the beta soak (raw CDP, no Playwright): the Ersveil pack imported through the Packs
// panel of the Story Suite settings (its "Import pack file" input, filled like a file chooser), an "Ersveil"
// narrator card with a Bluewatch greeting, persona Wessel. Prints what the panel said and the installed packs.
import { CHAR_NAME, PACK, ST_URL, connectMock, waitHost } from './lib.mjs';
import { launchRaw } from './cdp-page.mjs';

const FIRST = [
    'Bluewatch wakes grey. Rain needles off the palisade, the brazier smoke lies flat over the roofs, and the chain across the river-gate groans as the first barge noses up to the Inspection Quay.',
    'You came up the river road with a walking stick, a pack and a name the Guild clerk wrote down without looking up. Fenna, the clerk, said there is work for anyone who will take twenty marks a day and not ask why the last one left.',
    'The Guild office is one room, a board and a counter scarred by a hundred knives. Three notices are pinned to the board. Fenna is watching you read them.',
].join('\n\n');
const { browser, page } = await launchRaw({ port: 9393 });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message.slice(0, 300)}`));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`console.${m.type()} ${m.text().slice(0, 300)}`); });
await page.goto(ST_URL);
await waitHost(page);
await connectMock(page);

// The Packs panel: Story Suite settings (wand menu item), then its file input.
const before = await page.evaluate(() => [...document.querySelectorAll('.ss-packs-row')].map(r => r.dataset.packId));
await page.evaluate(() => document.querySelector('#extensionsMenu .list-group-item:last-child')?.click());
await page.evaluate(() => { const item = [...document.querySelectorAll('#extensionsMenu .list-group-item')].find(i => /story suite/i.test(i.textContent)); item?.click(); });
await page.waitForFunction(() => Boolean(document.querySelector('.ss-packs-file')), null, { timeout: 15000 }).catch(async () => {
    // The panel may sit in a collapsed section: open every section header of the settings dialog.
    await page.evaluate(() => { for (const h of document.querySelectorAll('[class*="settings"] summary, [class*="section"] summary')) h.click(); });
});
const found = await page.evaluate(() => ({ file: Boolean(document.querySelector('.ss-packs-file')), dialogs: [...document.querySelectorAll('dialog[open], .popup')].map(d => d.className).slice(0, 5) }));
console.log('packs panel', JSON.stringify(found), 'rows before', before);
if (found.file) {
    await page.setInputFiles('.ss-packs-file', PACK);
    await page.waitForFunction(() => /Installed|already installed|not imported|Updated/.test(document.querySelector('.ss-packs-message')?.textContent ?? ''), null, { timeout: 20000 }).catch(() => {});
    console.log('panel says:', await page.evaluate(() => ({ message: document.querySelector('.ss-packs-message')?.textContent, errors: [...document.querySelectorAll('.ss-packs-errors li')].map(l => l.textContent), rows: [...document.querySelectorAll('.ss-packs-row')].map(r => r.textContent.slice(0, 160)) })));
}
await page.keyboard.press('Escape');

const res = await page.evaluate(async ({ FIRST, CHAR_NAME }) => {
    const ctx = SillyTavern.getContext();
    const out = {};
    if (!ctx.characters.some(c => c.name === CHAR_NAME)) {
        const fd = new FormData();
        fd.append('ch_name', CHAR_NAME);
        fd.append('description', '{{char}} narrates Ersveil and plays every person in it except {{user}}.');
        fd.append('first_mes', FIRST);
        for (const k of ['personality', 'scenario', 'mes_example', 'creator_notes', 'tags']) fd.append(k, '');
        fd.append('talkativeness', '0.5'); fd.append('fav', 'false');
        const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
        const r = await fetch('/api/characters/create', { method: 'POST', headers, body: fd });
        out.create = `${r.status} ${(await r.text()).slice(0, 100)}`;
    }
    ctx.powerUserSettings.personas['user-default.png'] = 'Wessel';
    ctx.saveSettingsDebounced();
    await new Promise(r => setTimeout(r, 2000));
    return out;
}, { FIRST, CHAR_NAME });
console.log(JSON.stringify(res));
await page.reload();
await waitHost(page);
console.log('characters', await page.evaluate(() => SillyTavern.getContext().characters.map(c => c.name).join(',')));
console.log('packs', JSON.stringify(await page.evaluate(() => SillyTavern.getContext().extensionSettings.storySuite?.packs?.map(p => `${p.id}@${p.version} enabled=${p.enabled}`))));
console.log('errors', errors.join('\n'));
await browser.close();
