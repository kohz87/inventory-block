// XM mockups for part B (no repo changes): "after" pictures drawn by patching the running apps' DOM/CSS in Playwright.
//   node mock.mjs d|p      item 1 (Story Director: story date/time pencil, in the real ST on port 8194)
//                          then item 2 (Story Studio 0.5.1: pack stat formula, from its standalone editor)
// Guides: ../u7/mock.mjs, ../u9/mock.mjs.
import { boot, gameview, SHOTS, chromium } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const ROOT = SHOTS.replace(/\/shots$/, '');

// ------------------------------------------------------------------------------------------------ item 1
const T1_CSS = `
.u10-clock{display:grid;gap:10px;margin:8px 0 2px;padding:10px 12px;border-radius:12px;border:1px solid rgba(160,130,255,.4);background:rgba(160,130,255,.07);width:440px;max-width:100%;box-sizing:border-box;font-size:13px;line-height:1.4}
.u10-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,.8fr) minmax(0,1.3fr);gap:8px}
.u10-clock label{display:grid;gap:3px;min-width:0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.9}
.u10-clock input,.u10-clock select{box-sizing:border-box;width:100%;min-width:0;font:inherit;font-size:13px;letter-spacing:0;text-transform:none;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.28);color:inherit;color-scheme:dark}
.u10-clock .u10-help{margin:0;font-size:12px;opacity:.78}
.u10-clock .u10-acts{display:flex;gap:8px}
.u10-clock .u10-acts button{cursor:pointer;font:inherit;font-size:13px;padding:5px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:transparent;color:inherit}
.u10-clock .u10-acts button.u10-primary{background:#6d5ce6;border-color:#8b7cf6;color:#fff}
.u10-clock-open .ss-hero-corner-item[data-kind=time] .ss-iconbutton{color:#c9b8ff}
@media (max-width:520px){.u10-fields{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}.u10-clock{width:auto}}
`;
async function item1() {
  const { browser, page, errors } = await boot(VP);
  await page.addStyleTag({ content: T1_CSS });
  const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png` }); };
  // the pencil: the same one the place / weather / here items carry, put beside the time
  const addPencil = () => page.evaluate(() => {
    const time = document.querySelector('.ss-hero-corner-item[data-kind=time]');
    if (time.querySelector('.ss-hero-corner-pencil')) return;
    const src = document.querySelector('.ss-hero-corner-item[data-kind=weather] .ss-hero-corner-pencil');
    const pen = src.cloneNode(true);
    pen.querySelector('.ss-w-editable-value')?.remove();
    const b = pen.querySelector('button'); b.setAttribute('aria-label', 'Edit story date and time'); b.title = 'Edit story date and time'; b.classList.add('u10-pencil'); b.hidden = false;
    time.append(pen);
  });
  await gameview(page, 'Home'); await addPencil();
  await shot('T1-1-closed');
  // open: one compact editor under the corner, in the story's calendar (Ersveil: era CY, twelve months of 30 days)
  const MONTHS = ['Dawnwane', 'Rainmoot', 'Greengale', 'Highsun', 'Goldwane', 'Haywane', 'Emberwane', 'Nightfall', 'Frostfall', 'Deepwinter', 'Icewane', 'Yearsend'];
  await page.evaluate(({ MONTHS }) => {
    const corner = document.querySelector('.ss-hero-corner');
    document.querySelector('.ss-hero').classList.add('u10-clock-open');
    const box = document.createElement('div'); box.className = 'u10-clock'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Story date and time');
    box.innerHTML = `<div class="u10-fields">
      <label>Year (CY)<input type="number" value="611" aria-label="Year (CY)" min="0"></label>
      <label>Month<select aria-label="Month">${MONTHS.map(m => `<option${m === 'Goldwane' ? ' selected' : ''}>${m}</option>`).join('')}</select></label>
      <label>Day<input type="number" value="12" min="1" max="30" aria-label="Day (1 to 30)"></label>
      <label>Time<input type="time" value="13:30" aria-label="Time of day"></label></div>
      <p class="u10-help">Changes the story clock from this reply on.</p>
      <div class="u10-acts"><button type="button" class="u10-primary">Set</button><button type="button">Cancel</button></div>`;
    corner.after(box);
  }, { MONTHS });
  await shot('T1-2-open');
  // after setting: Goldwane 14, 6:00 pm. The hero's time line, then the card line on the latest reply.
  await page.evaluate(() => {
    document.querySelector('.u10-clock')?.remove(); document.querySelector('.ss-hero').classList.remove('u10-clock-open');
    document.querySelector('.ss-hero-corner-item[data-kind=time] .ss-hero-corner-text').textContent = 'CY 611, Goldwane 14, 6:00 pm';
  });
  await shot('T1-3-after-game-view');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  await page.evaluate(() => { const last = [...document.querySelectorAll('.mes')].pop(); last.querySelector('.rpg-battle')?.remove(); });
  const head = page.locator('.mes').last().locator('.ss-card-head').first();
  if ((await head.getAttribute('aria-expanded')) !== 'true') { await head.click(); await page.waitForTimeout(1200); }
  await page.evaluate(() => {
    const last = [...document.querySelectorAll('.mes')].pop(); const card = last.querySelector('.ss-card');
    const NOW = 'CY 611, Goldwane 14, 6:00 pm';
    const SHORT = 'Goldwane 14, 6:00 pm'; // the short form (era and year left out while they did not change)
    card.querySelector('.ss-card-summary').textContent = `Clock set to ${SHORT}`;
    const tiles = card.querySelector('.tiles');
    const li = document.createElement('li'); li.className = 'tile line tone-info';
    li.innerHTML = `<span class="ico"><i aria-hidden="true" class="fa-solid fa-clock"></i></span><span class="tx"><span class="main" title="Clock set to ${NOW}">Clock set to ${SHORT}</span> <span class="sub note">Your edit</span></span>`;
    tiles.prepend(li);
    const dd = card.querySelector('.sd-time dd'); if (dd) dd.textContent = 'CY 611, Goldwane 14, 06:00 pm';
    last.scrollIntoView({ block: 'end' });
  });
  await page.waitForTimeout(400);
  await shot('T1-4-after-card');
  console.log('item 1:', errors.length ? errors.join('\n') : 'no page errors');
  await browser.close();
}

// ------------------------------------------------------------------------------------------------ item 2
const T2_CSS = `
.u10-formula{display:grid;gap:8px}
.u10-formula h3{margin:0}
.u10-formula .cf-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.u10-formula .cf-seg button{min-height:36px}
`;
async function item2() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VP });
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
  await page.goto('file://' + ROOT + '/ext/Story_studio/dist/story-studio.html'); await page.waitForTimeout(1500);
  await page.locator('#pack-file').setInputFiles(ROOT + '/ext/Story_block/examples/packs/ersveil/pack.json'); await page.waitForTimeout(3000);
  if (ph) await page.locator('details.parts > summary').click(); // on a phone the parts list is a disclosure
  await page.waitForTimeout(400);
  await page.locator('.rail').getByRole('button', { name: /Pack settings/ }).click(); await page.waitForTimeout(1000);
  const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(400); await page.screenshot({ path: `${SHOTS}/${name}-${v}.png` }); };
  await page.addStyleTag({ content: T2_CSS });
  await shot('T2-1-before');
  const HELP = {
    none: 'The reader picks in Settings → RPG; a chat that never chose plays Standard.',
    standard: 'A main stat plus half a second one, stats start at 5 and grow, and the bars grow with VIT, AGI and INT.',
    classic: 'One stat on its own, stats start at 10, and the bars are fixed.',
  };
  const draw = async (mode, name) => {
    await page.evaluate(({ mode, HELP }) => {
      document.querySelector('.u10-formula')?.remove();
      const main = document.querySelector('main');
      const card = document.createElement('section'); card.className = 'card u10-formula';
      const opt = (key, label) => `<button type="button" aria-pressed="${mode === key}">${label}</button>`;
      card.innerHTML = `<h3>Stat formula</h3>
        <div class="cf-row"><span>Plays on</span><span class="cf-seg" role="group" aria-label="Stat formula">${opt('none', "Reader's choice")}${opt('standard', 'Standard')}${opt('classic', 'Classic')}</span></div>
        <p class="cf-hint">${HELP[mode]}</p>`;
      const hints = main.querySelectorAll('p'); (hints[hints.length ? Math.min(1, hints.length - 1) : 0] ?? main.firstChild).after(card);
      main.scrollTop = 0; window.scrollTo(0, 0);
    }, { mode, HELP });
    await shot(name);
  };
  await draw('none', 'T2-2-after-reader-choice');
  await draw('classic', 'T2-3-after-classic');
  await draw('standard', 'T2-4-after-standard');
  console.log('item 2:', errors.length ? errors.join('\n') : 'no page errors');
  await browser.close();
}
await item1(); await item2();
