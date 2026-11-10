import { open, S } from './demo-common.mjs';
const OUT = `${S}/uiux/rb-fix2`;
const h = await open({ width: 1180, height: 900 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1000);
// Settings with the sidebar out of the way.
await ev(() => { const s = document.querySelector('#story_block_sidebar'); if (s) s.style.display = 'none'; });
await ev(() => document.querySelector('#extensions-settings-button .drawer-toggle')?.click());
await page.waitForTimeout(800);
await ev(() => { const root = document.querySelector('.rpg-battle-settings'); if (root && !root.querySelector('.inline-drawer-content')?.offsetParent) root.querySelector('.inline-drawer-toggle')?.click(); });
await page.waitForTimeout(600);
await ev(() => { const f = document.querySelector('.story-suite-fold[data-fold="trade"]'); if (f) f.open = true; f?.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(500);
await page.locator('.story-suite-fold[data-fold="trade"]').screenshot({ path: `${OUT}/settings-trade.png` });
await ev(() => document.querySelector('#extensions-settings-button .drawer-toggle')?.click());
await ev(() => { const s = document.querySelector('#story_block_sidebar'); if (s) s.style.display = ''; });
await page.waitForTimeout(600);
await h.dock().catch(() => {});
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('mode attr:', await ev(() => JSON.stringify({ ...document.querySelector('.rpg-battle-tab')?.dataset })));
console.log('auto:', await h.click('^Auto'));
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(1000);
  const txt = await h.pane();
  if (/Victory|Defeat|won|Return to story|Just continue/i.test(txt)) break;
}
console.log('result:', (await h.pane()).slice(0, 700));
await page.locator('#story_block_sidebar').screenshot({ path: `${OUT}/fight-result.png` });
console.log('bestiary:', await ev(() => JSON.stringify((SillyTavern.getContext().chatMetadata.rpgBattle?.bestiary ?? []).map(e => e.name))));
console.log('inventory loot:', await ev(() => (globalThis.StoryBlock.getBlock('Inventory')?.text ?? '').split('[Loot]')[1]));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
