import { open, S } from './demo-common.mjs';
const O = `${S}/shots/final`;
let h = await open({ width: 1440, height: 1000 });
await h.ev(async () => { const ctx = SillyTavern.getContext(); const s = ctx.extensionSettings.rpgBattle; s.terms = { levelName: 'Level', xpName: 'XP', tiers: null, cap: null }; s.xpRate = 1; ctx.saveSettingsDebounced(); });
await h.page.waitForTimeout(2500); await h.browser.close();
h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const tidy = () => ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
// The Bestiary of the chat with kin.
await h.openNarrator('The Narrator - 2026-10-18@05h32m14s356ms'); await h.dock(); await tidy();
await h.tab('ext:rpg-party');
const box = await ev(() => {
  const pane = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none');
  const fold = [...pane.querySelectorAll('details')].find(d => /BESTIARY/i.test(d.querySelector('summary')?.textContent ?? ''));
  if (!fold) return null;
  fold.open = true;
  fold.scrollIntoView({ block: 'start' });
  const r = fold.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height, text: fold.innerText.replace(/\s+/g, ' ').slice(0, 300) };
});
await page.waitForTimeout(600);
const b2 = await ev(() => { const pane = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); const fold = [...pane.querySelectorAll('details')].find(d => /BESTIARY/i.test(d.querySelector('summary')?.textContent ?? '')); const r = fold.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
console.log('bestiary:', box?.text, b2);
await page.screenshot({ path: `${O}/rpg-battle-bestiary.png`, clip: { x: b2.x - 10, y: Math.max(0, b2.y - 10), width: b2.w + 20, height: Math.min(b2.h + 20, 950) } });
// A setup with levels, threat words and XP each, in the healthy chat.
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms'); await h.dock(); await tidy();
await h.turn('Two thin dogs slink out of the reeds, and behind them something lean and scarred, bristles standing up like blades.\n<Encounter>2 ditch-dog (weak); then: razor dog (strong)</Encounter>', 'We wait by the weir.');
await page.waitForTimeout(3000); await tidy();
await h.tab('ext:rpg-battle'); await h.click('^Fight\\?$'); await page.waitForTimeout(3500);
console.log('setup:', (await h.pane()).slice(0, 400));
console.log('tooltips:', await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-new')].map(n => n.title).join(' | ')));
await page.screenshot({ path: `${O}/rpg-battle-setup-xp.png`, clip: { x: 1090, y: 40, width: 350, height: 600 } });
await h.click('^Not now'); await page.waitForTimeout(800);
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.splice(ctx.chat.length - 2, 2); await ctx.saveChat(); await ctx.reloadCurrentChat(); });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
