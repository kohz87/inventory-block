// Equip on… past the carry limit: the piece the main character wore from the shared bag goes into
// their own carry with no carry check.
import { allHost } from './lib.mjs';
console.warn = () => {};
const h = await allHost({ extra: [] });
const pack = { id: 'gear', version: '1.0.0', requires: { storyBlock: '^2' }, content: { items: [
  { name: 'Old Mail', kind: 'equipment', slot: 'armour', value: 5 },
  { name: 'New Mail', kind: 'equipment', slot: 'armour', value: 5 },
  { name: 'Anvil', kind: 'goods', value: 1, note: 'heavy' },
] } };
const inst = await h.packs.packs.install(JSON.stringify(pack));
console.log('pack', inst.ok, JSON.stringify(inst.errors?.slice(0, 2)));
console.log((await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' })).ok);
await h.send('Look.', 'Gear.\n<Changes>\n+ item Old Mail\n+ item New Mail\n+ item Anvil | qty: 10\n</Changes>');
await h.send('More.', 'More.\n<Changes>\n+ item Anvil | qty: 10\n</Changes>');
await h.send('More.', 'More.\n<Changes>\n+ item Anvil | qty: 10\n</Changes>');
const inv = () => h.head().domains.inventory;
const st = name => Object.values(inv().stacks).find(s => inv().defs[s.def]?.name === name);
const pc = h.head().domains.party.pc;
console.log('pc', pc, 'STR', h.head().domains.party.actors[pc].stats.STR, 'stacks', Object.values(inv().stacks).map(s => [inv().defs[s.def].name, s.qty, s.owner, s.equipped, inv().defs[s.def].kind, inv().defs[s.def].slot]));
const carry = () => JSON.stringify(h.sdk.query('items.carry', { owner: pc, add: [] }));
console.log('equip old:', JSON.stringify(await h.sdk.command('inventory.equip', { stack: st('Old Mail').id })));
// fill the pc's own carry by hand-overs (each checked)
for (let i = 0; i < 23; i++) { const r = await h.sdk.command('inventory.transfer', { stack: st('Anvil').id, qty: 1, to: pc }); if (!r.ok) { console.log('transfer stop at', i, r.message); break; } }
console.log('pc carry before', carry());
const r = await h.sdk.command('inventory.equipOn', { stack: st('New Mail').id, actor: pc });
console.log('equipOn', r.ok, r.message ?? r.receipt?.summary);
console.log('pc carry after', carry(), JSON.stringify(h.sdk.query('inventory.encumbrance', {})));
