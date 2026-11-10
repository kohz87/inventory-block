import { open, S } from './demo-common.mjs';
const O = `${S}/shots/final`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms'); await h.dock();
await ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
const len0 = await ev(() => SillyTavern.getContext().chat.length);
await h.turn('Two thin wolves slip out of the reeds by the weir.\n<Encounter>3 wolf (even)</Encounter>', 'We wait by the weir.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await h.click('^Fight\\?$'); await page.waitForTimeout(3000);
await h.click('^Start$'); await page.waitForTimeout(1500);
for (let i = 0; i < 20; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(1300); }
await page.waitForTimeout(4000);
console.log('result:', (await h.pane()).slice(0, 160));
const text = await h.pane();
console.log('what next:', text.slice(text.indexOf('WHAT NEXT'), text.indexOf('WHAT NEXT') + 360));
await ev(() => document.querySelector('.story-block-pane .is-next')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
await page.screenshot({ path: `${O}/rpg-battle-next.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
const lenBefore = await ev(() => SillyTavern.getContext().chat.length);
const picked = await ev(() => { const b = document.querySelector('.story-block-pane .rpg-battle-next-move'); b?.click(); return b?.textContent.trim(); });
await page.waitForTimeout(800);
console.log('picked:', picked, '| box:', await ev(() => document.querySelector('#send_textarea')?.value), '| sent?', (await ev(() => SillyTavern.getContext().chat.length)) !== lenBefore);
console.log('battle tab still there:', await ev(() => Boolean(document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]'))));
// Clean up: empty the box, drop the test turn.
await ev(async () => { const t = document.querySelector('#send_textarea'); t.value = ''; const ctx = SillyTavern.getContext(); ctx.chat.splice(9); await ctx.saveChat(); await ctx.reloadCurrentChat(); });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
