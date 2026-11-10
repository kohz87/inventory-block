// U3 mockup: Export character (+ inventory, money) and Import in New character. node mock.mjs d|p
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const CSS = `
.u3-modal-back{position:fixed;inset:0;background:rgba(5,6,12,.62);z-index:99990}
.u3-modal{position:fixed;z-index:99991;left:50%;top:${ph ? '10px' : '50%'};transform:${ph ? 'translateX(-50%)' : 'translate(-50%,-50%)'};width:${ph ? 'calc(100vw - 20px)' : '560px'};max-height:calc(100vh - 40px);overflow:auto;background:#1c1e2a;border:1px solid rgba(255,255,255,.14);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#e8e8f0;font-size:14px}
.u3-modal header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1)}
.u3-modal header b{font-size:16px}
.u3-modal .u3-body{padding:14px 18px;display:grid;gap:12px}
.u3-modal footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid rgba(255,255,255,.1)}
.u3-opt{display:grid;grid-template-columns:22px minmax(0,1fr);gap:4px 10px;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.03)}
.u3-opt input{margin:2px 0 0;width:16px;height:16px;accent-color:#8b7cf6}
.u3-opt b{font-size:14px}
.u3-opt small{grid-column:2;opacity:.8;font-size:12.5px;line-height:1.45}
.u3-note{margin:0;font-size:12.5px;opacity:.75;line-height:1.45}
.u3-modal footer .u3-file{display:${ph ? 'none' : 'inline'}}
.u3-file{font-family:ui-monospace,monospace;font-size:12.5px;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,.08)}
.u3-import{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 12px;margin:0 0 12px;border:1px dashed rgba(139,124,246,.6);border-radius:12px;font-size:13px}
.u3-import span{flex:1 1 200px;opacity:.85}
.u3-done{padding:10px 12px;margin:0 0 12px;border-radius:12px;background:rgba(80,200,140,.12);border:1px solid rgba(80,200,140,.45);font-size:13px;line-height:1.5}
.u3-done b{color:#7fe0ae}
.u3-review{display:grid;gap:10px;font-size:13.5px}
.u3-review .row{display:grid;grid-template-columns:${ph ? '1fr' : '130px minmax(0,1fr)'};gap:2px 12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.u3-review .row small{opacity:.7;text-transform:uppercase;letter-spacing:.06em;font-size:11px}
.u3-also{padding:10px 12px;border-radius:12px;background:rgba(139,124,246,.12);border:1px solid rgba(139,124,246,.45);font-size:13px;line-height:1.5}
.u3-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.22);color:#e8e8f0;font:600 14px system-ui,sans-serif;background:rgba(255,255,255,.04)}
.u3-btn.primary{background:#6d5ce6;border-color:#8b7cf6;color:#fff}
.u3-x{all:unset;cursor:pointer;width:36px;height:36px;display:grid;place-items:center;border-radius:10px;color:#e8e8f0}
[role=dialog]:has(.ss-w-rpg-wizard), .ss-dialog:has(.ss-w-rpg-wizard){background:#1c1e2a!important}
`;
await page.addStyleTag({ content: CSS });
const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png`, fullPage: false }); };
// A1: Export on each card
await gameview(page, 'Party');
await page.evaluate(() => {
  for (const card of document.querySelectorAll('.rpg-card')) {
    const row = [...card.querySelectorAll('button')].pop().parentElement;
    if (row.querySelector('.u3-export')) continue;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ss-button u3-export'; b.innerHTML = '<i class="fa-solid fa-file-export"></i> Export'; row.append(b);
  }
});
if (ph) await page.evaluate(() => document.querySelector('.rpg-card')?.scrollIntoView({ block: 'start' }));
await shot('A1-party-export');
// A2: Export dialog
await page.evaluate(ph => {
  const back = document.createElement('div'); back.className = 'u3-modal-back u3-tmp';
  const m = document.createElement('section'); m.className = 'u3-modal u3-tmp'; m.setAttribute('role', 'dialog');
  m.innerHTML = `<header><b>Export Wessel</b><button class="u3-x" type="button" aria-label="Close">✕</button></header>
  <div class="u3-body">
   <p class="u3-note">Saves a file you can import when you make a character in another chat. The name and who they are stay in this chat.</p>
   <label class="u3-opt"><input type="checkbox" checked disabled><b>Character</b><small>Soul Class II · 3 points to spend<br>STR 14 · VIT 12 · AGI 11 · DEX 10 · INT 8 · LUK 9 · CHA 10<br>Skills: Iron Breath (Expert) · Short blade (Novice)</small></label>
   <label class="u3-opt"><input type="checkbox" checked><b>Inventory · 4 things</b><small>Bedroll · Coil of Rope · Oilskin Coat (waxed, a little too big) · Torch ×2</small></label>
   <label class="u3-opt"><input type="checkbox" checked><b>Money · 5 silver</b><small>Kept as its value, so another game's coins show it in their own words.</small></label>
   <p class="u3-note">Not saved: the name, who they are, XP, Health, Mana and Stamina (a new character starts full), skill practice, and anything about the story.</p>
  </div>
  <footer><button class="u3-btn" type="button">Cancel</button><button class="u3-btn primary" type="button"><i class="fa-solid fa-download"></i> Save <span class="u3-file">wessel.character.json</span></button></footer>`;
  document.body.append(back, m);
}, ph);
await shot('A2-export-dialog');
await page.evaluate(() => document.querySelectorAll('.u3-tmp').forEach(n => n.remove()));
// B1: New character with Import row
await page.locator('.ss-w-rpg-party button', { hasText: 'New character' }).first().click(); await page.waitForTimeout(1200);
await page.evaluate(() => {
  const body = document.querySelector('.ss-w-rpg-wizard .rpg-wiz-body');
  const r = document.createElement('div'); r.className = 'u3-import';
  r.innerHTML = `<span>Start from a saved character: its stats, skills, inventory and money.</span><button class="ss-button" type="button"><i class="fa-solid fa-file-import"></i> Import file…</button>`;
  body.prepend(r);
});
await shot('B1-new-import');
// B2: after import: only stats, points, Soul Class, skills (+ inventory, money at Create)
await page.evaluate(() => {
  const w = document.querySelector('.ss-w-rpg-wizard');
  const r = w.querySelector('.u3-import'); const d = document.createElement('div'); d.className = 'u3-done';
  d.innerHTML = `<b>Imported</b> from <span class="u3-file">wessel.character.json</span>: stats, 3 unspent points, Soul Class II and 2 skills. When you press Create it also adds <b>4 things</b> and <b>5 silver</b> to this chat. Give the character a name and who they are below. <button class="ss-button" type="button" style="margin-left:6px">Undo import</button>`;
  r.replaceWith(d);
  w.querySelector('.rpg-wiz-sub').textContent = 'Companion · Soul Class II';
  const ks = w.querySelectorAll('.rpg-wiz-sum .rpg-wiz-k span'); if (ks[1]) ks[1].textContent = 'STR 14 · VIT 12 · AGI 11 · DEX 10 · INT 8 · LUK 9 · CHA 10'; if (ks[2]) ks[2].textContent = 'Iron Breath (Expert) · Short blade (Novice)';
  for (const n of w.querySelectorAll('.rpg-wiz-note')) if (/^Starts at Soul Class I/.test(n.textContent)) n.textContent = 'Starts at Soul Class II (imported) with 0 XP. Health, Mana and Stamina start full.';
  const push = w.querySelector('.rpg-wiz-push'); if (push) push.textContent = 'Points left: 3';
});
await shot('B2-imported');
// B3: Review
await page.evaluate(ph => {
  const w = document.querySelector('.ss-w-rpg-wizard');
  w.querySelector('.rpg-wiz-name').textContent = 'Ren'; w.querySelector('.rpg-wiz-ava').textContent = 'R';
  const body = w.querySelector('.rpg-wiz-body'); body.innerHTML = `<div class="u3-review">
   <div class="row"><small>Who</small><span>Ren · A companion · Soul Class II · 0 XP</span></div>
   <div class="row"><small>Stats</small><span>STR 14 · VIT 12 · AGI 11 · DEX 10 · INT 8 · LUK 9 · CHA 10 · 3 points to spend</span></div>
   <div class="row"><small>Skills</small><span>Iron Breath (Expert) · Short blade (Novice)</span></div>
   <div class="row"><small>Health</small><span>Full Health, Mana and Stamina</span></div>
   <div class="u3-also"><b>Also adds:</b> Combat rules, Foes · <b>4 things</b> carried by Ren (Bedroll, Coil of Rope, Oilskin Coat, Torch ×2) · <b>5 silver</b> to the purse. One swipe of this reply takes it all back.</div></div>`;
  const dlg = w.parentElement.parentElement.parentElement || document.body;
  const pick = t => { const c = [...document.querySelectorAll('*')].filter(n => n.textContent.trim() === t && !n.closest('.u3-review, .rpg-wiz-sum, .ss-gameview-hero, .ss-w-rpg-party') && n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().width < 140); const leaf = c.pop(); return leaf ? (leaf.closest('button,[role=tab],a,li') ?? leaf) : null; };
  const who = pick('Who'), rev = pick('Review');
  if (who && rev) { const a = who.className, b = rev.className; who.className = b; rev.className = a; for (const at of ['aria-selected', 'aria-current', 'aria-pressed']) { const x = who.getAttribute(at); if (x !== null) { who.setAttribute(at, rev.getAttribute(at) ?? 'false'); rev.setAttribute(at, x); } } }
  const next = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Next'); if (next) next.textContent = 'Create';
}, ph);
await shot('B3-review');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
