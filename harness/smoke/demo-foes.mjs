import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
await h.dock();
console.log('bestiary:', await ev(() => JSON.stringify((SillyTavern.getContext().chatMetadata.rpgBattle?.bestiary ?? []).map(e => e.name))));
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.splice(9); await ctx.saveChat(); await ctx.reloadCurrentChat(); await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_DELETED ?? ctx.event_types.MESSAGE_DELETED, ctx.chat.length); });
await page.waitForTimeout(1500);
const rules = await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, mes: 'x', send_date: new Date().toISOString(), extra: {} }); await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal'); ctx.chat.pop(); return ctx.extensionPrompts?.rpg_battle_rules?.value ?? ''; });
console.log('instruction ends:', rules.slice(-160));
await h.turn('Two more wolves slink out of the reeds, ribs showing, and behind them the old she-wolf limps into view.\n<Encounter>2 mangy young wolf (weak); then: wolf matriarch (boss, even)</Encounter>', 'We wait by the weir.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await h.click('^Fight\\?$'); await page.waitForTimeout(3000);
console.log('setup:', (await h.pane()).slice(0, 420));
// Clean up the test turn.
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat.splice(9); await ctx.saveChat(); await ctx.reloadCurrentChat(); });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
