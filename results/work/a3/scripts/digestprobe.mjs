import { allHost } from './lib.mjs';
console.warn = () => {};
const h = await allHost();
const seen = [];
h.sdk.on('committed', ({ receipt }) => seen.push(receipt.type));
await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send("U", "R.\n<Changes>\n~ time March 3, 8:00 am\n</Changes>"); console.log(JSON.stringify(h.sdk.query("director.time", {})));
for (let i = 0; i < 4; i++) {
  const r = await h.send(`U${i}`, `R${i}.\n<Changes>\n! time +30h\n</Changes>`);
  const t = [h.head().domains.director?.time, h.sdk.query("time.now", {})];
  console.log(i, JSON.stringify(t), JSON.stringify(h.head().domains.chronicle?.written), Object.keys(h.head().domains.chronicle?.days ?? {}));
}
console.log(seen.filter(x => !x.startsWith('checks')));
console.log(JSON.stringify(h.sdk.receipts().map(x => x.receipt.type)));
