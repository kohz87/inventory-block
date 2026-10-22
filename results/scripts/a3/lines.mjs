// List fields as text (form: 'lines'): blank lines, huge lists, markers, round-trip after reload. + profile dropdowns.
import fs from 'node:fs';
import { open, newChat, sleep, overflow, ourErrors, OUT, clearQueue, ST_URL, connect , reloadReady } from './lib.mjs';
const W = Number(process.argv[2] || 1440);
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'] });
const log = (...a) => console.log(`[lines-${W}]`, ...a);
await newChat(page);
// two fake Connection Manager profiles, one with a marker name
await ev(() => { const es = SillyTavern.getContext().extensionSettings; es.connectionManager ??= { profiles: [] }; es.connectionManager.profiles = [
  { id: 'p-1', name: '<b>MARK</b><img src=x onerror="window.__xss=1">', api: 'openai', mode: 'cc' },
  { id: 'p-2', name: 'Fast helper', api: 'openai', mode: 'cc' }, { id: 'p-3', name: 'Fast helper', api: 'openai', mode: 'cc' }]; SillyTavern.getContext().saveSettingsDebounced(); });
const openSettings = async () => { await ev(() => { const o = document.querySelector('#story_suite_v2_overlay'); if (!o || o.hidden) document.querySelector('.story-suite-bar-settings').click(); }); await sleep(1200);
  await ev(async () => { for (let k = 0; k < 4; k++) { for (const d of document.querySelectorAll('#story_suite_v2_overlay details:not([open])')) d.open = true; await new Promise(r => setTimeout(r, 250)); } }); await sleep(500); };
await openSettings();
const FIELDS = { months: 'tracker.calendar.months', ranks: 'party.ranks', coins: 'coins', carry: 'items.carryItems' };
const fieldInfo = key => ev(k => { const row = document.querySelector(`#story_suite_v2_overlay [data-field="${k}"]`); if (!row) return null; const ta = row.querySelector('textarea'); return { form: row.querySelector('[data-form]')?.dataset.form, ta: ta ? ta.value : null, err: row.querySelector('.story-suite-list-error')?.hidden === false ? row.querySelector('.story-suite-list-error').textContent : '', btns: [...row.querySelectorAll('button')].map(b => b.textContent.trim()).slice(-3) }; }, key);
const setText = (key, text) => ev(([k, t]) => { const ta = document.querySelector(`#story_suite_v2_overlay [data-field="${k}"] textarea`); if (!ta) return 'no textarea'; ta.value = t; ta.dispatchEvent(new Event('change', { bubbles: true })); return 'ok'; }, [key, text]);
for (const [n, k] of Object.entries(FIELDS)) log('field', n, JSON.stringify(await fieldInfo(k))?.slice(0, 200));
const stored = (mod, key) => ev(([m, k]) => JSON.stringify(SillyTavern.getContext().extensionSettings.storySuite.modules[m]?.[k]), [mod, key]);
// 1) months with blank lines, CRLF, markers, colon in name
let r = await setText(FIELDS.months, '\r\n  Frostmoon: 30\r\n\r\n\n<b>MARK</b>: 31\nDay: of Ash: 29\n   \nLast:  1  \n');
await sleep(500); log('months set', r, await stored('story-director', 'tracker.calendar.months'), JSON.stringify(await fieldInfo(FIELDS.months)));
// 2) a bad line
await setText(FIELDS.months, 'A: 30\nB: 0\nC: 30'); await sleep(400); log('months bad', JSON.stringify(await fieldInfo(FIELDS.months)), await stored('story-director', 'tracker.calendar.months'));
await setText(FIELDS.months, '\r\n  Frostmoon: 30\r\n\r\n\n<b>MARK</b>: 31\nDay: of Ash: 29\n   \nLast:  1  \n'); await sleep(300);
// 3) huge: 100 ok, 101 refused, 20000 lines timing
const many = n => Array.from({ length: n }, (_, i) => `M${i}: ${1 + (i % 40)}`).join('\n');
let t0 = Date.now(); await setText(FIELDS.ranks, many(100).replace(/: \d+/g, '')); log('ranks 100', Date.now() - t0, 'ms', (await stored('rpg-battle', 'party.ranks'))?.length, JSON.stringify((await fieldInfo(FIELDS.ranks)).err));
t0 = Date.now(); await setText(FIELDS.ranks, many(101).replace(/: \d+/g, '')); log('ranks 101', Date.now() - t0, 'ms', JSON.stringify((await fieldInfo(FIELDS.ranks)).err));
t0 = Date.now(); await setText(FIELDS.carry, many(20000)); log('carry 20000', Date.now() - t0, 'ms', JSON.stringify((await fieldInfo(FIELDS.carry)).err));
t0 = Date.now(); await setText(FIELDS.carry, 'x'.repeat(200000) + ': 5'); log('carry 200k-char line', Date.now() - t0, 'ms', JSON.stringify((await fieldInfo(FIELDS.carry)).err).slice(0, 200), (await stored('rpg-battle', 'items.carryItems'))?.slice(0, 120));
// ranks with level after colon, and coins with plural
await setText(FIELDS.ranks, 'Soul Class I\nSoul Class II: 11\n\n<i>MARK</i> rank'); await sleep(300); log('ranks', await stored('rpg-battle', 'party.ranks'));
await setText(FIELDS.coins, 'penny/pennies: 1\nsilver: 10\n\ngold : 100'); await sleep(300); log('coins', await stored('story-block', 'coins'));
await setText(FIELDS.carry, 'Spatial Ring: 100\nSaddlebags: 60'); await sleep(300);
// toggle rows/text on each
for (const k of Object.values(FIELDS)) {
  const a = await ev(async kk => { const row = document.querySelector(`#story_suite_v2_overlay [data-field="${kk}"]`); const W = ms => new Promise(r => setTimeout(r, ms)); const out = [];
    for (let i = 0; i < 2; i++) { const b = [...row.querySelectorAll('button')].find(b => /edit as/i.test(b.textContent)); if (!b) { out.push('no toggle'); break; } const t = b.textContent.trim(); b.click(); await W(300); out.push(`${t} -> ${row.querySelector('[data-form]')?.dataset.form} rows=${row.querySelectorAll('.story-suite-list-item').length}`); }
    return out; }, k);
  log('toggle', k, JSON.stringify(a));
}
log('overflow settings', JSON.stringify(await overflow(page)));
const before = { months: await stored('story-director', 'tracker.calendar.months'), ranks: await stored('rpg-battle', 'party.ranks'), coins: await stored('story-block', 'coins'), carry: await stored('rpg-battle', 'items.carryItems') };
const shownBefore = {}; for (const [n, k] of Object.entries(FIELDS)) shownBefore[n] = (await fieldInfo(k))?.ta;
// profile dropdowns: SB Assist + NSD scanner
const prof = await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay select')].filter(s => s.dataset.profile || /profile/i.test(s.closest('[data-field]')?.dataset.field ?? s.id ?? '')).map(s => ({ f: s.closest('[data-field]')?.dataset.field ?? s.id, opts: [...s.options].map(o => o.textContent), note: s.closest('[data-field], .story-suite-row, label, div')?.querySelector('.story-suite-profile-note, small')?.textContent?.slice(0, 120) })));
log('profile selects', JSON.stringify(prof)); log('nsd none-note hidden (with 3 profiles):', await ev(() => document.querySelector('#npc_state_delta_scanner_profile_none')?.hidden));
const nsdProf = await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay select')].filter(s => /scanner|profile/i.test((s.id || '') + (s.name || '') + (s.className || ''))).map(s => ({ id: s.id, opts: [...s.options].map(o => o.textContent + '=' + o.value) })));
log('nsd-ish selects', JSON.stringify(nsdProf));
await ev(() => { const s = document.querySelector('#story_suite_v2_overlay select[data-profile]'); if (s) { s.value = 'Fast helper'; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await sleep(400);
log('assistProfile stored', await stored('story-block', 'assistProfile'), 'xss', await ev(() => window.__xss ?? null));
await page.screenshot({ path: `${OUT}/shots/lines-${W}-settings.jpg`, type: 'jpeg', quality: 40, fullPage: false });
// remove the picked profile → (not found) + note
await ev(() => { const es = SillyTavern.getContext().extensionSettings; es.connectionManager.profiles = es.connectionManager.profiles.filter(p => p.name !== 'Fast helper'); SillyTavern.getContext().saveSettingsDebounced(); });
await sleep(1500);
// reload and compare
await reloadReady(page);
await openSettings();
const after = { months: await stored('story-director', 'tracker.calendar.months'), ranks: await stored('rpg-battle', 'party.ranks'), coins: await stored('story-block', 'coins'), carry: await stored('rpg-battle', 'items.carryItems') };
for (const n of Object.keys(FIELDS)) { const shown = (await fieldInfo(FIELDS[n]))?.ta; log('after reload', n, before[n] === after[n] ? 'stored same' : `STORED DIFF ${before[n]} vs ${after[n]}`, shown === shownBefore[n] ? 'shown same' : `SHOWN DIFF ${JSON.stringify(shownBefore[n])} vs ${JSON.stringify(shown)}`); }
const prof2 = await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay select[data-profile]')].map(s => ({ v: s.value, opts: [...s.options].map(o => o.textContent), note: s.parentElement?.parentElement?.querySelector('.story-suite-profile-note')?.textContent })));
log('profile after removal+reload', JSON.stringify(prof2));
// no profiles at all
await ev(() => { SillyTavern.getContext().extensionSettings.connectionManager.profiles = []; });
await ev(() => { const o = document.querySelector('#story_suite_v2_overlay'); [...o.querySelectorAll('button')].find(b => /close/i.test(b.textContent + b.title + (b.getAttribute('aria-label') ?? '')))?.click(); }); await sleep(600);
await openSettings();
log('nsd none-note hidden (0 profiles):', await ev(() => document.querySelector('#npc_state_delta_scanner_profile_none')?.hidden), 'nsd opts', await ev(() => [...(document.querySelector('#npc_state_delta_scanner_connection_profile')?.options ?? [])].map(o => o.textContent).join('|')));
log('profile none', JSON.stringify(await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-profile-note')].map(n => n.textContent))));
log('nsd notes', JSON.stringify(await ev(() => [...document.querySelectorAll('#story_suite_v2_overlay [class*="npc"] small, #story_suite_v2_overlay [id*="scanner"]')].map(n => (n.id || '') + ':' + n.textContent.trim().slice(0, 100)).filter(t => /profile|scanner/i.test(t)).slice(0, 6))));
await page.screenshot({ path: `${OUT}/shots/lines-${W}-noprofiles.jpg`, type: 'jpeg', quality: 40 });
log('xss', await ev(() => window.__xss ?? null), 'overflow', JSON.stringify(await overflow(page)));
log('ERRORS', JSON.stringify(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)), null, 1));
await browser.close();
