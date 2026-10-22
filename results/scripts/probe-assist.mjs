// story-block.preroll + story-block.extractor on; their extra model calls answer garbage, huge text or markup.
import fs from 'node:fs';
import { launch, waitHost, connect, ST_URL, shot, j, queue, clearQueue, MOCK_LOG } from './common.mjs';
import { openChat, setFeaturesViaOverlay } from './lib-ui.mjs';
const { chat } = JSON.parse(fs.readFileSync(new URL('./chat.json', import.meta.url)));
const { browser, page, errors } = await launch();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page); await connect(page); await openChat(page, chat);
console.log(j(await setFeaturesViaOverlay(page, { 'story-block.hud': true, 'story-block.cards': true, 'story-block.preroll': true, 'story-block.extractor': true })));
const served = () => fs.readFileSync(`${MOCK_LOG}/served.txt`, 'utf8').trim().split('\n').length;
async function round(tag, answers, text) {
    for (const a of answers) queue(a);
    const e0 = errors.length; const s0 = served();
    const before = await page.evaluate(() => SillyTavern.getContext().chat.length);
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    const t0 = Date.now();
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user; }, before, { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(6000);
    const r = await page.evaluate(() => {
        const c = SillyTavern.getContext().chat; const last = c.at(-1);
        const mes = [...document.querySelectorAll('#chat .mes')].at(-1);
        return { len: c.length, lastIsUser: !!last?.is_user, mes: String(last?.mes ?? '').slice(0, 80), receipts: (last?.extra?.storySuite?.receipts ?? []).map(r => r.type), notes: [...(mes?.querySelectorAll('.story-suite-reply-note') ?? [])].map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 160)), card: mes?.querySelector('.ss-card')?.innerText?.replace(/\s+/g, ' ').slice(0, 200) ?? null, sendVisible: getComputedStyle(document.querySelector('#send_but')).display !== 'none', stopVisible: getComputedStyle(document.querySelector('#mes_stop')).display !== 'none', xss: window.__xss ?? null, bold: [...(mes?.querySelectorAll('.ss-card b, .story-suite-reply-note b') ?? [])].map(b => b.textContent) };
    });
    console.log(tag, j({ ...r, ms: Date.now() - t0, requests: served() - s0, left: fs.readdirSync(process.env.MOCK_Q).length, errors: errors.slice(e0).filter(e => !/dossier scan failed|404/.test(e)) }));
    await shot(page, `assist-${tag}`);
    return r;
}
// [classifier answer, story reply, extractor answer]
const R3 = async (tag, cls, story, ext, text) => { clearQueue(); queue(cls, 'cls'); queue(ext, 'ext'); return round(tag, [story], text); };
await R3('garbage', '{{{ not json', 'You haul yourself up the wet palisade. A Rusty Key glints in the mud, and you pocket it.', '<<<garbage>>> ] } ~ item ???', 'I try to climb the wet palisade, risky as it is.');
const huge = '+ item Pebble | qty: 1\n'.repeat(20000);
await R3('huge', huge, 'You find a fallen purse with 30 marks inside and keep it.', huge, 'I search the mud by the wall, carefully.');
await R3('markup', '{"risky": true, "skill": "<img src=x onerror=\\"window.__xss=1\\">", "stat": "<b>DEX</b>"}', 'You trade a joke with the guard; he tosses you a trinket.', '+ item <img src=x onerror="window.__xss=1"><b>Trinket</b> | qty: 1\n+ coin 999999 | note: <b>rich</b>\n~ place <b>Nowhere</b>', 'I try to pickpocket the guard while joking.');
await R3('http500', '@@status 500\nboom', 'The rain starts. Nothing else happens; you find a Copper Ring.', '@@status 500\nboom', 'I wait under the eaves, risky or not.');
await setFeaturesViaOverlay(page, { 'story-block.hud': true, 'story-block.cards': true, 'story-block.preroll': false, 'story-block.extractor': false });
await browser.close();
