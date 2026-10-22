// Shared live driver for the UI breaker (Story Suite v2 beta). Based on harness/smoke/st-v2-alpha2.mjs.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
export const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
export const SHOTS = new URL('../shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });
let qn = 0;
export const queue = (text, kind = '') => fs.writeFileSync(`${MOCK_Q}/${kind ? `${kind}-` : ''}${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(4, '0')}.txt`, text);
export const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
export const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);
export const j = v => JSON.stringify(v);
export async function launch({ width = 1440, height = 900, reducedMotion = 'no-preference', mobile = false } = {}) {
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror ${e.message} ${String(e.stack ?? '').split('\n').slice(1, 3).join(' ')}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console.error ${m.text().slice(0, 400)}`); });
    return { browser, context, page, errors };
}
export const ev = (page, fn, a) => Promise.race([page.evaluate(fn, a), new Promise((_, rej) => setTimeout(() => rej(new Error('eval timeout')), 90000))]);
export async function waitHost(page) {
    await page.waitForFunction(() => window.SillyTavern?.getContext?.() && window.StoryBlock?.apiVersion === 2 && document.querySelector('#story_suite_v2_bar'), null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) if (/Welcome to SillyTavern/.test(d.innerText)) (d.querySelector('.popup-button-ok, .popup-button-close') ?? d).click?.(); });
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => {
        const ctx = SillyTavern.getContext();
        if (ctx.characters.some(c => c.name === 'The Narrator')) return;
        const form = new FormData();
        form.append('ch_name', 'The Narrator');
        form.append('description', 'The narrator of a low-fantasy frontier story.');
        form.append('first_mes', 'The barge bumps the quay at Bluewatch.');
        for (const k of ['personality', 'scenario', 'mes_example', 'creator_notes', 'tags']) form.append(k, '');
        form.append('talkativeness', '0.5'); form.append('fav', 'false');
        const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
        await fetch('/api/characters/create', { method: 'POST', headers, body: form });
        await ctx.getCharacters?.();
    });
    await page.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
}
export async function connect(page) {
    await page.evaluate(async url => {
        const $ = window.jQuery;
        $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 400));
        $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 400));
        $('#custom_api_url_text').val(url).trigger('input');
        $('#custom_model_id').val('mock-model').trigger('input');
        $('#stream_toggle').prop('checked', false).trigger('change');
        $('#api_button_openai').trigger('click');
        await new Promise(r => setTimeout(r, 2500));
    }, MOCK_URL);
}
export async function narrator(page) {
    await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); });
}
export async function newChat(page) {
    await page.evaluate(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 2500)); });
    return page.evaluate(() => SillyTavern.getContext().getCurrentChatId());
}
export async function send(page, text, reply, { wait = 20000 } = {}) {
    if (reply !== null) queue(reply);
    const before = await page.evaluate(() => SillyTavern.getContext().chat.length);
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes; }, before, { timeout: wait }).catch(() => {});
    await page.waitForTimeout(2000);
}
export const cmd = (page, type, payload) => page.evaluate(async ([t, p]) => { try { const r = await StoryBlock.sdk.command(t, p); return r.ok ? { ok: true, summary: r.receipt.summary } : { ok: false, code: r.code, message: r.message }; } catch (e) { return { threw: e.message }; } }, [type, payload]);
export const shot = async (page, name) => { await page.screenshot({ path: `${SHOTS}/${name}.png` }); return `results/shots/${name}.png`; };
