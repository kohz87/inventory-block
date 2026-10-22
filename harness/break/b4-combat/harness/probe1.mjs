import { playOut, rpgHost, seeded } from '../integration/helpers/host.js';
import { createHash } from 'node:crypto';
const h = s => createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0,12);
async function started() {
  const host = await rpgHost();
  const made = await host.cmd('party.create', { name: 'Ren', preset: 'fighter' });
  if (!made.ok) throw new Error(made.message);
  await host.send('walk', host.reply('Village.', ['~ place Bluewatch | kind: settlement']));
  return host;
}
await seeded(11, async () => {
  const host = await started();
  const r = await host.send('cellar', host.reply('Rats!', ['! encounter 2 Cellar Rat | tier: weak', '! encounter 1 Bandit | tier: even']));
  console.log('offers', host.q('combat.offers').map(o => o.id + ' ' + o.text));
  const [a, b] = host.q('combat.offers');
  const s1 = await host.cmd('combat.start', { offer: a.id });
  console.log('start1', s1.ok, s1.message ?? s1.receipt.summary);
  const s2 = await host.cmd('combat.start', { offer: a.id });
  console.log('start same again', s2.ok, s2.code, s2.message);
  const s3 = await host.cmd('combat.start', { offer: b.id });
  console.log('start other mid fight', s3.ok, s3.code, s3.message);
  console.log('session', host.q('combat.session').id, host.q('combat.session').status);
  // stale id
  const st = await host.cmd('combat.act', { session: 'fi_zzzzzzzz', action: { type: 'defend' } });
  console.log('stale act', st.ok, st.code, st.message);
  const before = h(host.head());
  host.store?.rebuild?.();
  console.log('rebuild eq', before === h(host.head()));
  console.log(Object.keys(host));
  host.close();
});
