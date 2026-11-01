// U6 mockup: Encounters (pack cast + backdrop, code-rolled). node mock.mjs d|p
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const CSS = `
.u6-enc{display:grid;gap:8px;padding:4px 0 10px}
.u6-card{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(160,130,255,.55);background:rgba(160,130,255,.08);font-size:13px;line-height:1.45}
.u6-card.gen{border-color:rgba(120,190,170,.55);background:rgba(120,190,170,.07)}
.u6-ico{font-size:18px;line-height:1.2}
.u6-card b{font-size:13.5px}
.u6-meta{grid-column:2;font-size:12px;opacity:.8}
.u6-tag{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.25);margin-left:6px;white-space:nowrap}
.u6-sec{display:grid;gap:8px}
.u6-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13px;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)}
.u6-note{font-size:12px;opacity:.75;margin:0;line-height:1.45}
.u6-seg{display:flex;gap:6px;flex-wrap:wrap}
.u6-seg button{all:unset;cursor:pointer;padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);font-size:13px}
.u6-seg button[aria-pressed=true]{background:#6d5ce6;border-color:#8b7cf6;color:#fff}
.u6-fields{display:grid;gap:12px;padding:10px 0}
.u6-field{display:grid;gap:4px}.u6-field b{font-size:13.5px}.u6-field small{font-size:12px;opacity:.75;line-height:1.4}
.u6-check{display:flex;gap:8px;align-items:center;font-size:13px}
.u6-badge{display:inline-block;margin-left:8px;font-size:12px;padding:1px 9px;border-radius:999px;background:rgba(160,130,255,.18);color:#c9b8ff;border:1px solid rgba(160,130,255,.5);vertical-align:middle}
.u6-first{margin:10px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(160,130,255,.35);background:rgba(160,130,255,.08);font-size:13px;line-height:1.5}
.u6-first h5{margin:0 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
`;
await page.addStyleTag({ content: CSS });
const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png` }); };
const openLastCard = async html => {
  await page.evaluate(() => { const last = [...document.querySelectorAll('.mes')].pop(); last.querySelector('.rpg-battle')?.remove(); });
  const head = page.locator('.mes').last().locator('.ss-card-head').first();
  if ((await head.getAttribute('aria-expanded')) !== 'true') { await head.click(); await page.waitForTimeout(1200); }
  await page.evaluate(html => {
    const last = [...document.querySelectorAll('.mes')].pop(); const card = last.querySelector('.ss-card');
    card.querySelector('.u6-enc')?.remove();
    const sum = card.querySelector('.ss-card-summary'); if (sum) sum.textContent = html.summary;
    const box = document.createElement('div'); box.className = 'u6-enc'; box.innerHTML = html.body; card.querySelector('.ss-card-body').prepend(box);
    last.scrollIntoView({ block: 'end' });
  }, html);
  await page.waitForTimeout(400);
};
// E1: a cast encounter
await openLastCard({ summary: 'Encounter: Fenna (Ersveil cast) · 7:40 pm, Bluewatch docks', body: `<div class="u6-card"><span class="u6-ico">✦</span><div><b>Encounter: Fenna</b><span class="u6-tag">Ersveil cast · first meeting</span></div><span class="u6-meta">Bluewatch docks, evening · rolled 3 on d20 (1–4 meets someone here) · Fenna was the pick for the docks at night. The narrator is told to bring her in this reply. A swipe rolls again; Re-read keeps it.</span></div>` });
await shot('E1-cast-encounter');
// E2: a backdrop (generated) encounter
await openLastCard({ summary: 'Encounter: Odvar Kell, a smuggler · 7:40 pm, Bluewatch docks', body: `<div class="u6-card gen"><span class="u6-ico">✧</span><div><b>Encounter: Odvar Kell</b><span class="u6-tag">smuggler · from the docks backdrop</span></div><span class="u6-meta">Rolled by code from the Bluewatch docks backdrop: role smuggler (common), river-folk name, traits weathered and owes the guild, starting stance Rival. The narrator makes him real; if he matters, NPC State Delta keeps a dossier from here on.</span></div>` });
await shot('E2-backdrop-encounter');
// E3: World → Now: Around here
await gameview(page, 'World');
await page.evaluate(() => {
  const here = document.querySelector('.wv-here');
  const s = document.createElement('section'); s.className = 'sd-kind ss-glass u6-sec';
  s.innerHTML = `<h4 class="ss-label wv-label sd-h">Around here <small>Bluewatch docks · evening</small></h4>
   <div class="u6-row"><span>Chance of meeting someone</span><b>about 1 reply in 5</b></div>
   <div class="u6-row"><span>Who you may meet</span><span>ferry hands, smugglers, guild clerks, a river priestess</span></div>
   <div class="u6-row"><span>Met from the Ersveil cast</span><b>3 of 12</b></div>
   <p class="u6-note">Cast members you have not met stay hidden. Turn encounters off or make them rarer in Settings → Modules → Story Director → Encounters. No encounters are rolled during a fight.</p>`;
  here.after(s);
});
if (ph) await page.evaluate(() => document.querySelector('.u6-sec')?.scrollIntoView({ block: 'start' }));
await shot('E3-world-around');
// E4: first meeting in the dossier (NSD reads SD's cast entry)
await page.locator('.npc-state-delta-present-card').first().click(); await page.waitForTimeout(1800);
await page.evaluate(() => {
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,strong,b')].filter(n => n.textContent.trim() === 'Fenna' && n.getBoundingClientRect().width > 0);
  const h = heads[heads.length - 1]; if (h && !h.querySelector('.u6-badge')) { const b = document.createElement('span'); b.className = 'u6-badge'; b.textContent = 'Ersveil cast'; h.append(b); }
  const cur = [...document.querySelectorAll('*')].find(n => n.childElementCount === 0 && /^CURRENT DOSSIER$/i.test(n.textContent.trim()) && n.getBoundingClientRect().width > 0);
  const box = document.createElement('section'); box.className = 'u6-first';
  box.innerHTML = `<h5>From the Ersveil cast · first met Gw 12 at the docks</h5>Her look, voice, history and the stages of her story come from the pack, so she is the same in every playthrough. Her relationship with you starts at the pack's values (Companion meters) and grows from what happens.`;
  (cur?.parentElement ?? document.body).append(box);
});
await shot('E4-dossier-cast');
await page.keyboard.press('Escape'); await page.waitForTimeout(700); await page.keyboard.press('Escape'); await page.waitForTimeout(700);
// E5: Settings → Modules → Story Director → Encounters
await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
await page.locator('.ss-tabs-item', { hasText: 'Modules' }).first().click(); await page.waitForTimeout(900);
await page.evaluate(() => { for (const d of document.querySelectorAll('details.ss-module-card')) d.open = /Story Director/i.test(d.querySelector('summary')?.textContent); });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const c = [...document.querySelectorAll('details.ss-module-card')].find(d => /Story Director/i.test(d.querySelector('summary')?.textContent));
  const fold = [...c.querySelectorAll('details')].find(d => /NPC initiative/i.test(d.querySelector('summary')?.textContent ?? ''));
  const e = (fold ?? c.querySelector('details')).cloneNode(false); e.open = true;
  e.innerHTML = `<summary class="ss-section-head"><span class="ss-label ss-section-title">Encounters</span><small class="ss-section-hint">Normal · from the Ersveil pack</small></summary>
  <div class="u6-fields">
   <div class="u6-field"><b>How often</b><div class="u6-seg"><button type="button" aria-pressed="false">Off</button><button type="button" aria-pressed="false">Rare</button><button type="button" aria-pressed="true">Normal</button><button type="button" aria-pressed="false">Often</button></div><small>The pack sets the chance for each place and time; this scales it. Rare halves it, Often doubles it. Never during a fight.</small></div>
   <label class="u6-check"><input type="checkbox" checked> Meet the pack's cast (hand-written people)</label>
   <label class="u6-check"><input type="checkbox" checked> Meet new people from the pack's backdrop</label>
   <small class="u6-note">Encounters need a pack that has them (Ersveil). Without one, nothing is rolled and people come from the story as today.</small>
  </div>`;
  (fold ?? c.querySelector('details')).before(e);
  e.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(500);
await shot('E5-settings');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
