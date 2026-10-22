// RB wizard + every "Create your character" entry (HUD strip, Home card, Party screen, reply card).
import fs from 'node:fs';
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue } from './lib.mjs';
const W = Number(process.argv[2] || 1440);
const TAG = process.argv[3] || 'all';
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: TAG === 'rb' ? ['Story_block', 'rpg_battle'] : null });
await newChat(page);
const log = (...a) => console.log(`[${W}]`, ...a);
const dlgs = () => ev(() => document.querySelectorAll('.ss-dialog').length);
const btns = sel => ev(s => [...document.querySelectorAll(s)].filter(b => b.offsetParent).map(b => (b.textContent.trim() || b.getAttribute('aria-label') || b.title).replace(/\s+/g, ' ').slice(0, 40)), sel);
const closeDlg = () => ev(() => { const c = [...document.querySelectorAll('.ss-dialog .ss-dialog-close, .ss-dialog button')].find(b => /close|cancel|×/i.test(b.textContent + (b.getAttribute('aria-label') ?? '') + b.title)); c?.click(); });
// 1) entries
log('strip/body create buttons:', JSON.stringify(await btns('button')).match(/"[^"]*[Cc]reate[^"]*"/g));
// HUD / status strip
const entries = await ev(() => [...document.querySelectorAll('button, a, [role=button]')].filter(b => b.offsetParent && /create/i.test(b.textContent + (b.getAttribute('aria-label') ?? ''))).map(b => ({ t: b.textContent.trim().slice(0, 40), cls: b.className.slice(0, 60), in: b.closest('[id], [class*=story-suite], .mes')?.className?.slice(0, 50) ?? '' })));
log('entries', JSON.stringify(entries));
let i = 0;
for (const e of entries) {
  await ev(k => [...document.querySelectorAll('button, a, [role=button]')].filter(b => b.offsetParent && /create/i.test(b.textContent + (b.getAttribute('aria-label') ?? '')))[k]?.click(), i++); await sleep(1500);
  log('entry', e.t, '| in', e.in, '-> dialogs', await dlgs());
  await page.screenshot({ path: `${OUT}/shots/wiz-entry-${W}-${i}.png` });
  // click same entry again while open: must not stack two dialogs
  await ev(k => [...document.querySelectorAll('button, a, [role=button]')].filter(b => b.offsetParent && /create/i.test(b.textContent + (b.getAttribute('aria-label') ?? '')))[k]?.click(), i - 1).catch(() => {}); await sleep(800);
  log('   again -> dialogs', await dlgs());
  await closeDlg(); await sleep(800);
  log('   closed -> dialogs', await dlgs());
}
// Game view → Home / Party
await ev(() => document.querySelector('.story-suite-bar-game')?.click()); await sleep(1200);
const navs = await ev(() => [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].map(t => t.textContent.trim()));
log('game screens', navs.join(','));
for (const n of navs.filter(x => /home|party/i.test(x))) {
  await ev(x => [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].find(b => b.textContent.trim() === x)?.click(), n); await sleep(1000);
  const bs = await ev(() => [...document.querySelectorAll('.ss-gameview-body button')].filter(b => b.offsetParent).map(b => b.textContent.trim().slice(0, 40)));
  log('screen', n, 'buttons', JSON.stringify(bs));
  const k = await ev(() => { const b = [...document.querySelectorAll('.ss-gameview-body button')].find(b => b.offsetParent && /create|get started/i.test(b.textContent)); if (!b) return 'none'; b.click(); return b.textContent.trim(); }); await sleep(1500);
  log('  clicked', k, '-> dialogs', await dlgs(), 'overflow', JSON.stringify(await overflow(page)));
  if (k !== 'none') { await closeDlg(); await sleep(800); }
}
await ev(() => document.querySelector('.ss-gameview-close')?.click()); await sleep(600);
// 2) the wizard itself
await ev(() => [...document.querySelectorAll('button')].find(b => b.offsetParent && /create/i.test(b.textContent))?.click()); await sleep(1500);
const step = async () => ev(() => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); if (!d) return null; return { sec: [...d.querySelectorAll('.cc-step')].filter(x => x.offsetParent).map(x => x.className).join(','), text: d.innerText.replace(/\s+/g, ' ').slice(0, 300), btns: [...d.querySelectorAll('button')].filter(b => b.offsetParent).map(b => `${b.textContent.trim().slice(0, 24)}${b.disabled ? '(d)' : ''}${b.getAttribute('aria-pressed') ? '[' + b.getAttribute('aria-pressed') + ']' : ''}`) }; });
const next = () => ev(() => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); [...d.querySelectorAll('button')].find(b => b.offsetParent && /^next/i.test(b.textContent.trim()))?.click(); });
for (let s = 0; s < 7; s++) {
  const st = await step(); if (!st) { log('no dialog'); break; }
  log('STEP', st.sec, '|', st.text.slice(0, 160)); log('  btns', JSON.stringify(st.btns));
  await page.screenshot({ path: `${OUT}/shots/wiz-${W}-step${s}.png` });
  log('  overflow', JSON.stringify(await overflow(page)));
  if (/cc-race/.test(st.sec)) {
    const r = await ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const d = [...document.querySelectorAll('.ss-dialog')].at(-1); const cards = () => [...d.querySelectorAll('.cc-card')]; const out = [];
      cards()[0]?.click(); await W(500); out.push(cards().map(c => c.getAttribute('aria-pressed')).join(''));
      cards()[0]?.click(); await W(500); out.push(cards().map(c => c.getAttribute('aria-pressed')).join(''));
      cards()[1]?.click(); await W(500); out.push(cards().map(c => c.getAttribute('aria-pressed')).join(''));
      cards()[2]?.click(); await W(500); out.push(cards().map(c => c.getAttribute('aria-pressed')).join(''));
      out.push('types:' + cards().map(c => c.tagName + '/' + c.type).slice(0, 2).join(','));
      return out; });
    log('  race pick/unpick', JSON.stringify(r));
  }
  if (/cc-talents/.test(st.sec)) {
    const r = await ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const d = [...document.querySelectorAll('.ss-dialog')].at(-1); const cards = () => [...d.querySelectorAll('.cc-talent-list .cc-card')]; const out = [];
      const s = () => cards().map(c => (c.disabled ? 'd' : '') + (c.getAttribute('aria-pressed') === 'true' ? '1' : '0')).join(' ') + ' left=' + (d.querySelector('.cc-left b')?.textContent);
      out.push(s()); for (const k of [0, 1, 2]) { cards()[k]?.click(); await W(500); out.push(s()); }
      cards()[1]?.click(); await W(500); out.push('unpick1 ' + s());
      return out; });
    log('  talents', JSON.stringify(r));
    // Random talent
    const rr = await ev(async () => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); const b = [...d.querySelectorAll('button')].find(b => /random/i.test(b.textContent)); if (!b) return 'no random'; b.click(); await new Promise(r => setTimeout(r, 800)); return d.querySelector('.cc-random')?.innerText.replace(/\s+/g, ' ').slice(0, 150); });
    log('  random', rr);
  }
  if (/cc-stats/.test(st.sec)) {
    const r = await ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const d = [...document.querySelectorAll('.ss-dialog')].at(-1);
      for (let k = 0; k < 40; k++) { const plus = [...d.querySelectorAll('.cc-stat button')].filter(b => !b.disabled && /\+|increase|more/i.test(b.textContent + (b.getAttribute('aria-label') ?? ''))); if (!plus.length) break; plus[k % plus.length].click(); await W(120); }
      return d.querySelector('.cc-left')?.textContent.trim(); });
    log('  stats spent ->', r);
  }
  if (/cc-you/.test(st.sec)) {
    log('  review', await ev(() => [...document.querySelectorAll('.ss-dialog .cc-review-list dd')].map(x => x.textContent.trim().replace(/\s+/g, ' ')).join(' | ')));
    log('  problem', await ev(() => document.querySelector('.ss-dialog .cc-problem')?.textContent.trim()));
    await ev(() => document.querySelector('.ss-dialog .cc-go')?.click()); await sleep(2000);
    log('  after create: dialogs', await dlgs(), 'toasts', JSON.stringify(await ev(() => [...document.querySelectorAll('#toast-container .toast')].map(t => t.textContent.trim().slice(0, 120)))));
    await page.screenshot({ path: `${OUT}/shots/wiz-${W}-done.png` });
    break;
  }
  await next(); await sleep(1000);
}
log('party', await ev(() => JSON.stringify(StoryBlock.sdk.view().state?.domains?.party ?? StoryBlock.sdk.view().state?.domains?.['rpg-battle'] ?? Object.keys(StoryBlock.sdk.view().state?.domains ?? {})).slice(0, 300)));
log('create entries left', JSON.stringify(await ev(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /create your|^create$/i.test(b.textContent.trim())).map(b => b.textContent.trim()))));
// send a reply now: should not be held
const ok = await send(page, 'hello', R('The quay. A fight later.', ['~ place Quay | kind: dock']));
log('send after create ok', ok);
log('ERRORS', JSON.stringify(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)), null, 1));
await browser.close();
