// XM redraw of item 1 (no repo changes): ONE "Edit" button on the Game view hero, no per-item pencils; one editor with two groups.
//   node mock2.mjs d|p      real ST on port 8194 (Story Block 79df89f, Story Director 1ae570c, NPC State Delta f642101); shots -> shots2/
import { boot, gameview, chromium } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const OUT = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/u10/shots2';
const CSS = `
/* the hero shows its lines plain: no per-item pencils */
.u10-plain .ss-hero-corner-pencil,.u10-plain .ss-hero-you-pencil{display:none!important}
.ss-hero{position:relative}
.u10-edit{all:unset;min-width:0!important;min-height:0!important;width:auto!important;height:auto!important;line-height:1.4!important;position:relative;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:3px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.28);font-size:12px;line-height:1.4;color:inherit}
.u10-edit:hover,.u10-edit[aria-expanded=true]{background:rgba(160,130,255,.18);border-color:rgba(160,130,255,.65)}
.u10-edit svg{width:12px;height:12px}
.u10-edit::after{content:"";position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%)}
.u10-ed .ss-select{font-size:13px}
.u10-edit:focus-visible{outline:2px solid #8b7cf6;outline-offset:2px}
.u10-edit-corner{position:absolute;top:10px;right:12px;z-index:2}
.u10-has-edit .ss-hero-vitals{padding-top:30px}
@media (max-width:520px){.u10-has-edit .ss-hero-who{display:flex;align-items:center;gap:10px}}
.u10-edit-beside{margin-left:auto}
/* the editor: the app's own fields and buttons, laid out in two groups */
.u10-ed{display:grid;gap:12px;margin:6px 0 2px;max-width:660px;font-size:13px}
.u10-groups{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px}
.u10-group{display:grid;gap:8px;align-content:start;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03);min-width:0;margin:0}
.u10-group>legend,.u10-group>h4{margin:0;padding:0;font-size:11px;letter-spacing:.09em;text-transform:uppercase;opacity:.8}
.u10-ed label{display:grid;gap:3px;min-width:0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.95}
.u10-ed .ss-input,.u10-ed .ss-select{width:100%;min-width:0;box-sizing:border-box;letter-spacing:0;text-transform:none;color-scheme:dark}
.u10-date{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,.8fr) minmax(0,1.3fr);gap:8px}
.u10-ed .u10-help{margin:0;font-size:12px;opacity:.78}
.u10-ed .u10-acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.u10-hide-lines .ss-hero-corner,.u10-hide-lines .ss-hero-you{display:none!important}
@media (max-width:520px){.u10-groups{grid-template-columns:minmax(0,1fr)}.u10-date{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}}
`;
const MONTHS = ['Dawnwane', 'Rainmoot', 'Greengale', 'Highsun', 'Goldwane', 'Haywane', 'Emberwane', 'Nightfall', 'Frostfall', 'Deepwinter', 'Icewane', 'Yearsend'];
const { browser, page, errors } = await boot(VP);
const shot = async name => { await page.mouse.move(1, 1); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/${name}-${v}.png` }); };
await gameview(page, 'Home');
await shot('before');                                   // today: a pencil on time (none), place, weather, here, wearing and condition
await page.addStyleTag({ content: CSS });
await page.evaluate(() => {
  const hero = document.querySelector('.ss-hero'); hero.classList.add('u10-plain', 'u10-has-edit');
  const pen = document.querySelector('.ss-hero .ss-iconbutton.ss-w-editable-pencil svg').cloneNode(true);
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-ss-hit', ''); b.className = 'u10-edit'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Edit the story and your character'); b.title = 'Edit the story and your character';
  b.append(pen, Object.assign(document.createElement('span'), { textContent: 'Edit' }));
  // desktop: the hero's top-right corner; phone: beside the name
  if (innerWidth <= 520) { b.classList.add('u10-edit-beside'); hero.querySelector('.ss-hero-who').append(b); } else { b.classList.add('u10-edit-corner'); hero.append(b); }
});
await shot('after-closed');
const openEditor = (edited) => page.evaluate(({ MONTHS, edited }) => {
  const hero = document.querySelector('.ss-hero'); hero.classList.add('u10-hide-lines');
  hero.querySelector('.u10-edit').setAttribute('aria-expanded', 'true');
  const val = (a, b) => (edited ? b : a);
  const ed = document.createElement('div'); ed.className = 'u10-ed'; ed.setAttribute('role', 'group'); ed.setAttribute('aria-label', 'Edit the story and your character');
  ed.innerHTML = `<div class="u10-groups">
    <fieldset class="u10-group"><legend>Story</legend>
      <div class="u10-date">
        <label>Year (CY)<input class="ss-input" type="number" value="611" min="0"></label>
        <label>Month<select class="ss-select">${MONTHS.map(m => `<option${m === 'Goldwane' ? ' selected' : ''}>${m}</option>`).join('')}</select></label>
        <label>Day<input class="ss-input" type="number" value="${val(12, 14)}" min="1" max="30"></label>
        <label>Time<input class="ss-input" type="time" value="${val('13:30', '18:00')}"></label>
      </div>
      <label>Place<input class="ss-input" type="text" value="Bluewatch Village"></label>
      <label>Weather<input class="ss-input" type="text" value="${val('heavy rain, rising river', 'clear')}"></label>
      <label>Here<input class="ss-input" type="text" value="Fenna"></label>
    </fieldset>
    <fieldset class="u10-group"><legend>Character</legend>
      <label>Wearing<input class="ss-input" type="text" value="oilskin coat"></label>
      <label>Condition<input class="ss-input" type="text" value="soaked, tired"></label>
    </fieldset></div>
    <p class="u10-help">Changes apply from this reply on.</p>
    <div class="u10-acts"><button type="button" class="ss-button ss-button-primary">Save</button><button type="button" class="ss-button">Cancel</button></div>`;
  hero.querySelector('.ss-hero-text').append(ed);
}, { MONTHS, edited });
await openEditor(false);
await shot('after-open');
await page.evaluate(() => document.querySelector('.u10-ed').remove());
await openEditor(true);
await shot('after-open-edited');
// saved: the editor closes, the hero shows the new lines, plain
await page.evaluate(() => {
  document.querySelector('.u10-ed').remove(); const hero = document.querySelector('.ss-hero'); hero.classList.remove('u10-hide-lines');
  hero.querySelector('.u10-edit').setAttribute('aria-expanded', 'false');
  hero.querySelector('[data-kind=time] .ss-hero-corner-text').textContent = 'CY 611, Goldwane 14, 6:00 pm';
  hero.querySelector('[data-kind=weather] .ss-hero-corner-text').textContent = 'clear';
});
await shot('after-saved-hero');
await page.keyboard.press('Escape'); await page.waitForTimeout(800);
await page.evaluate(() => { [...document.querySelectorAll('.mes')].pop().querySelector('.rpg-battle')?.remove(); });
const head = page.locator('.mes').last().locator('.ss-card-head').first();
if ((await head.getAttribute('aria-expanded')) !== 'true') { await head.click(); await page.waitForTimeout(1200); }
await page.evaluate(() => {
  const card = [...document.querySelectorAll('.mes')].pop().querySelector('.ss-card');
  card.querySelector('.ss-card-summary').textContent = 'Clock set to Goldwane 14, 6:00 pm · Weather: clear';
  const tile = (icon, main, full, sub) => { const li = document.createElement('li'); li.className = 'tile line tone-info';
    li.innerHTML = `<span class="ico"><i aria-hidden="true" class="fa-solid ${icon}"></i></span><span class="tx"><span class="main" title="${full}">${main}</span> <span class="sub note">${sub}</span></span>`; return li; };
  card.querySelector('.tiles').prepend(tile('fa-clock', 'Clock set to Goldwane 14, 6:00 pm', 'Clock set to CY 611, Goldwane 14, 6:00 pm', 'Your edit'), tile('fa-cloud-sun', 'Weather: clear', 'Weather: clear (was heavy rain, rising river)', 'Your edit'));
  const t = card.querySelector('.sd-time dd'); if (t) t.textContent = 'CY 611, Goldwane 14, 06:00 pm';
  const w = card.querySelector('.sd-weather dd'); if (w) w.textContent = 'clear';
  [...document.querySelectorAll('.mes')].pop().scrollIntoView({ block: 'end' });
});
await page.waitForTimeout(400);
await shot('after-saved');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
