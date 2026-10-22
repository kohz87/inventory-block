import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
await h.send('hi', h.reply('x', ['~ npc Fenna | trust: +5', '+ join Lyra — archer | level: 2 | role: ranger','+ item Healing Draught | qty: 2']));
const d = h.head().domains;
console.log(Object.keys(d));
for (const k of Object.keys(d)) console.log(k, JSON.stringify(d[k]).slice(0, 700));
h.close();
