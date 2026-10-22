// Tolerant names: which def / stack does each written variant land on?
import { allHost } from './lib.mjs';
console.warn = () => {};
const h = await allHost({ extra: [] });
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
const turns = []; h.sdk.on('turn', t => turns.push(t));
const inv = () => h.head().domains.inventory;
const show = () => Object.values(inv().stacks).map(s => `${inv().defs[s.def].name}×${s.qty}`).sort().join(', ');
const send = async lines => { await h.send('x', `y\n<Changes>\n${lines.join('\n')}\n</Changes>`); const t = turns.at(-1); return t.problems.map(p => p.code).join(',') || 'ok'; };
console.log(await send(['+ item Healing Potion | qty: 2', '+ item Iron Key', '+ item Rope']));
console.log('start:', show());
for (const line of ['+ item Healing Potion (Greater)', '+ item Healing Potions', '+ item Potion of Healing', '+ item the Healing Potion', '+ item Healing Potion​', '+ item Healing Pоtion', '+ item HEALING POTION', '+ item Héaling Potion', '+ item Key Iron', '+ item Iron Keys', '+ item a coil of Rope', '+ item Ropes (frayed)']) {
  const r = await send([line]);
  console.log(line.padEnd(36), r.padEnd(14), show());
}
for (const line of ['- item Healing Potion (Greater)', '- item Healing Pоtion', '- item Key of Iron', '- item some Rope']) {
  const r = await send([line]);
  console.log(line.padEnd(36), r.padEnd(14), show());
}
for (const q of ['Healing Potion (Greater)', 'Greater Healing Potion', 'Iron Key (gate)', 'Rоpe']) console.log('find', q, JSON.stringify(h.sdk.query('inventory.find', { name: q }))?.slice(0, 160));
