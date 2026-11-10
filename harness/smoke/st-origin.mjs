import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 1 && typeof window.rpgBattleInterceptor === 'function' && window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
await page.waitForTimeout(3000);
const ev = (fn, a) => page.evaluate(fn, a);
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
const probe = () => ev(async () => {
  const ctx = SillyTavern.getContext();
  const seen = {};
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, mes: 'I head out.', send_date: Date.now(), extra: {} });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  ctx.chat.pop();
  const p = ctx.extensionPrompts;
  const meta = ctx.chatMetadata.rpgBattle ?? {};
  return JSON.stringify({ len: ctx.chat.length, foughtAt: meta.foughtAt?.index ?? null, pending: meta.pending ? { attachedTo: meta.pending.attachedTo, origin: meta.pending.origin ?? null } : null, handoff: Boolean(p.rpg_battle?.value), rules: /<Encounter>/.test(p.rpg_battle_rules?.value ?? '') });
});
console.log('before:', await probe());
// Delete back past the reply the last fight started from (as the reader would, to retry the scene).
await ev(async () => {
  const ctx = SillyTavern.getContext();
  const at = ctx.chatMetadata.rpgBattle?.foughtAt?.index;
  if (Number.isInteger(at)) {
    ctx.chat.splice(at);
    await ctx.saveChat(); await ctx.reloadCurrentChat();
    await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_DELETED ?? ctx.event_types.MESSAGE_DELETED, ctx.chat.length);
  }
});
await page.waitForTimeout(1500);
console.log('after deleting back:', await probe());
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
