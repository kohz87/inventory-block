// Cell 2 probe: features off must be fully off in the live page, and back on must restore exactly.
// usage: ST_URL=... MOCK_Q=... MOCK_LOG=... CDP_PORT=9421 node probe-features.mjs <out-dir>
// Runs against an instance that already holds a st-beta chat (The Narrator, main chat open last).
import fs from 'node:fs';
import { launchRaw } from '../../smoke/cdp-page.mjs';

const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
const OUT = process.argv[2];
fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const CDP_PORT = Number(process.env.CDP_PORT ?? 9421);
const log = [];
const say = (...a) => { const line = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); log.push(line); console.log(line); fs.appendFileSync(`${OUT}/probe-log.txt`, `${line}\n`); };
const { page } = await launchRaw({ width: 1440, height: 900, port: CDP_PORT });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message}`));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`console.${m.type()} ${m.text().slice(0, 300)}`); });
const ev = (fn, a) => page.evaluate(fn, a);
const shot = name => page.screenshot({ path: `${OUT}/shots/${name}.png` }).catch(e => say('shot failed', name, e.message));
let qn = 0;
const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(4, '0')}.txt`, text);
const reqNames = () => fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
const HEADER = '[Story Suite: how this story is kept]';
const lastMain = () => { for (const n of reqNames().reverse()) { const b = JSON.parse(fs.readFileSync(`${MOCK_LOG}/${n}`, 'utf8')); if (b.messages?.some(m => m.role === 'system' && String(m.content).includes(HEADER))) return b; } return null; };
const staticOf = b => b?.messages.filter(m => m.role === 'system').map(m => String(m.content)).find(t => t.includes(HEADER)) ?? '';
const tailOf = b => (b?.messages ?? []).filter(m => m.role === 'system').map(m => String(m.content)).filter(t => !t.includes(HEADER)).join('\n---\n');
const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);

await page.goto(ST_URL);
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 120000 });
await page.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);
await ev(async url => {
    const $ = window.jQuery;
    $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#custom_api_url_text').val(url).trigger('input');
    $('#custom_model_id').val('mock-model').trigger('input');
    $('#stream_toggle').prop('checked', false).trigger('change');
    $('#api_button_openai').trigger('click');
    await new Promise(r => setTimeout(r, 3000));
}, MOCK_URL);
// Open the Narrator's most recent chat.
await ev(async () => {
    const ctx = SillyTavern.getContext();
    if (ctx.characters[ctx.characterId]?.name !== 'The Narrator') { await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 3000)); }
});
if (process.env.CHAT) await ev(async c => { await SillyTavern.getContext().openCharacterChat(c); await new Promise(r => setTimeout(r, 3500)); }, process.env.CHAT);
say('chat', await ev(() => ({ id: SillyTavern.getContext().getCurrentChatId(), len: SillyTavern.getContext().chat.length })));

const featureIds = await ev(() => StoryBlock.sdk.features().map(f => f.id));
say('features', await ev(() => StoryBlock.sdk.features().map(f => [f.id, f.on, f.prompt])));
// Setting a feature the way the reader does: the switch in the Features overview of the settings overlay.
async function setVia(id, on) {
    return ev(async ([i, v]) => {
        // Open the overlay through the bar's Suite button, then flip the switch, then close.
        let row = [...document.querySelectorAll('.story-suite-feature')].find(n => n.dataset.feature === i);
        let via = 'switch';
        if (!row) {
            const btn = [...document.querySelectorAll('button, [role=button], .menu_button')].find(b => /^\s*Suite\s*$/.test(b.textContent ?? ''));
            btn?.click(); await new Promise(r => setTimeout(r, 800));
            row = [...document.querySelectorAll('.story-suite-feature')].find(n => n.dataset.feature === i);
        }
        const input = row?.querySelector('input');
        if (input) { input.checked = v; input.dispatchEvent(new Event('change', { bubbles: true })); } else via = 'none';
        await new Promise(r => setTimeout(r, 900));
        return { via, now: StoryBlock.sdk.feature(i) };
    }, [id, on]);
}
const closeOverlay = () => ev(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); const x = [...document.querySelectorAll('.story-suite-overlay button, dialog button')].find(b => /close|×|✕/i.test(b.textContent + (b.getAttribute('aria-label') ?? ''))); x?.click(); await new Promise(r => setTimeout(r, 500)); });

const headJson = () => ev(() => JSON.stringify({ domains: StoryBlock.sdk.view().state?.domains }));
const pageFacts = () => ev(() => {
    const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
    const hud = [...document.querySelectorAll('[class*="hud"], [id*="hud"]')].filter(vis).map(n => (n.className || n.id).toString().slice(0, 60));
    const cards = [...document.querySelectorAll('#chat .story-suite-card, #chat [data-mount="card"], #chat [class*="ss-card"]')].filter(vis).length;
    document.querySelector('.story-suite-bar-story')?.click();
    const tabs = [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(n => n.textContent.trim());
    document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click();
    return { hud, cards, tabs, notes: [...document.querySelectorAll('#chat .story-suite-reply-note')].filter(vis).length };
});
const q = (name, args = {}) => ev(([n, a]) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return { threw: String(e.message) }; } }, [name, args]);

// 1) Everything off.
for (const id of featureIds) say('off', id, await setVia(id, false));
await closeOverlay();
await page.waitForTimeout(800);
const offFacts = await pageFacts();
say('page with all off', offFacts);
await shot('p-all-off');
const stateOff = await headJson();
say('queries while off', {
    days: await q('chronicle.days'), day: await q('chronicle.day', { day: 1 }), dayBoard: (await q('chronicle.dayBoard')) === null ? null : 'answers', dayFacts: (await q('chronicle.dayFacts')) === null ? null : 'answers',
    assist: await q('assist.status'),
});
const digestCmd = await ev(async () => { const r = await StoryBlock.sdk.command('chronicle.digest', { at: 1 }); return { ok: r.ok, code: r.code, message: r.message }; });
say('chronicle.digest command while off', digestCmd);
// A reply crossing a day while the digest is off: no digest, no [Yesterday] line, nothing thrown.
queue(R('You sleep through and wake the next evening.', ['! time +30h']));
const before = await ev(() => SillyTavern.getContext().chat.length);
await page.fill('#send_textarea', 'I sleep through to the next evening.');
await page.click('#send_but');
await page.waitForFunction(n => SillyTavern.getContext().chat.length >= n + 2 && !SillyTavern.getContext().chat.at(-1).is_user, before, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
queue(R('The lane is wet.'));
await page.fill('#send_textarea', 'I go out.');
await page.click('#send_but');
await page.waitForFunction(n => SillyTavern.getContext().chat.length >= n + 4 && !SillyTavern.getContext().chat.at(-1).is_user, before, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
const reqOff = lastMain();
const staticOffA = staticOf(reqOff);
say('tail while off has [Yesterday]/[Last day]:', /\[(Yesterday|Last day)\]/.test(tailOf(reqOff)), 'dice line:', /Dice for this reply/.test(tailOf(reqOff)));
say('digest receipts while off', await ev(() => StoryBlock.sdk.receipts().map(e => e.receipt).filter(r => r.type === 'chronicle.digest').length));
say('page after reply, all off', await pageFacts());
await shot('p-all-off-after-reply');
const stateOffAfter = await headJson();

// 2) Back on, one at a time, state compared with the moment before each switch.
for (const id of featureIds) {
    const s0 = await headJson();
    const r = await setVia(id, true);
    const s1 = await headJson();
    say('on', id, r, 'state untouched by the switch:', s0 === s1);
}
await closeOverlay();
await page.waitForTimeout(1000);
say('page with all on', await pageFacts());
await shot('p-all-on');
say('queries back on', { days: (await q('chronicle.days'))?.length ?? null });
queue(R('A bell rings somewhere.'));
const b2 = await ev(() => SillyTavern.getContext().chat.length);
await page.fill('#send_textarea', 'I listen.');
await page.click('#send_but');
await page.waitForFunction(n => SillyTavern.getContext().chat.length >= n + 2 && !SillyTavern.getContext().chat.at(-1).is_user, b2, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
const reqOn = lastMain();
say('static off vs on identical:', staticOffA === staticOf(reqOn), 'lengths', staticOffA.length, staticOf(reqOn).length);
say('digest receipts after on', await ev(() => StoryBlock.sdk.receipts().map(e => e.receipt).filter(r => r.type === 'chronicle.digest').map(r => r.summary)));
say('days after on', (await q('chronicle.days'))?.map?.(d => d.date + ': ' + d.line));
say('page after reply, all on', await pageFacts());
await shot('p-all-on-after-reply');
// rebuild == live
await ev(async () => { await SillyTavern.getContext().saveChat(); });
await page.waitForTimeout(1500);
const live = await headJson();
const chatId = await ev(() => SillyTavern.getContext().getCurrentChatId());
await page.reload();
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 120000 });
await page.waitForTimeout(2500);
await ev(async main => { const ctx = SillyTavern.getContext(); if (ctx.getCurrentChatId() !== main) { if (ctx.characters[ctx.characterId]?.name !== 'The Narrator') { await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); } await ctx.openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); } }, chatId);
const rebuilt = await headJson();
say('rebuild == live after off/on toggles:', live === rebuilt);
if (live !== rebuilt) { const a = JSON.parse(live).domains, b = JSON.parse(rebuilt).domains; say('differing', Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))); }
say('state after off toggles == before reply? (sanity)', stateOff === stateOffAfter);
say('errors', errors);
fs.writeFileSync(`${OUT}/probe-errors.txt`, errors.join('\n'));
process.exit(0);
