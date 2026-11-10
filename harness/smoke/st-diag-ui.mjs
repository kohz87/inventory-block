import { open, S } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1500);
// Open Extensions → RPG Battle → Diagnostics as a person would.
await page.click('#extensions-settings-button .drawer-toggle').catch(e => console.log('ext button', e.message));
await page.waitForTimeout(1200);
const header = page.locator('.rpg-battle-settings .inline-drawer-toggle').first();
await header.scrollIntoViewIfNeeded(); await header.click(); await page.waitForTimeout(800);
const summary = page.locator('.rpg-battle-settings details[data-fold="diagnostics"] > summary').first();
console.log('summary visible:', await summary.isVisible());
await summary.scrollIntoViewIfNeeded(); await summary.click(); await page.waitForTimeout(800);
const info = await ev(() => {
  const fold = document.querySelector('.rpg-battle-settings details[data-fold="diagnostics"]');
  const pre = fold?.querySelector('.rpg-battle-diagnostics');
  const cs = pre ? getComputedStyle(pre) : null;
  return { open: fold?.open, text: (pre?.textContent ?? '').slice(0, 200), len: pre?.textContent.length, color: cs?.color, bg: cs?.backgroundColor, display: cs?.display, height: pre?.getBoundingClientRect().height, foldsInDom: document.querySelectorAll('details[data-fold="diagnostics"]').length };
});
console.log(JSON.stringify(info, null, 1));
await page.locator('.rpg-battle-settings details[data-fold="diagnostics"]').first().screenshot({ path: `${S}/shots/rpg-diag-ui.png` }).catch(e => console.log('shot', e.message));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
