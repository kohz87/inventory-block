import { allHost } from './lib/host.mjs';
console.warn = () => {};
const h = await allHost();
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('a', 'Fenna pays you.\n<Changes>\n+ item Rope\n+ coin 2');   // "+ coin 25 | from: Fenna" cut off by Stop
const inv = h.head().domains.inventory;
console.log('coin', inv.wallets.party?.coin, 'items', Object.values(inv.stacks).map(s => inv.defs[s.def].name));
console.log(JSON.stringify(h.ctx.chat.at(-1).mes));
