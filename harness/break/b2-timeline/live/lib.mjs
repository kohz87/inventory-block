// b2-timeline live helpers: SillyTavern 1.19 on 8181, mock model on 5181.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const B = process.env.B2ROOT ?? '/home/user/_break/b2-timeline';
const { createStore } = await import(`${B}/Story_block/src/v2/store.js`);
export { createStore };

export const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
export const ST_URL = 'http://127.0.0.1:8181/';
export const MOCK_URL = 'http://127.0.0.1:5181/v1';
export const MOCK_Q = `${SP}/inst/b2-timeline/q`;
export const MOCK_LOG = `${SP}/inst/b2-timeline/log`;
export const CHATS = `${SP}/inst/b2-timeline/data/default-user/chats/The Narrator`;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
let qn = 0;
export const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now())}-${String(++qn).padStart(4, '0')}.txt`, text);
export const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
export const J = v => JSON.stringify(v ?? null);

export async function launch() {
    return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
}

/** A page with ST loaded, Story Block v2 up, the mock API connected. `errors` collects console errors. */
export async function openPage(browser, { stream = false, errors = [], label = 'p1' } = {}) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(`${label} pageerror ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${label} console.error ${m.text().slice(0, 300)}`); });
    await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
    await page.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.evaluate(async ([url, stream]) => {
        const $ = window.jQuery;
        if ($('#main_api').val() !== 'openai') { $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 400)); }
        $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 300));
        $('#custom_api_url_text').val(url).trigger('input');
        $('#custom_model_id').val('mock-model').trigger('input');
        $('#stream_toggle').prop('checked', stream).trigger('change');
        $('#api_button_openai').trigger('click');
        await new Promise(r => setTimeout(r, 2000));
    }, [MOCK_URL, stream]);
    return page;
}

export async function setStream(page, on) {
    await page.evaluate(on => { window.jQuery('#stream_toggle').prop('checked', on).trigger('change'); }, on);
}

export async function openNarrator(page, { newChat = true } = {}) {
    await page.evaluate(async newChat => {
        const ctx = SillyTavern.getContext();
        const id = ctx.characters.findIndex(c => c.name === 'The Narrator');
        if (String(ctx.characterId) !== String(id)) { await ctx.selectCharacterById(String(id)); await new Promise(r => setTimeout(r, 1500)); }
        if (newChat) { await ctx.executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 2000)); }
    }, newChat);
}

export const chatId = page => page.evaluate(() => SillyTavern.getContext().getCurrentChatId());
export const chatLen = page => page.evaluate(() => SillyTavern.getContext().chat.length);
export const liveChat = page => page.evaluate(() => JSON.parse(JSON.stringify(SillyTavern.getContext().chat)));
export const pageHead = page => page.evaluate(() => JSON.parse(JSON.stringify(StoryBlock.sdk.view().state ?? null)));
export const cmd = (page, type, payload = {}) => page.evaluate(async ([t, p]) => {
    try { const r = await StoryBlock.sdk.command(t, p); return r.ok ? { ok: true, rev: r.receipt.rev, id: r.receipt.id } : { ok: false, code: r.code, message: r.message }; } catch (e) { return { ok: false, threw: e.message }; }
}, [type, payload]);
export const query = (page, name, args) => page.evaluate(([n, a]) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return { err: e.message }; } }, [name, args]);
export const generating = page => page.evaluate(() => {
    const send = document.querySelector('#send_but');
    const stop = document.querySelector('#mes_stop');
    return { stopShown: !!stop && getComputedStyle(stop).display !== 'none', sendShown: !!send && getComputedStyle(send).display !== 'none' };
});

/** The chat file on disk as SillyTavern saved it (messages only), or null. */
export function fileChat(id) {
    const path = `${CHATS}/${id}.jsonl`;
    if (!fs.existsSync(path)) return null;
    const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    return lines.slice(1);
}
export const headOf = messages => (messages ? createStore({ chat: () => messages, save: async () => {} }).head() : null);
export const atOf = (messages, i) => createStore({ chat: () => messages, save: async () => {} }).at(i);

/** Waits until the page is idle: not generating and the chat length stable. */
export async function idle(page, { timeout = 20000 } = {}) {
    const t0 = Date.now();
    let last = -1, stable = 0;
    while (Date.now() - t0 < timeout) {
        const s = await page.evaluate(() => ({ len: SillyTavern.getContext().chat.length, gen: getComputedStyle(document.querySelector('#mes_stop')).display !== 'none' })).catch(() => ({ len: -2, gen: true }));
        if (!s.gen && s.len === last) { if (++stable >= 3) return true; } else stable = 0;
        last = s.len;
        await sleep(150);
    }
    return false;
}

export const uiState = page => page.evaluate(() => ({
    send: document.querySelector('#send_but')?.className, stop: getComputedStyle(document.querySelector('#mes_stop')).display,
    dialog: document.querySelector('.ss-dialog') ? document.querySelector('.ss-dialog-title')?.textContent : null,
    notice: document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false ? document.querySelector('#story_suite_v2_bar .story-suite-notice-text')?.textContent : null,
    popup: [...document.querySelectorAll('dialog[open], .popup')].map(n => n.textContent.trim().slice(0, 80)).join(' | '),
    toasts: [...document.querySelectorAll('#toast-container .toast')].map(n => n.textContent.trim().slice(0, 120)),
    last: (() => { const c = SillyTavern.getContext().chat; const m = c.at(-1); return m ? `${m.is_user ? 'U' : 'C'} ${String(m.mes).slice(0, 60)}` : null; })(),
    len: SillyTavern.getContext().chat.length,
})).catch(e => ({ err: e.message }));
export async function sendText(page, text) {
    await page.fill('#send_textarea', text);
    try { await page.click('#send_but', { timeout: 8000 }); } catch (e) { throw new Error(`send button not clickable: ${JSON.stringify(await uiState(page))}`); }
}
