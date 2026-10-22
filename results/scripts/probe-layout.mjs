// Every screen at a width: sideways scroll, tap targets, reduced motion, keyboard reach.
import fs from 'node:fs';
import { launch, waitHost, connect, ST_URL, shot, j } from './common.mjs';
import { openChat } from './lib-ui.mjs';
const { chat } = JSON.parse(fs.readFileSync(new URL('./chat.json', import.meta.url)));
const W = Number(process.env.W ?? 390);
const { browser, page, errors } = await launch({ width: W, height: W < 600 ? 844 : 900, reducedMotion: 'reduce', mobile: W < 600 });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page); await connect(page); await openChat(page, chat);
const measure = (root) => page.evaluate(([root, W]) => {
    const r = document.querySelector(root);
    if (!r) return { missing: root };
    const vis = n => { const b = n.getBoundingClientRect(); const s = getComputedStyle(n); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
    const name = n => (n.innerText || n.value || n.getAttribute('aria-label') || n.title || n.className || n.tagName).toString().replace(/\s+/g, ' ').trim().slice(0, 30);
    const doc = { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, bodyScrollW: document.body.scrollWidth };
    const sideways = [...r.querySelectorAll('*')].filter(n => vis(n) && n.scrollWidth > n.clientWidth + 2 && ['auto', 'scroll'].includes(getComputedStyle(n).overflowX)).map(n => `${n.className || n.tagName}:${n.scrollWidth}>${n.clientWidth}`).slice(0, 6);
    const offRight = [...r.querySelectorAll('button, input, select, a, [role="button"], [tabindex]')].filter(vis).filter(n => n.getBoundingClientRect().right > W + 1).map(n => `${name(n)}@${Math.round(n.getBoundingClientRect().right)}`).slice(0, 8);
    const controls = [...r.querySelectorAll('button, input:not([type=hidden]), select, a[href], [role="button"], summary')].filter(vis);
    const small = controls.filter(n => { const b = n.getBoundingClientRect(); return b.width < 24 || b.height < 24; }).map(n => { const b = n.getBoundingClientRect(); return `${name(n)} ${Math.round(b.width)}x${Math.round(b.height)}`; });
    const motion = [...r.querySelectorAll('*')].filter(vis).filter(n => { const s = getComputedStyle(n); const d = x => Math.max(...x.split(',').map(v => parseFloat(v) * (v.includes('ms') ? 0.001 : 1))); return (s.animationName !== 'none' && d(s.animationDuration) > 0.05) || d(s.transitionDuration) > 0.05; }).map(n => `${String(n.className).slice(0, 40)} anim=${getComputedStyle(n).animationName}/${getComputedStyle(n).animationDuration} tr=${getComputedStyle(n).transitionDuration}`).slice(0, 5);
    return { doc, sideways, offRight, controls: controls.length, small: small.slice(0, 10), smallCount: small.length, motion };
}, [root, W]);
const out = { W, tabs: {}, game: {}, extra: {} };
await page.evaluate(() => document.querySelector('.story-suite-bar-story')?.click());
await page.waitForTimeout(700);
const tabs = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(b => b.textContent.trim()));
for (const [i, name] of tabs.entries()) {
    await page.evaluate(i => document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')[i]?.click(), i);
    await page.waitForTimeout(500);
    out.tabs[name] = await measure('#story_suite_v2_panel');
    await shot(page, `w${W}-tab-${name.toLowerCase()}`);
}
// keyboard: Tab through the panel; count focusable controls reached and whether focus is visible
out.extra.keyboard = await page.evaluate(() => {
    const p = document.querySelector('#story_suite_v2_panel');
    const f = [...p.querySelectorAll('button, input, select, a[href], [tabindex]:not([tabindex="-1"]), summary')].filter(n => !n.disabled && n.offsetParent !== null);
    const noOutline = f.filter(n => { n.focus(); const s = getComputedStyle(n); return document.activeElement === n && s.outlineStyle === 'none' && s.boxShadow === 'none'; }).map(n => (n.innerText || n.className).slice(0, 25));
    return { focusable: f.length, noVisibleFocus: noOutline.length, sample: noOutline.slice(0, 6) };
});
await page.evaluate(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('.story-suite-bar-game')?.click());
await page.waitForTimeout(800);
const items = await page.evaluate(() => [...document.querySelectorAll('.ss-gameview-navitem')].map(b => b.textContent.trim()));
for (const [i, name] of items.entries()) {
    await page.evaluate(i => document.querySelectorAll('.ss-gameview-navitem')[i]?.click(), i);
    await page.waitForTimeout(500);
    out.game[name] = await measure('.ss-gameview');
    await shot(page, `w${W}-game-${name.toLowerCase()}`);
}
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
out.extra.escapeClosesGame = await page.evaluate(() => !document.querySelector('.ss-gameview') || document.querySelector('.ss-gameview').hidden || getComputedStyle(document.querySelector('.ss-gameview')).display === 'none');
await page.evaluate(() => document.querySelector('.ss-gameview-close')?.click());
// chat area: HUD and the cards opened
await page.evaluate(() => { for (const c of document.querySelectorAll('#chat .ss-card-head')) c.click(); });
await page.waitForTimeout(500);
out.extra.chat = await measure('#chat');
out.extra.hud = await measure('#story_suite_v2_bar');
await shot(page, `w${W}-chat-cards-open`);
// Settings overlay
await page.evaluate(() => document.querySelector('.story-suite-bar-settings')?.click());
await page.waitForTimeout(600);
await page.evaluate(() => { for (const d of document.querySelectorAll('#story_suite_v2_overlay details')) d.open = true; });
out.extra.overlay = await measure('#story_suite_v2_overlay');
await shot(page, `w${W}-overlay`);
out.errors = errors.filter(e => !/dossier|404/.test(e));
fs.writeFileSync(new URL(`./out-layout-${W}.json`, import.meta.url), JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries({ ...out.tabs, ...Object.fromEntries(Object.entries(out.game).map(([a, b]) => [`game:${a}`, b])), ...Object.fromEntries(Object.entries(out.extra).map(([a, b]) => [`x:${a}`, b])) })) console.log(k, j(v).slice(0, 600));
console.log('errors', j(out.errors));
await browser.close();
