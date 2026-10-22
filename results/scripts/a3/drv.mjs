// a3 live driver library: attach to the persistent chromium, drive ST + Story Suite, audit the UI.
import fs from 'node:fs';
import { attach } from './cdp.mjs';
export const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
export const ROOT = `${SP}/inst/a3`;
export const MOCK_Q = `${ROOT}/q`, MOCK_LOG = `${ROOT}/log`, ST_URL = 'http://127.0.0.1:8213/';
export const OUT = '/home/user/cell/out/a3';
export const ERRLOG = `${OUT}/errors.log`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
export { sleep };
let qn = 0;
export const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(4, '0')}.txt`, text);
export const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
export const reqNums = () => fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
export const readReq = n => JSON.parse(fs.readFileSync(`${MOCK_LOG}/req-${n}.json`, 'utf8'));
export const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);
export const mark = s => fs.appendFileSync(ERRLOG, `=== ${new Date().toISOString().slice(11, 19)} ${s}\n`);
export const errorsSince = pos => { const t = fs.readFileSync(ERRLOG, 'utf8').slice(pos); return t.split('\n').filter(l => l && !l.startsWith('===') && !/Settings not ready|Story String Validation|favicon|DIALOG/.test(l)); };
export const errPos = () => fs.statSync(ERRLOG).size;

export async function page(width = 1440) {
  const p = await attach();
  p.ev = (fn, arg, ms = 90000) => Promise.race([p.evaluate(fn, arg), sleep(ms).then(() => { throw new Error('ev timeout'); })]);
  return p;
}
export async function size(p, w) { await p.setSize(w, w < 500 ? 844 : 900, w < 500); await sleep(800); }
export async function ready(p) {
  return p.waitFor(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && !!document.querySelector('#send_textarea') && document.querySelector('#chat') && (!window.StoryBlock || StoryBlock.apiVersion === 2), undefined, 90000);
}
export async function connect(p) {
  return p.ev(async url => {
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
  }, 'http://127.0.0.1:5213/v1');
}
export async function load(p) { await p.goto(ST_URL); await ready(p); await sleep(3000); await connect(p); }
export async function openChar(p, name, fresh = false) {
  return p.ev(async ([n, f]) => {
    const ctx = SillyTavern.getContext();
    const i = ctx.characters.findIndex(c => c.name === n);
    if (String(ctx.characterId) !== String(i)) { await ctx.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 2500)); }
    if (f) { await ctx.executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000)); }
    return SillyTavern.getContext().getCurrentChatId();
  }, [name, fresh]);
}
export async function openChat(p, name, chat) {
  return p.ev(async ([n, c]) => {
    const ctx = SillyTavern.getContext();
    const i = ctx.characters.findIndex(x => x.name === n);
    if (String(ctx.characterId) !== String(i)) { await ctx.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 2500)); }
    if (ctx.getCurrentChatId() !== c) { await ctx.openCharacterChat(c); await new Promise(r => setTimeout(r, 3000)); }
    return SillyTavern.getContext().getCurrentChatId();
  }, [name, chat]);
}
export async function reloadInto(p, name, chat) { await p.reload(); await ready(p); await sleep(2500); await connect(p); return openChat(p, name, chat); }
const genDone = () => { const c = SillyTavern.getContext().chat; const stop = document.querySelector('#mes_stop'); return !(stop && getComputedStyle(stop).display !== 'none') && !document.querySelector('#send_but.displayNone, #send_but[style*="none"]'); };
export async function send(p, text, reply, wait = 30000) {
  if (reply !== null) queue(reply);
  const before = await p.ev(() => SillyTavern.getContext().chat.length);
  const r0 = Math.max(0, ...reqNums());
  await p.ev(t => { const el = document.querySelector('#send_textarea'); el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#send_but').click(); }, text);
  const t0 = Date.now();
  const ok = await p.waitFor(n => { const c = SillyTavern.getContext().chat; const stop = document.querySelector('#mes_stop'); return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes && !(stop && getComputedStyle(stop).display !== 'none'); }, before, wait);
  await sleep(2000);
  const reqs = reqNums().filter(n => n > r0);
  const st = await p.ev(() => { const c = SillyTavern.getContext().chat; const stop = document.querySelector('#mes_stop'); return { len: c.length, lastUser: c.at(-1)?.is_user, stopShown: !!(stop && getComputedStyle(stop).display !== 'none'), last: String(c.at(-1)?.mes ?? '').slice(0, 80) }; });
  return { ok, ms: Date.now() - t0, before, ...st, reqs };
}
export async function swipe(p, reply) {
  if (reply !== null) queue(reply);
  const n0 = await p.ev(() => SillyTavern.getContext().chat.at(-1).swipes?.length ?? 1);
  await p.ev(() => window.jQuery('#chat .mes.last_mes .swipe_right').trigger('click'));
  const ok = await p.waitFor(n => { const m = SillyTavern.getContext().chat.at(-1); const stop = document.querySelector('#mes_stop'); return (m.swipes?.length ?? 1) > n && m.mes && !(stop && getComputedStyle(stop).display !== 'none'); }, n0, 30000);
  await sleep(2000);
  return ok;
}
export async function swipeLeft(p) { await p.ev(() => window.jQuery('#chat .mes.last_mes .swipe_left').trigger('click')); await sleep(2500); }
export async function delLast(p, n = 1) { await p.ev(async k => { const c = SillyTavern.getContext(); for (let i = 0; i < k; i++) await c.deleteLastMessage(); await c.saveChat(); }, n); await sleep(2000); }
export async function delAt(p, i) { await p.ev(async k => { const c = SillyTavern.getContext(); await c.deleteMessage(k); await c.saveChat(); }, i); await sleep(2000); }
export const state = p => p.ev(() => JSON.stringify(StoryBlock.sdk.view().state?.domains ?? null));

// ---- UI audit ---------------------------------------------------------------------------------------
// Runs in page: overflow, blank controls, and (optional) forbidden words in the suite UI.
export function auditFn(opts) {
  const vis = e => { if (!e || !e.isConnected) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const roots = ['#story_suite_v2_bar', '#story_suite_v2_panel', '.ss-gameview', '#story_suite_v2_overlay', '.ss-dialog', '.story-suite-hud', '#chat .mes [class*="story-suite"]', '#chat .mes [class*="ss-"]', '[class*="rpg-"]', '[class*="nsd"]', '[class*="sd-"]'];
  const els = new Set();
  for (const r of roots) for (const e of document.querySelectorAll(r)) if (vis(e)) els.add(e);
  const iw = innerWidth;
  const over = document.scrollingElement.scrollWidth > iw;
  const offenders = [];
  const blanks = [];
  const words = [];
  const desc = e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${[...e.classList].slice(0, 3).join('.')}`;
  const seen = new Set();
  for (const root of els) {
    for (const e of [root, ...root.querySelectorAll('*')]) {
      if (seen.has(e)) continue; seen.add(e);
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      // past the right edge and not inside a sideways scroller
      if (r.right > iw + 1 && r.left < iw) {
        let a = e.parentElement, clipped = false;
        while (a) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { const ar = a.getBoundingClientRect(); if (ar.right <= iw + 1) { clipped = true; break; } } a = a.parentElement; }
        if (!clipped) offenders.push(`${desc(e)} right=${Math.round(r.right)} w=${Math.round(r.width)} "${(e.textContent || '').trim().slice(0, 30)}"`);
      }
      if (e.matches('button, [role=button], a.menu_button, .menu_button, select, input:not([type=hidden])')) {
        const label = (e.textContent || '').trim() || (e.labels && e.labels.length ? 'lbl' : '') || e.closest('label')?.textContent?.trim() || e.getAttribute('aria-label') || e.title || e.value || e.placeholder || (e.querySelector('i[class*="fa-"]') ? 'icon:' + e.querySelector('i').className : '');
        if (!label) blanks.push(desc(e));
        if (r.width < 8 || r.height < 8) blanks.push(`${desc(e)} tiny ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    if (opts?.forbid) { const t = root.innerText || ''; const m = t.match(new RegExp(opts.forbid, 'gi')); if (m) for (const w of m) { const i = t.search(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); words.push(`${desc(root)}: …${t.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}…`); } }
  }
  return { iw, sw: document.scrollingElement.scrollWidth, over, offenders: [...new Set(offenders)].slice(0, 12), blanks: [...new Set(blanks)].slice(0, 20), words: [...new Set(words)].slice(0, 20) };
}
export const audit = (p, opts = {}) => p.ev(auditFn, opts);

// Click each visible, non-destructive button under rootSel; report buttons after which nothing in the DOM changed.
export function clickAllFn({ rootSel, skip, max = 60 }) {
  return (async () => {
    const W = ms => new Promise(r => setTimeout(r, ms));
    const vis = e => { if (!e || !e.isConnected) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const root = document.querySelector(rootSel);
    if (!root) return { error: 'no root ' + rootSel };
    const skipRe = new RegExp(skip, 'i');
    const label = b => ((b.textContent || '').trim() || b.getAttribute('aria-label') || b.title || '').replace(/\s+/g, ' ').slice(0, 50);
    const done = new Set(); const dead = []; const clicked = []; const errs = [];
    for (let k = 0; k < max; k++) {
      const all = [...root.querySelectorAll('button, [role=button], .menu_button, summary')].filter(vis);
      const b = all.find(x => !done.has(label(x) + '|' + x.className) && !skipRe.test(label(x)) && !x.disabled && x.getAttribute('aria-disabled') !== 'true');
      if (!b) break;
      const key = label(b) + '|' + b.className; done.add(key);
      let muts = 0; const mo = new MutationObserver(l => { muts += l.length; }); mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      const dlgBefore = document.querySelectorAll('.ss-dialog, dialog[open], .popup').length;
      try { b.click(); } catch (e) { errs.push(`${key}: ${e.message}`); }
      await W(700); mo.disconnect();
      const dlgAfter = document.querySelectorAll('.ss-dialog, dialog[open], .popup').length;
      clicked.push(label(b));
      if (muts === 0 && dlgAfter === dlgBefore) dead.push(`${label(b)} <${b.tagName.toLowerCase()}.${[...b.classList].slice(0, 3).join('.')}>`);
      // close what opened
      if (dlgAfter > dlgBefore) { const c = [...document.querySelectorAll('.ss-dialog .ss-dialog-close, .ss-dialog [class*=cancel], dialog[open] .popup-button-cancel')].filter(vis).at(-1); c?.click(); await W(400); }
      if (!root.isConnected || !vis(root)) break;
    }
    return { clicked, dead, errs };
  })();
}
export const clickAll = (p, rootSel, skip = 'drop|remove|delete|reset|uninstall|import|export|download|save character|file|forget|close|×|clear|turn down|give up|abandon|rewind|return here|restore|go back', max = 60) => p.ev(clickAllFn, { rootSel, skip, max }, 180000);
