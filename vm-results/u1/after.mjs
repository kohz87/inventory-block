// U2: "after" mockups on the live app (CSS/DOM patch only, nothing saved). node after.mjs d|p [rpgoff|rpgon]
import { boot, gameview, SHOTS } from './lib.mjs';
const ph = process.argv[2] === 'p'; const v = ph ? 'p' : 'd';
const VP = ph ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { browser, page, errors } = await boot(VP);
const closeAll = async () => { for (let i = 0; i < 5; i++) { const open = await page.evaluate(() => [...document.querySelectorAll('.ss-gameview, .ss-settings, .ss-dialog, .ss-screenbar-sheet')].some(n => n.getBoundingClientRect().width > 0)); if (!open) return; await page.keyboard.press('Escape'); await page.waitForTimeout(600); } };
const rpg = async on => {
  await closeAll();
  await page.getByRole('button', { name: 'Story Suite settings' }).first().click(); await page.waitForTimeout(1500);
  await page.locator('.ss-tabs-item', { hasText: 'Features' }).first().click(); await page.waitForTimeout(700);
  const sw = page.locator('.ss-feature[data-feature="story-block.rpg"] button[role=switch]').first();
  for (let k = 0; k < 4 && !(await sw.isVisible().catch(() => false)); k++) { await page.locator('.ss-features summary', { hasText: /story block/i }).first().click().catch(() => {}); await page.waitForTimeout(900); }
  if (((await sw.getAttribute('aria-checked')) === 'true') !== on) { await sw.click(); await page.waitForTimeout(3000); }
  console.log('rpg', await sw.getAttribute('aria-checked')); await closeAll();
};
const CSS = `
.ss-gameview{background:rgba(6,8,16,.86)!important}
.ss-gameview-main{background:#1a1c27!important}
.ss-gameview .panel,.ss-gameview .ss-hero,.ss-gameview .ss-gameview-nav{background:#222535!important}
.home .panel.scene{display:none!important}
.home{grid-template-columns:repeat(${ph ? 1 : 3},minmax(0,1fr))!important;align-items:start!important}
.home > .u2-gone{display:none!important}
.home > .saves-slot{grid-column:1/-1;order:9}
.home .panel.saves{display:flex!important;flex-direction:row!important;flex-wrap:wrap;align-items:center;gap:6px 16px;padding-top:10px!important;padding-bottom:10px!important}
.home .panel.saves > *{margin:0!important}
.ss-hero-corner{flex-wrap:wrap!important;row-gap:4px}
.ss-hero-corner-item,.ss-hero-corner-text{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:none!important}
.ss-gameview-nav .u2-hide{display:none!important}
${ph ? '' : '.ss-gameview-nav{justify-content:center!important;gap:6px!important}.ss-gameview-nav .ss-screenbar-item{flex:0 0 112px!important}'}
.ss-cards .u2-gone{display:none!important}
.u2-sep{margin:10px 0 6px;border-top:1px solid rgba(255,255,255,.12);padding-top:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7}
`;
await rpg(false);
await page.addStyleTag({ content: CSS });
const patchCards = () => page.evaluate(() => {
  for (const cards of document.querySelectorAll('.ss-cards')) {
    const ch = cards.querySelector('[data-ss-card="story-block/changes-card"]'); const st = cards.querySelector('[data-ss-card="story-director/status-card"]');
    if (!ch || !st) continue;
    st.classList.add('u2-gone');
    ch.querySelector('.ss-card-title').textContent = 'This reply';
    const s = ch.querySelector('.ss-card-summary'); if (!s.dataset.u2) { s.dataset.u2 = 1; s.textContent = (s.textContent ? s.textContent.replace(/ · \d+ edits? of yours/, '') + ' · ' : '') + '1:30 pm, Bluewatch'; }
  }
});
// ---- B: chat, one card under each reply
await page.evaluate(() => { const all = [...document.querySelectorAll('.mes')]; const i = all.findIndex(m => /one of us now/.test(m.textContent)); all.slice(i + 1).forEach(m => m.style.display = 'none'); });
await page.evaluate(() => { const c = document.querySelector('#chat'); c.scrollTop = c.scrollHeight; }); await page.waitForTimeout(600);
await patchCards(); await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/B1-chat-one-card-${v}.png` });
// open merged card on the last reply: open both, move status rows into changed body
const last = page.locator('.mes', { hasText: 'one of us now' }).last();
await last.locator('[data-ss-card="story-director/status-card"] .ss-card-head').evaluate(b => b.click());
await last.locator('[data-ss-card="story-block/changes-card"] .ss-card-head').click();
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const mes = [...document.querySelectorAll('.mes')].find(m => /one of us now/.test(m.textContent));
  const ch = mes.querySelector('[data-ss-card="story-block/changes-card"]'); const st = mes.querySelector('[data-ss-card="story-director/status-card"]');
  st.classList.remove('u2-gone'); st.querySelector('.ss-card-head').style.display = 'none';
  Object.assign(ch.style, { borderBottomLeftRadius: '0', borderBottomRightRadius: '0', borderBottom: '0', marginBottom: '0' });
  Object.assign(st.style, { borderTopLeftRadius: '0', borderTopRightRadius: '0', borderTop: '0', marginTop: '0' });
  const body = st.querySelector('.ss-card-body'); const sep = document.createElement('div'); sep.className = 'u2-sep'; sep.style.margin = '0 0 6px'; sep.textContent = 'Where things stand'; body.prepend(sep);
  for (const n of ch.querySelectorAll('.ss-card-body *')) if (n.children.length <= 3 && /^\s*You set Foes/.test(n.textContent) && n.parentElement.closest('.ss-card-body')) { let r = n; while (r.parentElement && !r.parentElement.classList.contains('ss-card-body') && r.parentElement.children.length === 1) r = r.parentElement; r.style.display = 'none'; }
  const cards = ch.parentElement; cards.style.gap = '0'; cards.style.rowGap = '0';
});
await page.evaluate(() => { const c = document.querySelector('#chat'); c.scrollTop = c.scrollHeight; }); await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/B2-chat-one-card-open-${v}.png` });
// ---- A: Game view Home
await gameview(page, 'Home');
await page.evaluate(ph => {
  for (const c of document.querySelector('.home').children) if (c.getBoundingClientRect().width === 0) c.classList.add('u2-gone');
  const keep = ['Home', 'Inventory', 'Quests', 'World', 'Map'];
  const nav = document.querySelector('.ss-gameview-nav');
  for (const b of nav.querySelectorAll('.ss-screenbar-item')) { const t = b.getAttribute('title') || b.textContent.trim(); if (!keep.includes(t) && !b.classList.contains('ss-screenbar-more')) b.classList.add('u2-hide'); }
  if (!ph && !nav.querySelector('.u2-more')) { const m = [...nav.querySelectorAll('.ss-screenbar-item')].find(b => b.getAttribute('title') === 'Map').cloneNode(true); m.classList.add('u2-more'); m.classList.remove('ss-screenbar-current'); m.removeAttribute('aria-current'); m.title = 'More'; m.querySelector('.ss-screenbar-label').textContent = 'More'; const svg = m.querySelector('svg, i'); const ns = document.createElement('i'); ns.className = 'fa-solid fa-ellipsis ss-screenbar-icon'; svg.replaceWith(ns); nav.append(m); }
  const corner = document.querySelector('.ss-hero-corner');
  if (!corner.querySelector('[data-kind=here]')) { const li = corner.querySelector('[data-kind=place]').cloneNode(true); li.dataset.kind = 'here'; li.querySelector('i').className = 'ss-hero-corner-icon fa-solid fa-user-group'; li.querySelector('.ss-hero-corner-text').textContent = 'Here: Fenna'; const pen = document.querySelector('.ss-hero-you-pencil .ss-w-editable-pencil'); if (pen) li.append(pen.cloneNode(true)); corner.append(li);
    for (const k of ['place', 'weather']) { const it = corner.querySelector(`[data-kind=${k}]`); if (pen && !it.querySelector('.ss-w-editable-pencil')) it.append(pen.cloneNode(true)); } }
}, ph);
await page.mouse.move(1, 1); await page.waitForTimeout(800);
if (ph) { // tall shot of the Home body
  const h = await page.evaluate(() => { const b = document.querySelector('.ss-gameview-body'); return b.scrollHeight - b.clientHeight; });
  if (h > 0) { await page.setViewportSize({ width: 390, height: 844 + h + 8 }); await page.waitForTimeout(800); }
}
await page.screenshot({ path: `${SHOTS}/A1-home-${v}.png` });
if (ph) await page.setViewportSize(VP);
await rpg(true);
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
