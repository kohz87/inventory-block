import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(13);
const host = await suiteHost();
await withParty(host);
await host.send('hi', 'Hello.');
for (let r = 0; r < 4; r++) {
  const lines = [];
  for (let i = 0; i < 100; i++) lines.push(`+ join J${r}x${i} — a stranger`, `+ skill Ren — Sk${r}x${i}: a cut`, `! encounter 2 Wolf${r}x${i} — growl`, `+ hook H${r}x${i} — thread`);
  const t0 = performance.now();
  await host.send('go', host.reply('S.', lines));
  const d = host.head().domains;
  console.log(`round ${r}: party.offers=${d.party.offers.length} combat.offers=${d.combat.offers.length} threads=${Object.keys(d.director.threads).length} capture=${(performance.now() - t0).toFixed(0)}ms chat=${(JSON.stringify(host.ctx.chat).length / 1e6).toFixed(1)}MB problems=${host.turn.problems().length}`);
}
