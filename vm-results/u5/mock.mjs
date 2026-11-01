// U5 mockup: Key people (Story Director owns; NPC State Delta pulls and evolves the dossier). node mock.mjs d|p
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const CSS = `
.u5-key{display:grid;gap:8px}
.u5-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 10px;align-items:start;padding:8px 0;border-top:1px solid rgba(255,255,255,.08)}
.u5-star{color:#f5c84b;font-size:15px;line-height:1.3}
.u5-name{font-weight:700}
.u5-sub{grid-column:2;font-size:12.5px;opacity:.8;line-height:1.45}
.u5-pill{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.2);white-space:nowrap}
.u5-pill.away{border-color:rgba(120,170,255,.6);color:#a9c6ff}
.u5-pill.here{border-color:rgba(80,200,140,.6);color:#86e0b0}
.u5-note{font-size:12px;opacity:.75;margin:0}
.u5-unpin{all:unset;cursor:pointer;min-height:0!important;height:auto!important;width:auto!important;border-radius:999px!important;line-height:1.4;font-size:12px;opacity:.8;padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.18)}
.u5-keytag{position:absolute;top:6px;right:6px;font-size:11px;padding:1px 7px;border-radius:999px;background:rgba(245,200,75,.18);color:#f5c84b;border:1px solid rgba(245,200,75,.5)}
.u5-badge{display:inline-block;margin-left:8px;font-size:12px;padding:1px 9px;border-radius:999px;background:rgba(245,200,75,.18);color:#f5c84b;border:1px solid rgba(245,200,75,.5);vertical-align:middle}
.u5-away{margin:10px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(120,170,255,.35);background:rgba(120,170,255,.08);font-size:13px;line-height:1.5}
.u5-away h5{margin:0 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.u5-away ol{margin:0;padding-left:18px;display:grid;gap:3px}
.u5-fields{display:grid;gap:10px;padding:10px 0}
.u5-field{display:grid;grid-template-columns:${ph ? '1fr' : 'minmax(0,1fr) 140px'};gap:4px 12px;align-items:center}
.u5-field b{font-size:13.5px}.u5-field small{grid-column:1;font-size:12px;opacity:.75;line-height:1.4}
.u5-field input{width:120px;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:inherit}
.u5-chip{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;border:1px solid rgba(245,200,75,.5);font-size:13px}
.u5-chip.gone{border-color:rgba(255,255,255,.2);opacity:.85}
`;
await page.addStyleTag({ content: CSS });
const shot = async (name, full = false) => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png`, fullPage: full }); };
// 1. World → Now: Key people section + Key tag on the present card
await gameview(page, 'World');
await page.evaluate(() => {
  const here = document.querySelector('.wv-here');
  const card = here.querySelector('.npc-state-delta-present-cell'); if (card) { card.style.position = 'relative'; const t = document.createElement('span'); t.className = 'u5-keytag'; t.textContent = '★ Key'; card.append(t); }
  const s = document.createElement('section'); s.className = 'sd-kind ss-glass u5-key'; s.setAttribute('aria-label', 'Key people');
  const row = (name, pill, cls, sub) => `<div class="u5-row"><span class="u5-star" aria-hidden="true">★</span><div><span class="u5-name">${name}</span> <span class="u5-pill ${cls}">${pill}</span></div><button class="u5-unpin" type="button">Unpin</button><span class="u5-sub">${sub}</span></div>`;
  s.innerHTML = `<h4 class="ss-label wv-label sd-h">Key people <small>3 of 10</small></h4>
   ${row('Ren', 'Away · back Gw 18', 'away', 'Scouting the north road for the guild. Last news Gw 14: reached Wolfmere Outpost.')}
   ${row('Odda', 'Away · back Gw 21', 'away', 'Guild master, at the Seal council in Auvoth.')}
   ${row('Fenna', 'Here', 'here', 'Ferrywoman. Present at the guild hall.')}
   <p class="u5-note">Key people who are away are told to the narrator each reply: about 70 tokens now, of a 300-token budget. Pin someone with ★ on their card; archiving their dossier or their death unpins them.</p>`;
  here.after(s);
});
if (ph) await page.evaluate(() => document.querySelector('.u5-key')?.scrollIntoView({ block: 'start' }));
await shot('K1-world-key');
// 2. Dossier with Key badge + While away timeline (full mode with NPC State Delta)
await page.locator('.npc-state-delta-present-card').first().click(); await page.waitForTimeout(1800);
await page.evaluate(() => {
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,strong,b')].filter(n => n.textContent.trim() === 'Fenna' && n.getBoundingClientRect().width > 0);
  const h = heads[heads.length - 1]; if (h && !h.querySelector('.u5-badge')) { const b = document.createElement('span'); b.className = 'u5-badge'; b.textContent = '★ Key person'; h.append(b); }
  const cur = [...document.querySelectorAll('*')].find(n => n.childElementCount === 0 && /^CURRENT DOSSIER$/i.test(n.textContent.trim()) && n.getBoundingClientRect().width > 0);
  const box = document.createElement('section'); box.className = 'u5-away';
  box.innerHTML = `<h5>While away · Gw 9 – Gw 11 (from Story Director)</h5><ol><li>Gw 9: took the night ferry to Hollin's Reach with a sealed parcel.</li><li>Gw 10: turned back a toll-gang at the weir with the boatmen.</li><li>Gw 11: came home soaked, the parcel delivered.</li></ol><p class="u5-note" style="margin-top:6px">Her feelings toward you did not change while she was away. The narrator gets this and her dossier when she returns.</p>`;
  (cur?.parentElement ?? document.body).append(box);
});
await shot('K2-dossier-away');
await page.keyboard.press('Escape'); await page.waitForTimeout(700); await page.keyboard.press('Escape'); await page.waitForTimeout(700);
// 3. This reply: Ren returns, Mara unpinned (died)
await page.evaluate(() => { const last = [...document.querySelectorAll('.mes')].pop(); last.querySelector('.rpg-battle')?.remove(); last.scrollIntoView({ block: 'end' }); });
await page.locator('.mes').last().locator('.ss-card-head').first().click(); await page.waitForTimeout(1200);
await page.evaluate(() => {
  const last = [...document.querySelectorAll('.mes')].pop();
  const card = last.querySelector('.ss-card');
  const sum = card.querySelector('.ss-card-summary'); if (sum) sum.textContent = 'Ren is back · Mara is no longer a key person · 2:10 pm, Bluewatch Village';
  const body = card.querySelector('.ss-card-body');
  const box = document.createElement('div'); box.style.cssText = 'display:grid;gap:8px;padding:4px 0 10px';
  box.innerHTML = `<div class="u5-chip">★ <span><b>Ren is back</b> from scouting the north road (key person, away Gw 12 – Gw 18).</span></div><div class="u5-chip gone">★ <span><b>Mara</b> is no longer a key person: she died (Gw 18).</span></div>`;
  body.prepend(box);
  last.scrollIntoView({ block: 'end' });
});
await page.waitForTimeout(400);
await shot('K3-this-reply');
// 4. Settings → Modules → Story Director: Key people
await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
await page.locator('.ss-tabs-item', { hasText: 'Modules' }).first().click(); await page.waitForTimeout(900);
await page.evaluate(() => {
  for (const d of document.querySelectorAll('details.ss-module-card')) d.open = /Story Director/i.test(d.querySelector('summary')?.textContent);
});
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const c = [...document.querySelectorAll('details.ss-module-card')].find(d => /Story Director/i.test(d.querySelector('summary')?.textContent));
  const fold = [...c.querySelectorAll('details')].find(d => /NPC initiative/i.test(d.querySelector('summary')?.textContent ?? ''));
  const kp = (fold ?? c.querySelector('details')).cloneNode(false); kp.open = true;
  kp.innerHTML = `<summary class="ss-section-head"><span class="ss-label ss-section-title">Key people</span><small class="ss-section-hint">up to 10 · 300 tokens</small></summary>
  <div class="u5-fields">
   <label class="u5-field"><b>How many key people</b><input type="number" value="10" min="0"><small>Pinned people whose off-screen story keeps going, in Lean too. Archiving a dossier or a death unpins them.</small></label>
   <label class="u5-field"><b>Narrator budget for key people (tokens)</b><input type="number" value="300" min="0"><small>No upper limit. When those away need more, the ones returning soonest or whose story just moved are told first. Story Suite's overall budget (Settings → Tabs & Packs, now 1,500) still caps everything sent each reply.</small></label>
  </div>`;
  (fold ?? c.querySelector('details')).before(kp);
  kp.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(500);
await shot('K4-settings');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
