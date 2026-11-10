import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const out = `${S}/uiux/ours/phone`; fs.mkdirSync(out, { recursive: true });
const h = await open({ width: 390, height: 844, mobile: true });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@15h00m00s000ms');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/m00-chat.png` });
const handle = await ev(() => { const n = document.querySelector('#story_block_handle'); if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, vis: n.offsetParent !== null }; });
console.log('handle:', JSON.stringify(handle));
await page.locator('#story_block_handle').click({ timeout: 3000 }).catch(e => console.log('handle click', e.message.slice(0, 80)));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/m01-open.png` });
const tabs = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId));
let i = 2;
for (const t of tabs) {
  await h.tab(t); await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/m${String(i++).padStart(2, '0')}-${t.replace(/[^a-z0-9-]+/gi, '_')}.png` });
}
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
await h.turn(r3, 'We head to the weir.'); await page.waitForTimeout(2500);
await h.tab('ext:rpg-battle'); await h.click('^Fight'); await page.waitForTimeout(2500); await h.click('^Start'); await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/m20-fight.png` });
const overflow = await ev(() => { const p = document.querySelector('#story_block_sidebar'); return p ? { sw: p.scrollWidth, cw: p.clientWidth, doc: document.documentElement.scrollWidth } : null; });
console.log('overflow:', JSON.stringify(overflow));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
