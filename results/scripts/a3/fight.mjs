// RB fight to the end, then the Fight screen's last fight in parts (390/1440).
import fs from 'node:fs';
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue } from './lib.mjs';
const W = Number(process.argv[2] || 1440); const CFG = process.argv[3] || 'rb';
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: CFG === 'rb' ? ['Story_block', 'rpg_battle'] : ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'] });
const log = (...a) => console.log(`[fight-${CFG}-${W}]`, ...a);
await newChat(page);
// create via wizard
await ev(() => [...document.querySelectorAll('button')].find(b => b.offsetParent && /^create$/i.test(b.textContent.trim()))?.click()); await sleep(1200);
for (let s = 0; s < 10; s++) {
  const done = await ev(async () => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); if (!d) return true; const W = ms => new Promise(r => setTimeout(r, ms));
    if (d.querySelector('.cc-race')?.offsetParent && !d.querySelector('.cc-race .cc-card[aria-pressed="true"]')) { d.querySelector('.cc-race .cc-card')?.click(); await W(400); }
    if (d.querySelector('.cc-stats')?.offsetParent) for (let k = 0; k < 30; k++) { const p = [...d.querySelectorAll('.cc-stat button')].filter(b => !b.disabled && b.textContent.trim() === '+'); if (!p.length) break; p[k % p.length].click(); await W(80); }
    const go = d.querySelector('.cc-go'); if (go?.offsetParent) { go.click(); return false; } [...d.querySelectorAll('button')].find(b => b.offsetParent && /^next/i.test(b.textContent.trim()))?.click(); return false; });
  if (done) break; await sleep(1200);
}
log('created', await ev(() => !document.querySelector('.ss-dialog')));
log('r1', await send(page, 'go down to the cellar', R('A rat the size of a dog hisses. <b>MARK</b>', ['! encounter 2 Weir Rat <b>MARK</b><img src=x onerror="window.__xss=1"> | tier: weak | stakes: normal'])));
const vis = () => ev(() => [...document.querySelectorAll('.ss-gameview-body button, .ss-dialog button, #chat .mes.last_mes button')].filter(b => b.offsetParent && !b.disabled).map(b => b.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)));
log('reply buttons', JSON.stringify(await ev(() => [...document.querySelectorAll('#chat .mes.last_mes button')].filter(b => b.offsetParent).map(b => b.textContent.trim().slice(0, 30)))));
// open game view → Fight
await ev(() => document.querySelector('.story-suite-bar-game')?.click()); await sleep(1000);
await ev(() => [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].find(b => /fight/i.test(b.textContent))?.click()); await sleep(1200);
log('fight screen', (await ev(() => document.querySelector('.ss-gameview-body')?.innerText.replace(/\s+/g, ' ').slice(0, 300))));
log('btns', JSON.stringify(await vis()));
const clickRe = async re => ev(r => { const b = [...document.querySelectorAll('.ss-gameview-body button, .ss-dialog button, #chat .mes.last_mes button')].find(b => b.offsetParent && !b.disabled && new RegExp(r, 'i').test(b.textContent.trim())); if (!b) return null; b.click(); return b.textContent.trim().slice(0, 30); }, re);
log('start', await clickRe('^(fight|start|begin)')); await sleep(2000);
log('btns', JSON.stringify(await vis()));
await page.screenshot({ path: `${OUT}/shots/fight-${CFG}-${W}-board.jpg`, type: 'jpeg', quality: 40 });
for (let k = 0; k < 80; k++) {
  const last = await ev(() => !/\bAttack\b/.test(document.querySelector('.ss-gameview-body')?.innerText ?? '') && /victory|defeat|fled|last fight|won/i.test(document.querySelector('.ss-gameview-body')?.innerText ?? ''));
  if (last) { log('fight over after', k); break; }
  const c = await clickRe('^(attack|end turn|next|ok|continue)');
  const tt = await ev(() => { const t = [...document.querySelectorAll('.ss-gameview-body [role=button]')].find(x => x.offsetParent && x.getAttribute('aria-disabled') !== 'true'); if (!t) return null; t.click(); return t.textContent.trim().slice(0, 20); }); await sleep(500);
  if (!c && !tt) { const t = null; if (!t) { log('stuck; btns', JSON.stringify(await vis())); break; } }
  await sleep(600);
}
log('finish', await clickRe('^finish')); await sleep(2500);
log('reply after finish', await send(page, 'onwards', R('The rats lie still.', ['~ place Cellar | kind: cellar'])));
await ev(() => { if (document.querySelector('.ss-gameview')?.hidden !== false) document.querySelector('.story-suite-bar-game').click(); [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].find(b => /fight/i.test(b.textContent))?.click(); }); await sleep(1500);
log('fight screen after', (await ev(() => document.querySelector('.ss-gameview-body')?.innerText.replace(/\s+/g, ' ').slice(0, 700))));
log('btns', JSON.stringify(await vis()));
log('overflow', JSON.stringify(await overflow(page)), 'xss', await ev(() => window.__xss ?? null));
await page.screenshot({ path: `${OUT}/shots/fight-${CFG}-${W}-last.jpg`, type: 'jpeg', quality: 45 });
log('ERRORS', JSON.stringify(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)), null, 1));
await browser.close();
