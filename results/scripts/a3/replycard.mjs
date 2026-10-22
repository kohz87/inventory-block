// "Create your character" on the card under a reply: replies made while RPG Battle was off, then RB turned on.
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue, setExts, connect , reloadReady } from './lib.mjs';
const W = Number(process.argv[2] || 1440);
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: ['Story_block'] });
const log = (...a) => console.log(`[card-${W}]`, ...a);
const chatId = await newChat(page);
log('r1', await send(page, 'hi', R('The quay.', ['~ place Quay | kind: dock', '+ item Rope | qty: 1'])));
log('r2', await send(page, 'on', R('Rain.', ['+ coin 5'])));
setExts(['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta']);
await reloadReady(page);
await ev(async id => { const c = SillyTavern.getContext(); const i = c.characters.findIndex(x => x.name === 'The Narrator'); if (String(c.characterId) !== String(i)) { await c.selectCharacterById(String(i)); await new Promise(r => setTimeout(r, 2500)); } await c.openCharacterChat(id); await new Promise(r => setTimeout(r, 3500)); }, chatId);
const entries = () => ev(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /create/i.test(b.textContent)).map(b => `${b.textContent.trim().slice(0, 30)} @${b.closest('.mes') ? 'mes' + b.closest('.mes').getAttribute('mesid') : b.closest('[id]')?.id}`));
log('entries', JSON.stringify(await entries()));
log('mes cards', JSON.stringify(await ev(() => [...document.querySelectorAll('#chat .mes')].map(m => m.getAttribute('mesid') + ':' + [...m.querySelectorAll('[class*=story-suite], [class*=rb], details')].map(e => e.className.split(' ')[0] + '=' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)).slice(0, 4).join(' || ')))));
await ev(async () => { for (const d of document.querySelectorAll('#chat .mes details:not([open])')) d.open = true; await new Promise(r => setTimeout(r, 800)); });
log('entries after opening cards', JSON.stringify(await entries()));
const cardBtns = await ev(() => [...document.querySelectorAll('#chat .mes button')].filter(b => b.offsetParent && /create/i.test(b.textContent)).length);
log('reply-card create buttons', cardBtns);
await ev(() => [...document.querySelectorAll('#chat .mes button')].find(b => b.offsetParent && /create/i.test(b.textContent))?.click()); await sleep(1500);
log('after card click dialogs', await ev(() => document.querySelectorAll('.ss-dialog').length));
await ev(() => [...document.querySelectorAll('#chat .mes button')].filter(b => b.offsetParent && /create/i.test(b.textContent)).at(-1)?.click()); await sleep(1000);
log('second card click dialogs', await ev(() => document.querySelectorAll('.ss-dialog').length));
await page.screenshot({ path: `${OUT}/shots/card-${W}-wizard.jpg`, type: 'jpeg', quality: 40 });
// finish the wizard
for (let s = 0; s < 10; s++) {
  const done = await ev(async () => { const d = [...document.querySelectorAll('.ss-dialog')].at(-1); if (!d) return true; const W = ms => new Promise(r => setTimeout(r, ms));
    if (d.querySelector('.cc-race')?.offsetParent && !d.querySelector('.cc-race .cc-card[aria-pressed="true"]')) { d.querySelector('.cc-race .cc-card')?.click(); await W(400); }
    if (d.querySelector('.cc-stats')?.offsetParent) for (let k = 0; k < 30; k++) { const p = [...d.querySelectorAll('.cc-stat button')].filter(b => !b.disabled && b.textContent.trim() === '+'); if (!p.length) break; p[k % p.length].click(); await W(80); }
    const go = d.querySelector('.cc-go'); if (go?.offsetParent) { go.click(); return false; } [...d.querySelectorAll('button')].find(b => b.offsetParent && /^next/i.test(b.textContent.trim()))?.click(); return false; });
  if (done) break; await sleep(1200);
}
await sleep(1500);
log('toasts', JSON.stringify(await ev(() => [...document.querySelectorAll('#toast-container .toast')].map(t => t.textContent.trim().slice(0, 100)))));
log('entries after create', JSON.stringify(await entries()));
log('old cards text', JSON.stringify(await ev(() => [...document.querySelectorAll('#chat .mes .start, #chat .mes [class*=status]')].filter(e => e.offsetParent).map(e => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)).slice(0, 4))));
log('overflow', JSON.stringify(await overflow(page)));
log('ERRORS', JSON.stringify(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)), null, 1));
await browser.close();
