// U7 mockup: the pack cast lives off-screen (no backdrops, no dice encounters). node mock.mjs d|p
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const CSS = `
.u7-enc{display:grid;gap:8px;padding:4px 0 10px}
.u7-card{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(160,130,255,.55);background:rgba(160,130,255,.08);font-size:13px;line-height:1.45}
.u7-card.quiet{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.04)}
.u7-ico{font-size:18px;line-height:1.2}
.u7-card b{font-size:13.5px}
.u7-meta{grid-column:2;font-size:12px;opacity:.8}
.u7-tag{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.25);margin-left:6px;white-space:nowrap}
.u7-sec{display:grid;gap:8px}
.u7-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13px;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)}
.u7-note{font-size:12px;opacity:.75;margin:0;line-height:1.45}
.u7-seg{display:flex;gap:6px;flex-wrap:wrap}
.u7-seg button{all:unset;min-width:0!important;min-height:0!important;width:auto!important;height:auto!important;line-height:1.3!important;flex:0 0 auto!important;box-sizing:border-box;cursor:pointer;padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.2);font-size:13px}
.u7-seg button[aria-pressed=true]{background:#6d5ce6;border-color:#8b7cf6;color:#fff}
.u7-fields{display:grid;gap:12px;padding:10px 0}
.u7-field{display:grid;gap:4px}.u7-field b{font-size:13.5px}.u7-field small{font-size:12px;opacity:.75;line-height:1.4}
.u7-check{display:flex;gap:8px;align-items:center;font-size:13px}
.u7-badge{display:inline-block;margin-left:8px;font-size:12px;padding:1px 9px;border-radius:999px;background:rgba(160,130,255,.18);color:#c9b8ff;border:1px solid rgba(160,130,255,.5);vertical-align:middle}
.u7-first{margin:10px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(160,130,255,.35);background:rgba(160,130,255,.08);font-size:13px;line-height:1.5;display:grid;gap:6px}
.u7-first h5{margin:0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.u7-seg button,.u7-btn{position:relative;min-height:30px!important}
.u7-seg button::after,.u7-btn::after{content:"";position:absolute;left:0;right:0;top:50%;height:calc(44px / var(--ss-zoomed,1));transform:translateY(-50%)}
.u7-seg{row-gap:12px}
.u7-form .u7-check{display:flex}
.u7-form{display:grid;gap:10px;padding:12px 14px;border-radius:12px;border:1px solid rgba(160,130,255,.35);background:rgba(160,130,255,.06)}
.u7-form label{display:grid;gap:4px;font-size:12.5px;opacity:.95}
.u7-form input:not([type=checkbox]),.u7-form textarea{all:unset;box-sizing:border-box;width:100%;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);font-size:13px;line-height:1.4}
.u7-form textarea{min-height:52px;white-space:pre-wrap}
.u7-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.u7-acts{display:flex;gap:8px;justify-content:flex-end}
.delta-panel{background:rgb(28,30,42)!important}
.u7-btn{all:unset;min-width:0!important;min-height:0!important;width:auto!important;height:auto!important;line-height:1.3!important;flex:0 0 auto!important;box-sizing:border-box;cursor:pointer;justify-self:start;padding:4px 12px;border-radius:999px;border:1px solid rgba(160,130,255,.6);font-size:12.5px}
`;
await page.addStyleTag({ content: CSS });
const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png` }); };
const openLastCard = async html => {
  await page.evaluate(() => { const last = [...document.querySelectorAll('.mes')].pop(); last.querySelector('.rpg-battle')?.remove(); });
  const head = page.locator('.mes').last().locator('.ss-card-head').first();
  if ((await head.getAttribute('aria-expanded')) !== 'true') { await head.click(); await page.waitForTimeout(1200); }
  await page.evaluate(html => {
    const last = [...document.querySelectorAll('.mes')].pop(); const card = last.querySelector('.ss-card');
    card.querySelector('.u7-enc')?.remove();
    const sum = card.querySelector('.ss-card-summary'); if (sum) sum.textContent = html.summary;
    const box = document.createElement('div'); box.className = 'u7-enc'; box.innerHTML = html.body; card.querySelector('.ss-card-body').prepend(box);
    last.scrollIntoView({ block: 'end' });
  }, html);
  await page.waitForTimeout(400);
};
// C1: paths cross at the same place
await openLastCard({ summary: 'Paths crossed: Fenna · 7:40 pm, Bluewatch docks', body: `<div class="u7-card"><span class="u7-ico">✦</span><div><b>Paths crossed: Fenna</b><span class="u7-tag">Ersveil cast · first meeting</span></div><span class="u7-meta">Why: she works the night ferry at Bluewatch docks, and you are at the docks in the evening: your first time here while she is. No roll. The narrator is told to bring her in; a swipe rewrites the scene, not who you meet.</span></div>` });
await shot('C1-same-place');
// C2: their goal brings them to you
await openLastCard({ summary: 'Paths crossed: Sera · Gw 14, Bluewatch inn', body: `<div class="u7-card"><span class="u7-ico">✦</span><div><b>Paths crossed: Sera</b><span class="u7-tag">Ersveil cast · first meeting</span></div><span class="u7-meta">Why: her hunt for her brother's killer led her to the man you fought at the weir. She has come to Bluewatch looking for whoever beat him. Her goal pulls her to you, so she arrives; no roll.</span></div>` });
await shot('C2-goal-brings-them');
// C3: time skip, the cast moves on off-screen
await openLastCard({ summary: 'Three days pass · the cast moved on', body: `<div class="u7-card quiet"><span class="u7-ico">⟳</span><div><b>While time passed</b><span class="u7-tag">3 days</span></div><span class="u7-meta">9 cast members moved on off-screen (one short line each, only where something changed). You have not met them, so who and where stays hidden. Fenna, met: <i>took the ferry upriver to Ashford for the guild</i>.</span></div>` });
await shot('C3-time-passes');
// C4: World → Around here
await gameview(page, 'World');
await page.evaluate(() => {
  const here = document.querySelector('.wv-here');
  const s = document.createElement('section'); s.className = 'sd-kind ss-glass u7-sec';
  s.innerHTML = `<h4 class="ss-label wv-label sd-h">Around here <small>Bluewatch docks · evening</small></h4>
   <div class="u7-row"><span>Cast whose paths may cross yours here</span><b>2, not yet met</b></div>
   <div class="u7-row"><span>Cast you have met</span><span>Fenna, last heard: upriver at Ashford</span></div>
   <div class="u7-row"><span>Met from the Ersveil cast</span><b>3 of 12</b></div>
   <p class="u7-note">Unmet cast stays hidden. Anyone else you meet is made up by the story as today; if they matter, NPC State Delta keeps a dossier. No meetings during a fight.</p>`;
  here.after(s);
});
if (ph) await page.evaluate(() => document.querySelector('.u7-sec')?.scrollIntoView({ block: 'start' }));
await shot('C4-world-around');
await page.evaluate(() => {
  const sec = document.querySelector('.u7-sec');
  const f = document.createElement('section'); f.className = 'sd-kind ss-glass u7-sec u7-add';
  f.innerHTML = `<h4 class="ss-label wv-label sd-h">The cast <small>3 of 12 met · + 1 added in this chat</small></h4>
   <div class="u7-form">
    <b>Add someone to the cast</b>
    <div class="u7-two"><label>Name<input value="Maren Vey"></label><label>Who they are<input value="Disgraced guild scribe, thirty"></label></div>
    <div class="u7-two"><label>Starts at<input value="Ashford archive"></label><label>Their routine<input value="copies ledgers by lamplight"></label></div>
    <label>Their goal<input value="prove the guild forged the weir permits"></label>
    <label>Drawn to (what brings them to you)<textarea>the forged permits; anyone asking about the weir</textarea></label>
    <p class="u7-note">Lives off-screen like the pack's cast, in this chat only. You meet them by place or goal; until then they stay hidden from you too, if you like ("Keep a secret from me").</p>
    <label class="u7-check"><input type="checkbox" checked> Keep a secret from me</label>
    <div class="u7-acts"><button type="button" data-ss-hit class="u7-btn">Cancel</button><button type="button" data-ss-hit class="u7-btn" style="background:#6d5ce6;color:#fff">Add to the cast</button></div>
   </div>`;
  sec.after(f);
  f.scrollIntoView({ block: 'start' });
});
await shot('C7-add-to-cast');
await page.evaluate(() => document.querySelector('.u7-add')?.remove());
// C5: dossier: starts from the pack, last heard, pin as Key people
await page.locator('.npc-state-delta-present-card').first().click(); await page.waitForTimeout(1800);
await page.evaluate(() => {
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,strong,b')].filter(n => n.textContent.trim() === 'Fenna' && n.getBoundingClientRect().width > 0);
  const h = heads[heads.length - 1]; if (h && !h.querySelector('.u7-badge')) { const b = document.createElement('span'); b.className = 'u7-badge'; b.textContent = 'Ersveil cast'; h.append(b); }
  const cur = [...document.querySelectorAll('*')].find(n => n.childElementCount === 0 && /^CURRENT DOSSIER$/i.test(n.textContent.trim()) && n.getBoundingClientRect().width > 0);
  const box = document.createElement('section'); box.className = 'u7-first';
  box.innerHTML = `<h5>From the Ersveil cast · first met Gw 12 at the docks</h5>
   <div>Look, voice, history and story stages come from the pack. Her relationship with you starts at the pack's values and grows from play.</div>
   <div><b>Her own path:</b> keep the night ferry running; find out who opened the weir. <b>Last heard:</b> took the ferry upriver to Ashford for the guild (Gw 15).</div>
   <button type="button" data-ss-hit class="u7-btn">★ Pin as Key people</button>
   <div class="u7-note">Pinned, she gets the full Key people track (away, back date, return) and the narrator hears about her.</div>`;
  (cur?.parentElement ?? document.body).append(box);
});
await shot('C5-dossier-cast');
await page.keyboard.press('Escape'); await page.waitForTimeout(700); await page.keyboard.press('Escape'); await page.waitForTimeout(700);
// C6: Settings → Modules → Story Director → The cast
await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
await page.locator('.ss-tabs-item', { hasText: 'Modules' }).first().click(); await page.waitForTimeout(900);
await page.evaluate(() => { for (const d of document.querySelectorAll('details.ss-module-card')) d.open = /Story Director/i.test(d.querySelector('summary')?.textContent); });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const c = [...document.querySelectorAll('details.ss-module-card')].find(d => /Story Director/i.test(d.querySelector('summary')?.textContent));
  const fold = [...c.querySelectorAll('details')].find(d => /NPC initiative/i.test(d.querySelector('summary')?.textContent ?? ''));
  const e = (fold ?? c.querySelector('details')).cloneNode(false); e.open = true;
  e.innerHTML = `<summary class="ss-section-head"><span class="ss-label ss-section-title">The cast</span><small class="ss-section-hint">On · 1 new face a day · Ersveil pack</small></summary>
  <div class="u7-fields">
   <label class="u7-check"><input type="checkbox" checked> The pack's cast lives off-screen</label>
   <div class="u7-field"><b>New faces at most</b><div class="u7-seg"><button type="button" data-ss-hit aria-pressed="true">1 a day</button><button type="button" data-ss-hit aria-pressed="false">2 a day</button><button type="button" data-ss-hit aria-pressed="false">1 a week</button></div><small>You meet someone the first time you are at their place while they are there, or when their goal leads them to you. This keeps it to a few at a time; the rest wait. Never during a fight.</small></div>
   <label class="u7-check"><input type="checkbox"> Unmet cast can die off-screen</label>
   <small class="u7-note">Off: before you meet them they can be hurt, lose things or move, but not die. A pack entry can still mark someone as able to die.</small>
   <small class="u7-note">They move on only when the day changes or time skips: one short planner line each, only where something changed. Unmet cast is never in the narrator's text. Needs a pack with a cast (Ersveil).</small>
  </div>`;
  (fold ?? c.querySelector('details')).before(e);
  e.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(500);
await shot('C6-settings');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
