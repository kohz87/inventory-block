import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
for (const text of [
  '\n\n<think>\n<Changes>\n+ item Rope\n</Changes>',
  '<think>\n<Changes>\n+ item Torch\n</Changes>',
  'Story\n\n<think>\n<Changes>\n+ ' + 'k'.repeat(5000) + ' x\n</Changes>',
  'Story\n\n<Changes>\n+ ' + 'k'.repeat(5000) + ' x\n</Changes>',
]) {
  let t; const off = h.events.on('turn', x => { t = x; });
  await h.send('go', text); off();
  console.log(JSON.stringify(h.ctx.chat.at(-1).mes.slice(0, 120)), '| problems', (t?.problems??[]).map(p=>p.code+': '+String(p.message).slice(0,100)));
}
console.log(Object.keys(h.head().domains.inventory.defs));
h.close();
