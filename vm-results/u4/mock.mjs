// U4 mockup: the Standard stat formula. node mock.mjs d|p
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const CSS = `
.u4-card{display:grid;gap:10px}
.u4-seg{display:flex;flex-wrap:wrap;gap:6px}
.u4-table{width:100%;border-collapse:collapse;font-size:12.5px}
.u4-table td{padding:5px 6px;border-top:1px solid rgba(255,255,255,.09);vertical-align:top}
.u4-table td:first-child{white-space:nowrap;font-weight:700;width:1%}
.u4-tw{overflow-x:auto}
.u4-nums{display:grid;grid-template-columns:repeat(${ph ? 2 : 4},minmax(0,1fr));gap:8px}
.u4-num{border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px 10px;font-size:12px;opacity:.95}
.u4-num b{display:block;font-size:16px}
.u4-hint{font-size:12px;opacity:.8;line-height:1.5;margin:6px 0 0}
.u4-order{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px;font-size:13px}
.u4-order .ss-pill b{margin-left:4px}
.u4-why{display:block!important;font-size:12px;opacity:.85;margin:2px 0 6px 18px}
.u4-skip{opacity:.7;font-style:italic}
[role=dialog]:has(.ss-w-rpg-wizard), .ss-dialog:has(.ss-w-rpg-wizard){background:#1c1e2a!important;backdrop-filter:none!important}
:has(> .ss-w-rpg-wizard){background:#1c1e2a!important}
`;
await page.addStyleTag({ content: CSS });
const shot = async (name, full = false) => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png`, fullPage: full }); };
const cells = (meter, n, on, word) => { const m = meter.querySelector('.ss-w-meter-cells'); if (!m) return; m.innerHTML = Array.from({ length: n }, (_, i) => `<span class="ss-w-meter-cell${i < on ? ' ss-w-on' : ''}"></span>`).join(''); const t = meter.querySelector('.ss-w-meter-track'); t.style.setProperty('--ss-w-segments', n); t.style.setProperty('--ss-w-ratio', on / n); if (word) { const val = meter.querySelector('.ss-w-meter-value'); if (val) val.textContent = word; } };
await page.exposeFunction('noop', () => {});
// 1. Party: new-scale stats, bars with different block counts
await gameview(page, 'Party');
await page.evaluate(() => {
  const card = document.querySelector('.rpg-card[data-character="Wessel"]');
  const stats = { str: 10, vit: 10, agi: 10, dex: 6, int: 5, luk: 3, cha: 5 };
  for (const [k, val] of Object.entries(stats)) { const t = card.querySelector(`.rpg-stat[data-stat="${k}"] b`); if (t) t.textContent = String(val); }
  const pills = card.querySelector('.rpg-points'); if (pills) pills.textContent = '4 points to spend';
  const bars = card.querySelectorAll('.rpg-bar');
  const set = (key, n, on, word) => { const b = card.querySelector(`.rpg-bar[data-bar="${key}"] .ss-w-meter`); if (!b) return; const m = b.querySelector('.ss-w-meter-cells'); m.innerHTML = Array.from({ length: n }, (_, i) => `<span class="ss-w-meter-cell${i < on ? ' ss-w-on' : ''}"></span>`).join(''); const t = b.querySelector('.ss-w-meter-track'); t.style.setProperty('--ss-w-segments', n); t.style.setProperty('--ss-w-ratio', on / n); const val = b.querySelector('.ss-w-meter-value'); if (val && word) val.textContent = word; };
  set('health', 6, 4, 'Hurt · 4 of 6'); set('stamina', 5, 2, 'Tired · 2 of 5'); set('mana', 4, 4, 'Fresh · 4 of 4');
  const skills = card.querySelector('.rpg-skills'); if (skills) skills.textContent = 'Iaijutsu (Expert, AGI) · Shadow step (Novice, AGI) · Weakness (Novice, INT)';
  const h = document.createElement('p'); h.className = 'u4-hint'; h.innerHTML = 'Health 6 blocks (VIT 10, next at 15) · Stamina 5 (AGI 10, next at 15) · Mana 4 (INT 5, next at 10) · Luck 0 (next at LUK 13)';
  skills.after(h);
});
await page.evaluate(() => document.querySelector('.rpg-card')?.scrollIntoView({ block: 'start' }));
await shot('C1-party-bars');
// 2. Fight: turn order + foe health by class
await gameview(page, 'Fight');
await page.evaluate(() => {
  const f = document.querySelector('.ss-w-rpg-fight');
  const foes = f.querySelector('.rpg-foes'); const rat = foes.querySelector('.rpg-foe');
  const drake = rat.cloneNode(true); drake.dataset.foe = 'Weir-drake';
  drake.querySelector('.rpg-name').textContent = 'Weir-drake'; drake.querySelector('.ss-pill').textContent = 'Class IV';
  const dm = drake.querySelector('.ss-w-meter'); const m = dm.querySelector('.ss-w-meter-cells'); m.innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="ss-w-meter-cell${i < 5 ? ' ss-w-on' : ''}"></span>`).join(''); dm.querySelector('.ss-w-meter-track').style.setProperty('--ss-w-segments', 6); dm.querySelector('.ss-w-meter-value').textContent = 'Scratched · 5 of 6';
  const rv = rat.querySelector('.ss-w-meter-value'); if (rv) rv.textContent = 'Badly wounded · 1 of 5';
  foes.prepend(drake);
  const h = f.querySelector('.rpg-fight-h');
  const o = document.createElement('div'); o.className = 'u4-order';
  o.innerHTML = `<b>Turn order</b> <span class="ss-pill">1 Wessel <b>21</b></span><span class="ss-pill">2 Weir-drake <b>18</b></span><span class="ss-pill">3 Sluice Rat ×2 <b>17</b></span><span class="ss-pill">4 Ren <b>14</b></span><span class="ss-pill">5 Mara <b>9</b></span><span class="u4-hint" style="margin:0">Rolled at the start of this fight (d20 + class + AGI/2; foes d20 + 2 × class). A swipe rolls it again.</span>`;
  h.before(o);
  const wp = [...f.querySelectorAll('.rpg-fight-party > *, .rpg-fight-party article')].find(n => /^Wessel/.test(n.textContent.trim()));
  if (wp) { const ms = wp.querySelectorAll('.ss-w-meter'); const spec = { Health: [6, 4, 'Hurt · 4 of 6'], Mana: [4, 4, 'Fresh · 4 of 4'], Stamina: [5, 2, 'Tired · 2 of 5'] };
    for (const m of ms) { const lab = m.getAttribute('aria-label'); const sp = spec[lab]; if (!sp) continue; m.querySelector('.ss-w-meter-cells').innerHTML = Array.from({ length: sp[0] }, (_, i) => `<span class="ss-w-meter-cell${i < sp[1] ? ' ss-w-on' : ''}"></span>`).join(''); m.querySelector('.ss-w-meter-track').style.setProperty('--ss-w-segments', sp[0]); const val = m.querySelector('.ss-w-meter-value'); if (val) val.textContent = sp[2]; } }
  const note = f.querySelector('.rpg-fight-note'); if (note) note.textContent = 'Foe Health grows with class: 4 + class/2 blocks. A hit takes 1 block, a Decisive hit 2.';
});
await shot('C2-fight-order');
await page.keyboard.press('Escape'); await page.waitForTimeout(700);
// 3. Battle log in the reply
await page.evaluate(() => {
  const b = document.querySelector('.rpg-battle'); b.scrollIntoView({ block: 'start' });
  const body = b.querySelector('.rpg-bl-body');
  const line = (text, out, cls, why) => `<div class="rpg-act"><button class="rpg-act-line" type="button" aria-expanded="${why ? 'true' : 'false'}"><span class="rpg-act-mark" aria-hidden="true">${why ? '▾' : '▸'}</span><span class="rpg-act-text">${text} — <span class="rpg-out rpg-out-${cls}">${out}</span></span></button>${why ? `<p class="rpg-why u4-why">${why}</p>` : ''}</div>`;
  body.innerHTML = `<p class="rpg-bl-order">Turn order: Wessel 21 &gt; Weir-drake 18 &gt; Sluice Rat ×2 17 &gt; Ren 14</p>
  <div class="rpg-bl-round"><p class="rpg-bl-round-title">Round 1</p>
  ${line('Wessel uses Iaijutsu on Weir-drake', 'Success (29 vs 24)', 'success', 'Physical: d20 17 + (AGI 10 + DEX 6/2)/2 = 6 + Expert 2 + Class II 4 = 29 · vs Weir-drake d20 9 + 3 + Class IV 12 = 24. Weir-drake loses 1 block (4 of 6).')}
  ${line('Weir-drake attacks Wessel (dodge, Shadow step)', 'Blocked (22 vs 19)', 'blocked', 'Defence, dodge (AGI 10 is not below VIT 10, Shadow step uses AGI): d20 10 + (AGI 10 + VIT 10/2)/2 = 7 + Novice 0 + Class II 4 + luck 0 + edge +1 = 22 · vs d20 4 + 3 + Class IV 12 = 19.')}
  ${line('Ren uses Sweep on Sluice Rat ×2 (area)', 'A: Decisive (27 vs 18) · B: Fail (27 vs 29)', 'success', 'One attack roll, each target defends on its own: Ren d20 18 + (STR 10 + DEX 7/2)/2 = 6 + Adept 1 + Class I 2 = 27.')}
  <div class="rpg-act"><p class="rpg-act-text u4-skip">Sluice Rat A does not act: beaten before its turn.</p></div>
  ${line('Mara casts Mend on Wessel (support)', 'Success: Wessel heals 1 block (5 of 6)', 'success', '')}
  </div>`;
});
await page.waitForTimeout(400);
await shot('C3-battle-log');
// 4. Settings → RPG: formula choice
await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
await page.locator('.ss-tabs-item', { hasText: 'RPG' }).first().click(); await page.waitForTimeout(1000);
await page.evaluate(() => {
  const first = document.querySelector('.rpg-set-card');
  const c = first.cloneNode(false); c.classList.add('u4-card');
  c.innerHTML = `<h3 style="margin:0">Stat formula</h3>
  <div class="u4-seg"><button class="ss-button ss-button-primary" type="button" aria-pressed="true">Standard</button><button class="ss-button" type="button" aria-pressed="false">Classic</button></div>
  <p class="u4-hint" style="margin:0">Standard: a main stat plus half a second one, stats start at 5 and grow, and bars grow with VIT, AGI and INT. Classic: one stat, stats start at 10, fixed bars. Past rolls keep the numbers they were made with.</p>
  <div class="u4-tw"><table class="u4-table"><tbody>
  <tr><td>Physical</td><td>d20 + class + (STR or the skill's stat + DEX/2)/2 + rank + edge</td></tr>
  <tr><td>Magic</td><td>d20 + class + (INT×2 or the skill's stat + DEX/2)/2 + rank + edge</td></tr>
  <tr><td>Defence</td><td>d20 + class + (higher of AGI/VIT + lower/2)/2 + rank + edge · against magic: INT/VIT</td></tr>
  <tr><td>Social</td><td>d20 + class + (CHA + INT/2)/2 + rank + edge</td></tr>
  <tr><td>Checks</td><td>d20 + class + (the fitting stat + DEX/2)/2 + rank + edge</td></tr>
  <tr><td>Turn order</td><td>d20 + class + AGI/2, once at the start of a fight</td></tr>
  </tbody></table></div>
  <div class="u4-nums"><div class="u4-num"><b>5</b>Stats start at</div><div class="u4-num"><b>10</b>Points at creation</div><div class="u4-num"><b>4</b>Points per Soul Class</div><div class="u4-num"><b>3 + 3×class</b>Foe's base</div></div>
  <p class="u4-hint" style="margin:0">Class is 2 × Soul Class. LUK: luck +1 at 13, +2 at 16, +3 at 19 shrinks bad edges and raises the +3 cap. Bars: Health 4 + VIT/5, Stamina 3 + AGI/5, Mana 3 + INT/5 blocks.</p>`;
  first.before(c);
  const odds = [...document.querySelectorAll('.rpg-set-card *')].find(n => n.childElementCount === 0 && /Wessel \(STR 14/.test(n.textContent)); if (odds) odds.textContent = 'Wessel (Iaijutsu: AGI 10, DEX 6, Soul Class II, Expert) against a Class II foe';
});
await page.waitForTimeout(400);
await shot('C4-settings-formula');
// 5. New character: Stats step at 5
await page.keyboard.press('Escape'); await page.waitForTimeout(700);
await gameview(page, 'Party');
await page.locator('.ss-w-rpg-party button', { hasText: 'New character' }).first().click(); await page.waitForTimeout(1200);
await page.locator('[data-wiz=name]').fill('Tamsin');
await page.locator('[data-wiz=about]').fill('A ferry hand from Low Quay.');
const next = page.locator('button', { hasText: /^Next$/ }).last(); await next.click(); await page.waitForTimeout(1200);
await page.evaluate(() => {
  const w = document.querySelector('.ss-w-rpg-wizard');
  for (const el of w.querySelectorAll('.rpg-wiz-body *')) if (el.childElementCount === 0 && el.textContent.trim() === '10') el.textContent = '5';
  for (const inp of w.querySelectorAll('.rpg-wiz-body input')) if (inp.value === '10') inp.value = '5';
  const sum = w.querySelectorAll('.rpg-wiz-sum .rpg-wiz-k span'); if (sum[1]) sum[1].textContent = 'STR 5 · VIT 5 · AGI 5 · DEX 5 · INT 5 · LUK 5 · CHA 5';
  const push = w.querySelector('.rpg-wiz-push'); if (push) push.textContent = 'Points left: 10';
  for (const n of w.querySelectorAll('.rpg-wiz-body p, .rpg-wiz-body .rpg-wiz-note')) if (/6 points|from 8|up to 15|starts at 10/i.test(n.textContent)) n.textContent = 'Every stat starts at 5 and you have 10 points to spend. A stat can go down to 3 to free a point and up to 10. Soul Class rises give 4 more each.';
  const body = w.querySelector('.rpg-wiz-body'); const h = document.createElement('p'); h.className = 'u4-hint';
  h.textContent = 'Health 5 blocks (next at VIT 10) · Stamina 4 (next at AGI 10) · Mana 4 (next at INT 10) · Luck 0 (next at LUK 13)';
  body.append(h);
});
await shot('C5-new-stats');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
