// Settings -> Diagnostics: seed settings + chat with markers and fake keys, then Copy / Save the report and grep it.
import fs from 'node:fs';
import { open, newChat, send, R, sleep, overflow, ourErrors, OUT, clearQueue } from './lib.mjs';
const W = Number(process.argv[2] || 1440);
clearQueue();
const { browser, page, errors, ev } = await open({ width: W, exts: process.argv[3] === 'norb' ? ['Story_block', 'Story_director', 'npc_state_delta'] : ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'] });
const KEYS = { mistral: 'Xq7Lm2Pz9Rt4Vb8N' + 'c1Kd6Fg3Hj5Ws0Ya', ant: 'sk-' + 'ant-api03-FAKEKEYabcdefghijklmnop', aws: 'AKIA' + 'IOSFODNN7EXAMPLE', short: 'sk-FAKE12345' };
await ev(K => {
  const es = SillyTavern.getContext().extensionSettings; const m = es.storySuite.modules; for (const k of ['story-block','rpg-battle','story-director','npc-state-delta']) m[k] ??= {};
  m['story-block'].currency = 'SETMARK_CUR'; m['story-block'].assistProfile = K.ant;
  m['rpg-battle']['party.xpName'] = 'SETMARK_XP ' + K.aws;
  m['story-director']['tracker.calendar.era'] = 'era ' + K.mistral;
  m['story-director'].openaiApiKey = 'sk-' + 'proj-SHOULDBEGONE0000000000000';
  m['npc-state-delta'].note = 'short ' + K.short;
  SillyTavern.getContext().saveSettingsDebounced();
}, KEYS);
await newChat(page);
await send(page, 'USERMARK_1 hello <b>MARK</b>', R('REPLYMARK_2 The quay is wet. <img src=x onerror="window.__xss=1">\n\n! Encounter "QUOTEMARK_3" Weir Rat, said "CHATQ_A" and "CHATQ_B"', [
  '~ place PLACEMARK_4 Quay | kind: dock', '+ item ITEMMARK_5 Rope | qty: 2', '+ coin -3', '~ npc NPCMARK_6 | trust: +5', '+ item  | qty: x', '+ quest QMARK_7 find the "inner QQ_8" key',
  '+ item He said "a" then UNQ_MARK_11 "b" | qty: 1']));
await send(page, 'second', R('REPLYMARK_12 more.', ['- item NOPEMARK_9 | qty: 1', '- coin 99999 | to: PAYMARK_10', '~ npc NPCMARK_6 | trust: +500', "+ milestone NPCMARK_6 — kissed MSMARK_13"]));
await ev(() => document.querySelector('.story-suite-bar-settings')?.click()); await sleep(1500);
await ev(() => { const d = document.querySelector('details[data-fold="story-suite-diagnostics"]'); d.open = true; d.scrollIntoView(); }); await sleep(3000);
const pre = await ev(() => document.querySelector('.story-suite-diagnostics-report')?.textContent ?? '(none)');
// Copy
await ev(() => document.querySelector('.story-suite-diagnostics-copy').click()); await sleep(1500);
const clip = await ev(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return 'CLIPERR ' + e.message; } });
const status = await ev(() => document.querySelector('.story-suite-diagnostics-status')?.textContent);
// Save
const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
await ev(() => document.querySelector('.story-suite-diagnostics-save').click());
const d = await dl; let saved = '(no download)'; let fname = '';
if (d) { fname = d.suggestedFilename(); const p = `${OUT}/scripts/diag-saved-${W}.txt`; await d.saveAs(p); saved = fs.readFileSync(p, 'utf8'); }
await ev(() => document.querySelector('.story-suite-diagnostics-refresh')?.click()); await sleep(1000);
await page.screenshot({ path: `${OUT}/shots/diag-${W}.png` });
fs.writeFileSync(`${OUT}/scripts/diag-report-${W}-${process.argv[3] || 'all'}.txt`, pre); console.log('pre box', JSON.stringify(await ev(() => { const p = document.querySelector('.story-suite-diagnostics-report'); const r = p.getBoundingClientRect(); return { w: r.width, sw: p.scrollWidth, right: r.right, ox: getComputedStyle(p).overflowX, ws: getComputedStyle(p).whiteSpace }; })));
const MARKS = ['USERMARK_1', 'REPLYMARK_2', 'QUOTEMARK_3', 'CHATQ_A', 'CHATQ_B', 'PLACEMARK_4', 'ITEMMARK_5', 'NPCMARK_6', 'QMARK_7', 'QQ_8', 'NOPEMARK_9', 'PAYMARK_10', 'UNQ_MARK_11', 'REPLYMARK_12', 'MSMARK_13', 'SETMARK_CUR', 'SETMARK_XP', ...Object.values(KEYS), 'SHOULDBEGONE', '<b>MARK'];
for (const [n, t] of [['pre', pre], ['clip', clip], ['saved', saved]]) console.log(n, 'len', t.length, 'found:', MARKS.filter(m => t.includes(m)).join(' '));
console.log('status', status, 'file', fname, 'same', pre === clip, pre === saved);
console.log('xss', await ev(() => window.__xss ?? null), 'overflow', JSON.stringify(await overflow(page)));
console.log(ourErrors(errors).filter(e => !/dossier scan failed/.test(e)).join('\n'));
await browser.close();
