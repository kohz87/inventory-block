// Walk every Story Suite surface: panel tabs, game view screens, settings folds, cards, HUD. Audit + click-all each.
import { audit, clickAll, sleep, OUT } from './drv.mjs';
export async function walk(p, tag, { forbid = null, clicks = true, shots = true, log = console.log } = {}) {
  const problems = [];
  const W = sleep;
  const note = async (where, a) => {
    const bad = a.over || a.offenders.length || a.blanks.length || a.words.length;
    if (bad) { problems.push({ where, ...a }); log(`  !! ${where}: over=${a.over} sw=${a.sw}/${a.iw} off=${JSON.stringify(a.offenders.slice(0, 4))} blanks=${JSON.stringify(a.blanks.slice(0, 6))} words=${JSON.stringify(a.words.slice(0, 4))}`); if (shots) await p.shot(`${OUT}/shots/${tag}-${where.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}.jpg`, 40); }
  };
  const cl = async (where, sel) => { if (!clicks) return; const r = await clickAll(p, sel); if (r.error) { log(`  ${where}: ${r.error}`); return; } if (r.dead.length || r.errs.length) { problems.push({ where, dead: r.dead, errs: r.errs }); log(`  ?? ${where} dead=${JSON.stringify(r.dead)} errs=${JSON.stringify(r.errs)}`); } log(`  ${where}: clicked ${r.clicked.length}`); };
  // HUD / bar
  await note('bar', await audit(p, { forbid }));
  // panel tabs
  await p.ev(() => { const pn = document.querySelector('#story_suite_v2_panel'); if (pn.hidden) document.querySelector('.story-suite-bar-story').click(); });
  await W(800);
  const tabs = await p.ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(t => t.textContent.trim()));
  log(`  tabs: ${tabs.join(', ')}`);
  for (const t of tabs) {
    await p.ev(n => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(x => x.textContent.trim() === n)?.click(), t); await W(900);
    await note(`panel-${t}`, await audit(p, { forbid }));
    await cl(`panel-${t}`, '#story_suite_v2_panel .story-suite-pane');
    await p.ev(n => { const pn = document.querySelector('#story_suite_v2_panel'); if (pn.hidden) document.querySelector('.story-suite-bar-story').click(); [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(x => x.textContent.trim() === n)?.click(); }, t); await W(400);
    const empty = await p.ev(() => (document.querySelector('#story_suite_v2_panel .story-suite-pane')?.innerText ?? '').trim().length);
    if (!empty) { problems.push({ where: `panel-${t}`, blank: true }); log(`  !! panel-${t} pane is blank`); await p.shot(`${OUT}/shots/${tag}-blank-${t}.jpg`, 40); }
  }
  await p.ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click()); await W(400);
  // game view
  await p.ev(() => { if (!document.querySelector('.ss-gameview') || document.querySelector('.ss-gameview').hidden) document.querySelector('.story-suite-bar-game').click(); }); await W(1000);
  const navs = await p.ev(() => [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].map(t => t.textContent.trim()));
  log(`  game screens: ${navs.join(', ')}`);
  for (const n of navs) {
    await p.ev(x => { if (document.querySelector('.ss-gameview')?.hidden !== false) document.querySelector('.story-suite-bar-game').click(); [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].find(b => b.textContent.trim() === x)?.click(); }, n); await W(900);
    await note(`game-${n}`, await audit(p, { forbid }));
    const len = await p.ev(() => (document.querySelector('.ss-gameview-body')?.innerText ?? '').trim().length);
    if (!len) { problems.push({ where: `game-${n}`, blank: true }); log(`  !! game-${n} body blank`); await p.shot(`${OUT}/shots/${tag}-blank-game-${n}.jpg`, 40); }
    await cl(`game-${n}`, '.ss-gameview-body');
  }
  await p.ev(() => document.querySelector('.ss-gameview-close')?.click()); await W(500);
  // settings overlay with every fold open
  await p.ev(() => document.querySelector('.story-suite-bar-settings').click()); await W(1200);
  const folds = await p.ev(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); let n = 0; for (let k = 0; k < 6; k++) { for (const d of document.querySelectorAll('#story_suite_v2_overlay details:not([open])')) { d.open = true; n++; } await W(300); } return n; });
  log(`  settings folds opened: ${folds}`);
  await note('settings', await audit(p, { forbid }));
  if (shots) await p.shot(`${OUT}/shots/${tag}-settings.jpg`, 35);
  await cl('settings', '#story_suite_v2_overlay');
  await p.ev(() => { const o = document.querySelector('#story_suite_v2_overlay'); if (o && !o.hidden) [...o.querySelectorAll('button')].find(b => /close/i.test(b.textContent + b.title + (b.getAttribute('aria-label') ?? '')))?.click(); }); await W(500);
  await p.ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))); await W(300);
  // cards under replies: open all
  const cards = await p.ev(async () => { let n = 0; for (const d of document.querySelectorAll('#chat .mes details:not([open])')) { d.open = true; n++; } await new Promise(r => setTimeout(r, 600)); return n; });
  log(`  cards opened: ${cards}`);
  await note('chat-cards', await audit(p, { forbid }));
  return problems;
}
