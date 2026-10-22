import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const mes = fs.readFileSync(process.argv[2], 'utf8');
await h.turn(mes, 'I pay the fee.');
await page.waitForTimeout(2500);
const saved = await ev(() => SillyTavern.getContext().chat.at(-1).mes);
console.log('saved changed:', saved !== mes, '| starts:', JSON.stringify(saved.slice(0, 30)), '| glue fixed:', /to be?"\n\n<!--/.test(saved));
console.log('shown text:', JSON.stringify(await ev(() => document.querySelector('#chat .mes:last-child .mes_text')?.innerText.slice(0, 300))));
console.log('html head:', JSON.stringify(await ev(() => document.querySelector('#chat .mes:last-child .mes_text')?.innerHTML.slice(0, 300))));
// What SillyTavern's own formatter makes of the raw text
console.log('formatted:', JSON.stringify(await ev(t => { const ctx = SillyTavern.getContext(); return (ctx.messageFormatting ?? window.messageFormatting)?.(t, 'The Narrator', false, false, 0)?.slice(0, 300); }, mes)));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
