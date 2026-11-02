// XM mockup u11 (no repo changes): Game view -> World -> Now, Ersveil imported (ersveil.zip through Settings > Packs), Sister Temiwa met.
//   node mock.mjs d|p      real ST on 8194: Story Block 768c41a (2.16.0), Story Director d972c4f (2.9.0), NPC State Delta 64af0ac (1.7.0)
// The chat has no generation (no API), so the met-cast state is drawn by patching the DOM with the apps' own markup and classes
// (copied from the real DOM and from the sources: NSD index.js inlineCardHtml / storysuite-v2.js noteNodes, SD world/screen.js NOW template).
// Shots -> shots/: before-now, before-pin-open, after-now, after-pin-open, after-long-place.
import fs from 'node:fs';
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const ROOT = SHOTS.replace(/\/shots$/, '');
const PORTRAIT = 'data:image/webp;base64,' + fs.readFileSync(ROOT + '/ext/Story_block/examples/packs/ersveil/portraits/temiwa.webp').toString('base64');
const PACK = JSON.parse(fs.readFileSync(ROOT + '/ext/Story_block/examples/packs/ersveil/pack.json', 'utf8'));
const T = PACK.content.cast.find(c => c.id === 'temiwa');
const PLACE = 'Bluewatch Village / Guild Office';
const LONG = 'Bluewatch Village / Adventurer Guild Office';
const HIDDEN = ['Hidden note · opens at Trust 40', 'Hidden note · opens at Trust 50 or with the story', 'Hidden note · opens with the story',
  'Hidden note · opens at Trust 70', 'Hidden note · opens at Affection 60', 'Hidden note · opens at Trust 90 or with the story'];
const PEOPLE = [['Sister Temiwa', 'here now'], ['the quartermaster', 'in a quest or lead'], ['Mother Inquisitor Severa', 'in a quest or lead'], ['Rika', 'met from the cast'], ['Torka', 'met from the cast'], ['Fenna', 'a dossier']];

// What the proposed changes do. Each block says where it would go.
const AFTER_CSS = `
/* NPC State Delta, style.css (World's present cards, .npc-state-delta-world-cell): the standing as a chip, the description on one line (two on a phone) */
.npc-state-delta-world-cell .npc-state-delta-present-card-stage{border:1px solid color-mix(in srgb,var(--ss-accent,#8b7cf6) 60%,transparent);border-radius:999px;padding:0 9px;line-height:1.55;background:color-mix(in srgb,var(--ss-accent,#8b7cf6) 12%,transparent)}
.npc-state-delta-world-cell .npc-state-delta-present-card-role{-webkit-line-clamp:1;line-clamp:1}
@media (max-width:599px){.npc-state-delta-world-cell .npc-state-delta-present-card-role{-webkit-line-clamp:2;line-clamp:2}}
.npc-state-delta-world-cell{cursor:pointer}
.npc-state-delta-world-cell:hover .npc-state-delta-present-card{border-color:var(--ss-accent,#8b7cf6)}
/* Story Director, world/screen.js CSS: "Around here" heading: label never shrinks, the place does ("..." on one line), the day part stays */
.wv-around .wv-label{min-width:0}
.wv-around .wv-label>small{display:inline-flex;gap:.35em;min-width:0;flex:0 1 auto;white-space:nowrap}
.wv-around .wv-label .wv-clip{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wv-around .wv-label .wv-day{flex:none}
/* Story Director, world/screen.js CSS: the two cards grow with their content; a long Pin list scrolls inside the card */
.wv-around,.wv-key{height:auto;max-height:none;overflow:visible;align-self:start}
.wv-key-choices{max-height:min(260px,32vh);overflow-y:auto;overscroll-behavior:contain}
.u11-tip{position:absolute;z-index:20;max-width:80%;padding:4px 8px;border-radius:4px;background:#222;color:#eee;border:1px solid #555;font:12px/1.3 system-ui,sans-serif;pointer-events:none;box-shadow:0 2px 8px #0008;text-transform:none;letter-spacing:0;font-weight:400}
`;

const { browser, page, errors } = await boot(VP);
const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png` }); };
await gameview(page, 'World');

// ---- today's World -> Now, drawn with the met cast (the user's screenshots 9 and 10)
await page.evaluate(({ T, PORTRAIT, PLACE, HIDDEN }) => {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hero = id => document.querySelector(`.ss-hero-corner-item[data-kind=${id}] .ss-hero-corner-text`);
  hero('time').textContent = 'CY 611, Goldwane 12, 6:40 am'; hero('place').textContent = PLACE; hero('weather').textContent = 'river mist burning off by noon'; hero('here').textContent = 'Here: Sister Temiwa';
  const here = document.querySelector('.wv-here');
  here.querySelector('.wv-place .sd-key').textContent = PLACE;
  const grid = here.querySelector('.npc-state-delta-present-grid');
  grid.innerHTML = `<div class="npc-state-delta-present-cell npc-state-delta-present-cell-now npc-state-delta-world-cell" data-npc-id="npc_temiwa" data-message-id="16">
    <button type="button" class="npc-state-delta-present-card" data-npc-id="npc_temiwa" data-message-id="16" aria-label="Open Sister Temiwa dossier">
      <span class="npc-state-delta-present-card-portrait"><img src="${PORTRAIT}" alt="Sister Temiwa portrait"></span>
      <span class="npc-state-delta-present-card-text">
        <span class="npc-state-delta-present-card-head"><b class="npc-state-delta-present-card-name" title="Sister Temiwa">Sister Temiwa</b><span class="npc-state-delta-present-card-stage">Tolerates you</span></span>
        <small class="npc-state-delta-present-card-role" title="${esc(T.about)}">${esc(T.about)}</small><span class="npc-state-delta-present-now"><span class="npc-state-delta-present-now-part npc-state-delta-present-now-outfit" title="${esc(T.look)}"><span class="npc-state-delta-present-now-label">Look:</span> <span class="npc-state-delta-present-now-text">${esc(T.look)}</span></span></span>
      </span></button>
    <p class="npc-state-delta-v2-next">Next: Patches you without the sermon — trust 25/45</p>
    <p class="npc-state-delta-v2-note npc-state-delta-v2-note-open"><b>Why Bluewatch</b>: She asked for Bluewatch herself, to be as far from Mother Inquisitor Severa as the map allows.</p>
    ${HIDDEN.map(t => `<p class="npc-state-delta-v2-note npc-state-delta-v2-note-locked">${t}</p>`).join('')}</div>`;
  // "Around here" (Story Director world/screen.js NOW): the real template's markup
  const sec = document.createElement('section'); sec.className = 'sd-kind wv-around ss-glass'; sec.dataset.kind = 'around'; sec.setAttribute('aria-label', 'Around here');
  sec.innerHTML = `<h4 class="ss-label wv-label sd-h">Around here <small>${esc(PLACE)} · morning</small></h4>
    <div class="wv-row"><span>Cast whose paths may cross yours here</span><b>1, not yet met</b></div>
    <div class="wv-row"><span>Cast you have met</span><span class="wv-row-list"><span class="wv-row-item">Sister Temiwa</span></span></div>
    <div class="wv-row"><span>Met from the Ersveil cast</span><b>1 of 12</b></div>
    <p class="wv-note">Unmet cast stays hidden. Anyone else you meet is made up by the story as today; if they matter, NPC State Delta keeps a dossier. No meetings during a fight.</p>`;
  document.querySelector('.wv-key').before(sec);
}, { T, PORTRAIT, PLACE, HIDDEN });
await shot('before-now');
// the Pin list, opened with the real "+ Pin" button; its rows are the widget's own markup
const openPin = async () => {
  await page.locator('.wv-key-pin').click(); await page.waitForTimeout(600);
  await page.evaluate(PEOPLE => {
    const ul = document.querySelector('.wv-key-choices'); if (!ul) return;
    ul.innerHTML = PEOPLE.map(([n, s]) => `<li class="wv-key-choice"><button class="wv-key-pick" type="button" aria-label="Pin ${n}"><span class="wv-key-name">${n}</span> <small class="wv-key-from">${s}</small></button></li>`).join('');
  }, PEOPLE);
  await page.waitForTimeout(300);
};
const closePin = async () => { await page.locator('.wv-key-pin').click(); await page.waitForTimeout(400); };
// phone: the card's top just under the sticky header; desktop: the card's end in view
const scrollTo = sel => page.evaluate(({ sel, ph }) => {
  const el = document.querySelector(sel); el.scrollIntoView({ block: ph ? 'start' : 'end' });
  if (ph) { let c = el.parentElement; while (c && !(c.scrollHeight > c.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(c).overflowY))) c = c.parentElement; if (c) c.scrollTop += el.getBoundingClientRect().top - 215; }
}, { sel, ph });
await openPin();
await scrollTo('.wv-key');
await shot('before-pin-open');
await closePin();
await page.evaluate(() => { for (let n = document.querySelector('.wv'); n; n = n.parentElement) n.scrollTop = 0; });

// ---- after: the three changes
await page.addStyleTag({ content: AFTER_CSS });
await page.evaluate(() => {
  // 1. People here: only portrait, name, standing chip and the one-line description; no Look, no Next, no fields, no hidden notes
  const cell = document.querySelector('.npc-state-delta-world-cell');
  cell.querySelectorAll('.npc-state-delta-present-now, .npc-state-delta-v2-next, .npc-state-delta-v2-note').forEach(n => n.remove());
  // 2. Around here: the place is its own clipped span with the full place as its tooltip; the day part stays
  const small = document.querySelector('.wv-around .wv-label small'); const [place, day] = small.textContent.split(' · ');
  small.innerHTML = ''; const clip = Object.assign(document.createElement('span'), { className: 'wv-clip', textContent: place, title: place });
  const d = Object.assign(document.createElement('span'), { className: 'wv-day', textContent: '· ' + day });
  small.append(clip, d);
});
const scrollTop = () => page.evaluate(() => { for (let n = document.querySelector('.wv'); n; n = n.parentElement) n.scrollTop = 0; });
await scrollTop();
await shot('after-now');
await openPin();
await scrollTo('.wv-key');
await shot('after-pin-open');
await closePin();
// long place (hero line, Here card and the Around here heading), with an illustration of the tooltip the title attribute gives
await page.evaluate(LONG => {
  document.querySelector('.ss-hero-corner-item[data-kind=place] .ss-hero-corner-text').textContent = LONG;
  document.querySelector('.wv-here .wv-place .sd-key').textContent = LONG;
  const clip = document.querySelector('.wv-around .wv-clip'); clip.textContent = LONG; clip.title = LONG;
  for (let n = document.querySelector('.wv'); n; n = n.parentElement) n.scrollTop = 0;
  const r = clip.getBoundingClientRect(); const tip = document.createElement('div'); tip.className = 'u11-tip'; tip.textContent = LONG; tip.style.position = 'fixed';
  tip.style.left = Math.round(r.left + 24) + 'px'; tip.style.top = Math.round(r.bottom + 6) + 'px'; (document.querySelector('.ss-gameview') ?? document.body).append(tip);
}, LONG);
await shot('after-long-place');
const m = await page.evaluate(() => { const c = document.querySelector('.wv-around .wv-clip'); const k = document.querySelector('.wv-key').getBoundingClientRect(); const a = document.querySelector('.wv-around').getBoundingClientRect(); return { clipped: c.scrollWidth > c.clientWidth, around: [Math.round(a.left), Math.round(a.right)], key: [Math.round(k.left), Math.round(k.right)] }; });
console.log(JSON.stringify(m), errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
