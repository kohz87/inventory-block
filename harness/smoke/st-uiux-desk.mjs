import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const W = Number(process.env.W ?? 1440), H = Number(process.env.H ?? 1000), M = process.env.M === '1';
const tag = M ? 'phone' : 'desk';
const out = `${S}/uiux/ours/${tag}`; fs.mkdirSync(out, { recursive: true });
const h = await open({ width: W, height: H, mobile: M });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@15h00m00s000ms');
await h.dock?.();
await page.waitForTimeout(1500);
const tabs = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => ({ id: t.dataset.tabId, label: t.textContent.trim() })));
console.log('tabs:', JSON.stringify(tabs));
await page.screenshot({ path: `${out}/00-overview.png` });
let i = 1;
for (const t of tabs) {
  await h.tab(t.id); await page.waitForTimeout(900);
  const name = `${String(i++).padStart(2, '0')}-${String(t.id).replace(/[^a-z0-9-]+/gi, '_')}.png`;
  await page.screenshot({ path: `${out}/${name}` });
  const pane = await h.pane();
  console.log(name, '·', pane.slice(0, 160));
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
