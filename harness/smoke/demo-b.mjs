import { open } from './demo-common.mjs';
const h = await open();
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
await h.dock();
console.log('name1:', await ev(() => SillyTavern.getContext().name1));
await h.tab('ext:rpg-party');
let text = await h.pane();
console.log('offers:', text.slice(0, 200));
if (/Rename User to Ren/.test(text)) { console.log('rename:', await h.click('^Rename')); await page.waitForTimeout(1500); }
else if (/\bUser Level 1 you\b/.test(text)) {
  console.log('start over 1:', await h.click('^Start over')); await page.waitForTimeout(500);
  console.log('start over 2:', await h.click('^Click again to start over')); await page.waitForTimeout(1500);
  console.log('pane:', (await h.pane()).slice(0, 250));
  const order = ['AGI', 'DEX', 'STR', 'AGI', 'VIT', 'DEX', 'AGI', 'STR', 'LUK', 'AGI'];
  for (const stat of order) { await page.locator(`.story-block-pane .rpg-battle-stepper[data-stat="${stat}"] .is-plus`).first().click().catch(() => {}); await page.waitForTimeout(80); }
  console.log('create:', await h.click('^Create character')); await page.waitForTimeout(2500);
}
text = await h.pane();
console.log('now:', text.slice(0, 300));
console.log('add skill:', await h.click('^Add it')); await page.waitForTimeout(1500);
console.log('learn screen:', (await h.pane()).slice(0, 300));
console.log('learn:', await ev(() => { const b = document.querySelector('.story-block-pane .rpg-battle-learn-template'); b?.click(); return b ? b.textContent.trim() : 'missing'; })); await page.waitForTimeout(2000);
console.log('add companion:', await h.click('^Add as companion')); await page.waitForTimeout(6000);
console.log('form:', (await h.pane()).slice(0, 500));
console.log('buttons:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent && !b.disabled).map(b => b.textContent.trim()).filter(Boolean))));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
