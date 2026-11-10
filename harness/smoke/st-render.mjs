import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const mes = fs.readFileSync(`${S}/repro/msg.txt`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
const info = await ev(async mes => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'I go to the sheepfold.', extra: {} });
  ctx.chat.push({ name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes, swipes: [mes], swipe_id: 0, extra: {} });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  await new Promise(r => setTimeout(r, 2500));
  const el = document.querySelector('#chat .mes:last-child .mes_text');
  return { html: el?.innerHTML.slice(0, 600), text: el?.innerText.slice(0, 300), settings: { display: ctx.extensionSettings.storyBlock.display, compat: ctx.extensionSettings.storyBlock.compatMarkup } };
}, mes);
console.log(JSON.stringify(info, null, 1));
await page.locator('#chat .mes').last().screenshot({ path: `${S}/shots/render-lead.png` });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
