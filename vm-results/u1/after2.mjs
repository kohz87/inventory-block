// U2 part 2: Features preset (3) and NSD Expert fold (4). node after2.mjs d|p
import { boot, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const TALL = '.ss-settings{height:auto!important;max-height:none!important;top:16px!important;bottom:auto!important} .ss-settings-content,.ss-settings-pane,.ss-settings-page{overflow:visible!important;max-height:none!important;height:auto!important}';
const CSS = `
.u2-preset{display:grid;gap:10px;margin:0 0 18px}
.u2-preset-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.u2-preset-head b{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.u2-preset-head small{opacity:.7;font-size:12px}
.u2-tiles{display:grid;grid-template-columns:repeat(${ph ? 1 : 3},minmax(0,1fr));gap:10px}
.u2-tile{all:unset;box-sizing:border-box;cursor:pointer;display:grid;gap:6px;align-content:start;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03)}
.u2-tile[aria-checked=true]{border-color:#8b7cf6;background:rgba(139,124,246,.16);box-shadow:inset 0 0 0 1px #8b7cf6}
.u2-tile-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.u2-tile-top b{font-size:15px}
.u2-dot{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);box-sizing:border-box;flex:none}
.u2-tile[aria-checked=true] .u2-dot{border:5px solid #8b7cf6;background:#fff}
.u2-tile p{margin:0;font-size:12.5px;line-height:1.45;opacity:.85}
.u2-tok{font-size:12px;font-weight:700;opacity:.95}
.u2-tok i{font-style:normal;opacity:.7;font-weight:500}
.u2-fine{margin:6px 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
.u2-note{margin:0;font-size:12px;opacity:.7}
`;
await page.addStyleTag({ content: CSS });
await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
const tab = async name => { await page.locator('.ss-tabs-item', { hasText: name }).first().click(); await page.waitForTimeout(900); };
const tall = async (file) => {
  const st = await page.addStyleTag({ content: TALL }); await page.waitForTimeout(500);
  const h = await page.evaluate(() => Math.ceil(document.querySelector('.ss-settings').getBoundingClientRect().height + 60));
  await page.setViewportSize({ width: VP.width, height: Math.max(VP.height, Math.min(7000, h)) }); await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${file}` });
  await st.evaluate(n => n.remove()); await page.setViewportSize(VP); await page.waitForTimeout(400);
};
// ---- 3: Features preset
await tab('Features');
await page.evaluate(() => {
  for (const d of document.querySelectorAll('.ss-features details')) d.open = false;
  const f = document.querySelector('.ss-features');
  const T = [
    ['lean', 'Lean', 'Inventory, money, place, people, quests and time. No world-building threads or travel. NPC scan every 3 replies.', '≈ 740', 'tokens of rules each reply'],
    ['standard', 'Standard', 'Today\'s defaults: Lean plus world events, factions, clocks, secrets, weather, your look and travel.', '≈ 1,310', 'tokens of rules each reply'],
    ['full', 'Full', 'Standard plus Choices, Inner chatter and a check roll before each reply.', '≈ 1,390', 'tokens, plus one extra call'],
  ];
  const box = document.createElement('div'); box.className = 'u2-preset';
  box.innerHTML = `<div class="u2-preset-head"><b>How much to track</b><small>Your saved story is never deleted</small></div>
   <div class="u2-tiles" role="radiogroup" aria-label="How much to track">${T.map(([id, n, d, t, u]) => `<button type="button" class="u2-tile" role="radio" aria-checked="${id === 'standard'}"><span class="u2-tile-top"><b>${n}</b><span class="u2-dot"></span></span><p>${d}</p><span class="u2-tok">${t} <i>${u}</i></span></button>`).join('')}</div>
   <p class="u2-note">Change any switch below and this shows <b>Custom</b>.</p>
   <div class="u2-fine">Fine-tune</div>`;
  f.prepend(box);
});
await page.mouse.move(1, 1); await page.waitForTimeout(500);
await tall(`C1-features-preset-${v}.png`);
// ---- 4: NSD Expert fold
await tab('Modules');
await page.evaluate(() => { document.querySelector('details.ss-module-card').open = true; });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const find = t => [...document.querySelectorAll('details.delta-settings-group')].find(d => d.querySelector('summary b')?.textContent.trim() === t);
  const scan = find('Scanning'); const parent = scan.parentElement;
  for (const d of parent.querySelectorAll(':scope > details')) d.open = false;
  const ex = document.createElement('details'); ex.className = 'delta-settings-group story-suite-fold u2-expert';
  ex.innerHTML = `<summary><b>Expert</b><small>Source of truth, calendar, scanner rules, what's sent, advanced</small></summary><div class="delta-settings-group-body story-suite-fold-body"><p class="npc-state-delta-muted">Rarely needed. With Story Director installed its calendar is used, so the calendar here only matters on its own.</p></div>`;
  const body = ex.querySelector('.delta-settings-group-body');
  for (const t of ['Source of truth', 'Calendar & birthdays', 'Scanner rules', 'What\'s sent', 'Advanced']) { const d = find(t); if (d) body.append(d); }
  parent.append(ex);
});
await page.mouse.move(1, 1); await page.waitForTimeout(500);
await tall(`D1-nsd-expert-${v}.png`);
await page.evaluate(() => { document.querySelector('.u2-expert').open = true; });
await page.waitForTimeout(500);
await tall(`D2-nsd-expert-open-${v}.png`);
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
