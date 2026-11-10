import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
console.log(await ev(async () => {
  const ctx = SillyTavern.getContext();
  const r3 = ctx.chat[6].mes, r4i = 8;
  const inv = window.StoryBlock.blockInText(r3, 'Inventory');
  let mes = ctx.chat[r4i].mes
    .replace('until you give her the opening she wants and she takes a strip out of your forearm for it.', 'until she finds the gap she wants and takes a strip out of Lyra\'s forearm instead of yours.')
    .replace('Lyra binds your arm with quick, cold fingers and then sits down hard', 'Lyra binds her own arm with quick, cold fingers and then sits down hard')
    .replace('* *Visible Condition:* Bitten forearm, bound by Lyra', '* *Visible Condition:* Unhurt, breathing hard, magic spent')
    .replace('* *Condition:* Unhurt, exhausted', '* *Condition:* Bitten forearm, bound')
    .replace('three wolf pelts', 'wolf pelts and fangs');
  const invText = typeof inv === 'string' ? inv : inv?.text ?? inv?.body ?? '';
  mes = mes.replace(/<Inventory>[\s\S]*?<\/Inventory>/, `<Inventory>\n${invText.trim()}\n</Inventory>`);
  ctx.chat[r4i].mes = mes; ctx.chat[r4i].swipes = [mes];
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return JSON.stringify({ invType: typeof inv, inv: invText.slice(0, 400) });
}));
await page.waitForTimeout(1500);
console.log('inventory now:', await ev(() => window.StoryBlock.getBlock('Inventory')?.text));
await h.browser.close();
