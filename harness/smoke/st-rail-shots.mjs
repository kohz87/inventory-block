import { open, S } from './demo-common.mjs';
const W = Number(process.env.W), H = Number(process.env.H), M = process.env.M === '1', DEV = process.env.DEV;
const out = `${S}/uiux/rail`;
const h = await open({ width: W, height: H, mobile: M });
const { page, ev } = h;
const shot = name => page.screenshot({ path: `${out}/rail-${DEV}-${name}.png` });
const openPanel = async () => {
  const mode = await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
  if (mode !== 'docked' && !(await ev(() => document.querySelector('#story_block_sidebar')?.classList.contains('is-open')))) {
    await page.locator('#story_block_handle').click().catch(() => {});
    await page.waitForTimeout(800);
  }
};
const setSb = (key, value) => ev(([k, v]) => { const c = SillyTavern.getContext(); c.extensionSettings.storyBlock[k] = v; c.saveSettingsDebounced(); window.StoryBlock.refresh(); }, [key, value]);
const was = await ev(() => SillyTavern.getContext().extensionSettings.storyBlock.tabLayout ?? null);
await h.openNarrator('The Narrator - 2026-10-18@16h00m00s000ms');
await setSb('tabLayout', 'rail');
await page.waitForTimeout(1200);
await openPanel();
console.log(DEV, 'mode:', await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode), 'layout:', await ev(() => document.querySelector('#story_block_sidebar')?.dataset.tabLayout));
await h.tab('block:inventory'); await page.waitForTimeout(600);
await shot('inventory');
await h.tab('ext:story-director-quests'); await page.waitForTimeout(600);
await ev(() => { const d = document.querySelector('.story-director-fold.is-offered'); if (d) d.open = true; });
await page.waitForTimeout(300);
await shot('quests');
// The label beside the rail: hovered on desktop/tablet, long-pressed on the phone.
if (!M) {
  await page.locator('.story-block-sidebar-tab[data-tab-id="ext:npc-state-delta-cast"]').hover();
  await page.waitForTimeout(400);
  await shot('hint');
  await page.mouse.move(5, 5);
} else {
  const box = await page.locator('.story-block-sidebar-tab[data-tab-id="ext:story-director-quests"]').boundingBox();
  if (box) {
    await page.evaluate(() => {});
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
    await page.waitForTimeout(700);
    await shot('hint');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}
// Story Director switched off: its group simply goes.
const sdWas = await ev(() => SillyTavern.getContext().extensionSettings.storyDirector?.enabled);
await ev(() => { const c = SillyTavern.getContext(); c.extensionSettings.storyDirector.enabled = false; window.StoryBlock.refresh(); });
await page.waitForTimeout(1200);
await h.tab('block:inventory'); await page.waitForTimeout(500);
console.log(DEV, 'tabs with SD off:', await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(' ')));
await shot('disabled');
await ev(v => { const c = SillyTavern.getContext(); c.extensionSettings.storyDirector.enabled = v; c.saveSettingsDebounced(); window.StoryBlock.refresh(); }, sdWas);
await page.waitForTimeout(1000);
// The classic rows, for comparison.
await setSb('tabLayout', 'rows');
await page.waitForTimeout(1200);
await openPanel();
await h.tab('block:inventory'); await page.waitForTimeout(500);
await shot('rows');
await setSb('tabLayout', was ?? 'rail');
await page.waitForTimeout(2500);
console.log(DEV, 'errors:', h.errors.join('\n') || 'none');
await h.browser.close();
