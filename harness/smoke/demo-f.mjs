import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
console.log(await ev(async () => {
  const ctx = SillyTavern.getContext();
  const i = 8;
  const mes = ctx.chat[i].mes.replace('~ Captain Kael — now: Waiting at the post | then: Pays four silver on proof', '+ agenda Captain Kael — now: Waiting at the post | then: Pays four silver on proof');
  ctx.chat[i].mes = mes; ctx.chat[i].swipes = [mes];
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return /\+ agenda Captain Kael/.test(ctx.chat[i].mes);
}));
await h.browser.close();
