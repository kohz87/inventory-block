import { open, S } from './demo-common.mjs';
const O = `${S}/shots/final`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const side = file => page.screenshot({ path: `${O}/${file}.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
console.log(await ev(async () => {
  const ctx = SillyTavern.getContext();
  let n = 0;
  for (const m of ctx.chat) {
    if (m.mes.includes('Grey Wolf Matriarch Pelt | 3')) { m.mes = m.mes.replaceAll('Grey Wolf Matriarch Pelt | 3', 'Grey Wolf Matriarch Pelt | 1'); if (Array.isArray(m.swipes)) m.swipes[m.swipe_id ?? 0] = m.mes; n++; }
  }
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return `fixed ${n} messages`;
}));
await page.waitForTimeout(2000);
await h.dock(); await ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
await h.tab('block:inventory'); await ev(() => [...document.querySelectorAll('.story-block-pane .story-block-tree-child')].find(n => /^Loot/.test(n.textContent.trim()))?.click()); await page.waitForTimeout(700);
await side('story-block-inventory');
console.log((await h.pane()).slice(0, 300));
await h.browser.close();
