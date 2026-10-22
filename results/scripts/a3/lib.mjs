// a3 (v2 heads pass 2) live driver: Playwright + the harness's mock model. Ports 8301/5301.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
export const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
export const ROOT = `${SP}/inst/a3`;
export const MOCK_Q = `${ROOT}/q`, MOCK_LOG = `${ROOT}/log`, ST_URL = 'http://127.0.0.1:8301/', MOCK_URL = 'http://127.0.0.1:5301/v1';
export const OUT = '/home/user/cell/a3/out';
export const EXT = `${ROOT}/data/default-user/extensions`;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
let qn = 0;
export const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(4, '0')}.txt`, text);
export const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
export function setExts(list) {
  for (const r of ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta']) { try { fs.unlinkSync(`${EXT}/${r}`); } catch {} }
  for (const r of list) fs.symlinkSync(`/home/user/cell/a3/${r}`, `${EXT}/${r}`);
}
export async function open({ width = 1440, exts = null } = {}) {
  if (exts) setExts(exts);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, acceptDownloads: true, isMobile: width < 500, hasTouch: width < 500 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ST_URL }).catch(() => {});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror ${e.message} @ ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console.error ${m.text().slice(0, 400)} @ ${m.location()?.url?.split('/').slice(-2).join('/')}`); });
  page.on('dialog', d => { errors.push(`DIALOG ${d.type()} ${d.message().slice(0, 100)}`); console.log('DIALOG', d.type()); (d.type() === 'beforeunload' ? d.accept() : d.dismiss()).catch(() => {}); });
  await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext && !!document.querySelector('#send_textarea'), null, { timeout: 90000 });
  await welcome(page);
  await page.waitForFunction(() => SillyTavern.getContext().characters.length > 0, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => { if (!SillyTavern.getContext().characters.length) await SillyTavern.getContext().getCharacters(); });
  if (!(await page.evaluate(() => SillyTavern.getContext().characters.length))) await page.evaluate(`(async () => { ${fs.readFileSync(new URL('./mkchars.js', import.meta.url), 'utf8')} })()`);
  await page.waitForFunction(() => window.StoryBlock?.apiVersion === 2, null, { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  const ev = (fn, a) => page.evaluate(fn, a);
  await connect(page);
  return { browser, ctx, page, errors, ev };
}

export async function welcome(page) {
  for (let i = 0; i < 20; i++) {
    const r = await page.evaluate(() => { const pop = [...document.querySelectorAll('dialog[open], .popup')].find(d => /Welcome to SillyTavern/.test(d.innerText)); if (!pop) return 'none'; const inp = pop.querySelector('input[type=text], input:not([type])'); if (inp && !inp.value) { inp.value = 'User'; inp.dispatchEvent(new Event('input', { bubbles: true })); } const ok = pop.querySelector('.popup-button-ok, .menu_button_icon.popup-button-ok') || [...pop.querySelectorAll('.menu_button, button')].find(b => /ok|save|continue|start/i.test(b.textContent)); ok?.click(); return 'clicked'; }).catch(() => 'err');
    if (r === 'none' && i > 2) return; await sleep(500);
  }
}
export async function connect(page) {
  return page.evaluate(async url => {
    const $ = window.jQuery; const W = ms => new Promise(r => setTimeout(r, ms));
    if (SillyTavern.getContext().onlineStatus !== 'no_connection') return SillyTavern.getContext().onlineStatus;
    $('#main_api').val('openai').trigger('change'); await W(500);
    $('#chat_completion_source').val('custom').trigger('change'); await W(500);
    $('#custom_api_url_text').val(url).trigger('input');
    $('#custom_model_id').val('mock-model').trigger('input');
    $('#stream_toggle').prop('checked', false).trigger('change');
    $('#api_button_openai').trigger('click');
    for (let i = 0; i < 20 && SillyTavern.getContext().onlineStatus === 'no_connection'; i++) await W(500);
    return SillyTavern.getContext().onlineStatus;
  }, MOCK_URL);
}
export async function newChat(page, name = 'The Narrator') {
  return page.evaluate(async n => {
    const ctx = SillyTavern.getContext();
    const i = ctx.characters.findIndex(c => c.name === n);
    if (String(ctx.characterId) !== String(i)) { await ctx.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 2500)); }
    await ctx.executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000));
    return SillyTavern.getContext().getCurrentChatId();
  }, name);
}
export async function send(page, text, reply, wait = 30000) {
  if (reply !== null) queue(reply);
  const before = await page.evaluate(() => SillyTavern.getContext().chat.length);
  await page.evaluate(t => { const el = document.querySelector('#send_textarea'); el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#send_but').click(); }, text);
  const ok = await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; const stop = document.querySelector('#mes_stop'); return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes && !(stop && getComputedStyle(stop).display !== 'none'); }, before, { timeout: wait }).then(() => true, () => false);
  await sleep(1800);
  return ok;
}
export const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);
// overflow + blank check
export const overflow = page => page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: innerWidth, over: document.scrollingElement.scrollWidth > innerWidth }));
export const ourErrors = errs => errs.filter(l => !/favicon|Story String Validation|Settings not ready|DIALOG|Failed to load resource: the server responded with a status of 404/.test(l));

export async function reloadReady(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.StoryBlock?.apiVersion === 2 && !!document.querySelector('#send_textarea'), null, { timeout: 90000 });
  await welcome(page);
  await page.waitForFunction(() => SillyTavern.getContext().characters.length > 0, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => { if (!SillyTavern.getContext().characters.length) await SillyTavern.getContext().getCharacters(); });
  await sleep(2500); await connect(page);
}
