import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(5);
const host = await suiteHost();
await withParty(host);
await host.send('hi', 'Hello.');
const per = Number(process.argv[2] ?? 50), rounds = Number(process.argv[3] ?? 8);
let k = 0;
for (let r = 0; r < rounds; r++) {
  const lines = Array.from({ length: per }, () => { k++; return `+ quest Q${k} — a job | giver: G | goal: Kill 3 rats | reward: 5 gold`; });
  const t0 = performance.now();
  await host.send('go', host.reply('Story.', lines));
  const t1 = performance.now();
  await host.send('next', 'Quiet.');
  const t2 = performance.now();
  console.log(`threads=${Object.keys(host.head().domains.director.threads).length} capture=${(t1-t0).toFixed(0)}ms plainReply=${(t2-t1).toFixed(0)}ms chat=${(JSON.stringify(host.ctx.chat).length/1e6).toFixed(2)}MB`);
}
