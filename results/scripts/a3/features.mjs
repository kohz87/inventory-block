// Features fold: sub-folds per module, the Find a feature filter, "Features: N of M on — change" links, NSD two folds deep, prompt-size panel.
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue } from './lib.mjs';
const W = Number(process.argv[2] || 1440);
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'] });
const log = (...a) => console.log(`[feat-${W}]`, ...a);
await newChat(page);
await ev(() => document.querySelector('.story-suite-bar-settings').click()); await sleep(1200);
const state = () => ev(() => [...document.querySelectorAll('#story_suite_v2_overlay details.story-suite-feature-group')].map(d => `${d.dataset.module}:${d.hidden ? 'H' : ''}${d.open ? 'o' : 'c'}:${[...d.querySelectorAll('.story-suite-feature')].filter(r => !r.hidden).length}`).join(' ') + ' | none=' + (document.querySelector('.story-suite-feature-none')?.hidden ? '' : document.querySelector('.story-suite-feature-none')?.textContent));
await ev(() => { const d = document.querySelector('details[data-fold="story-suite-features"]'); d.open = true; }); await sleep(400);
// open one sub-fold by hand to see it is remembered after filter clears
await ev(() => { document.querySelector('details.story-suite-feature-group[data-module="rpg-battle"]').open = true; }); await sleep(200);
log('start', await state());
const type = t => ev(x => { const i = document.querySelector('#story_suite_feature_filter'); i.value = x; i.dispatchEvent(new Event('input', { bubbles: true })); }, t);
for (const q of ['fight', 'DIGEST', '<b>MARK</b>', '([', 'zzzz-no-such-feature-' + 'x'.repeat(80), '   ', 'function', '=>', '']) { await type(q); await sleep(250); log(`filter ${JSON.stringify(q.slice(0, 30))}`, await state()); }
// toggle a feature while filtered: filter kept, focus kept?
await type('choices'); await sleep(250);
const tg = await ev(async () => { const row = [...document.querySelectorAll('.story-suite-feature')].find(r => !r.hidden && r.offsetParent); const inp = row?.querySelector('input'); if (!inp) return 'no row'; inp.click(); await new Promise(r => setTimeout(r, 600)); return { filter: document.querySelector('#story_suite_feature_filter')?.value, focus: document.activeElement?.id, checked: document.getElementById(inp.id)?.checked }; });
log('toggle while filtered', JSON.stringify(tg), await state());
await ev(() => { const row = [...document.querySelectorAll('.story-suite-feature')].find(r => !r.hidden && r.offsetParent); row?.querySelector('input')?.click(); }); await sleep(500);
await type('fight'); await sleep(250);
// module fold links
const links = await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature-link')].map(b => b.textContent.trim()));
log('links', JSON.stringify(links));
for (let i = 0; i < links.length; i++) {
  const r = await ev(async k => { const b = [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature-link')][k]; b.closest('details').open = true; b.click(); await new Promise(r => setTimeout(r, 400)); const mod = b.closest('details[data-fold]')?.dataset.fold; const sub = document.querySelector(`details.story-suite-feature-group[data-module="${mod}"]`); return { mod, subOpen: sub?.open, subHidden: sub?.hidden, filter: document.querySelector('#story_suite_feature_filter')?.value, visibleRows: sub ? [...sub.querySelectorAll('.story-suite-feature')].filter(r => !r.hidden).length : -1, total: sub ? sub.querySelectorAll('.story-suite-feature').length : -1 }; }, i);
  log('link', links[i], JSON.stringify(r));
}
// NSD depth
log('nsd depth', JSON.stringify(await ev(() => { const f = document.querySelector('details[data-fold="npc-state-delta"]'); if (!f) return null; const depth = e => { let n = 0; for (let a = e; a && a !== f; a = a.parentElement) if (a.tagName === 'DETAILS') n++; return n + 1; }; const ctrls = [...f.querySelectorAll('input, select, textarea, button')].filter(c => c.offsetParent || true); const ds = ctrls.map(depth); return { controls: ctrls.length, maxDepth: Math.max(...ds), byDepth: ds.reduce((m, d) => (m[d] = (m[d] || 0) + 1, m), {}), hiddenCtrls: ctrls.filter(c => { f.querySelectorAll('details').forEach(d => d.open = true); return !c.offsetParent && c.type !== 'hidden'; }).length }; })));
// Prompt size panel
await ev(() => { const d = document.querySelector('details[data-fold="story-suite"]'); d.open = true; d.scrollIntoView(); }); await sleep(800);
log('prompt size panel', await ev(() => document.querySelector('details[data-fold="story-suite"]')?.innerText.replace(/\s+/g, ' ').slice(0, 900)));
await page.screenshot({ path: `${OUT}/shots/feat-${W}-promptsize.jpg`, type: 'jpeg', quality: 40 });
// change share/tail: invalid values
for (const [k, v] of [['contextShare', '0'], ['contextShare', '95'], ['contextShare', '-5'], ['contextShare', '4.5'], ['tailBudget', '99999999999']]) {
  const r = await ev(async ([k, v]) => { const inp = document.querySelector(`#story_suite_v2_overlay [data-field="${k}"] input`); if (!inp) return 'no input'; inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 500)); return { shown: inp.value, stored: SillyTavern.getContext().extensionSettings.storySuite.host?.[k], panel: document.querySelector('details[data-fold="story-suite"]')?.innerText.match(/Context[^\n]*|share[^\n]*/gi)?.slice(0, 3) }; }, [k, v]);
  log('set', k, v, JSON.stringify(r));
}
await ev(() => { const h = SillyTavern.getContext().extensionSettings.storySuite.host; delete h.contextShare; delete h.tailBudget; });
log('overflow', JSON.stringify(await overflow(page)));
log('ERRORS', JSON.stringify(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)), null, 1));
await browser.close();
