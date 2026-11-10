import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(9);
const host = await suiteHost();
await withParty(host);
await host.send('hi', host.reply('A king\'s ransom.', ['+ coin 9007199254740991 | from: a dragon']));
console.log('wallet', host.q('inventory.wallet', { owner: 'party' }));
await host.send('fight', host.reply('A rat.', ['! encounter 1 Cellar Rat — squeaks | tier: trivial']));
const offer = host.q('combat.offers')[0];
console.log('start', (await host.cmd('combat.start', { offer: offer.id })).ok);
for (let i = 0; i < 60; i++) {
  const s = host.q('combat.session');
  if (!s || s.status !== 'active') break;
  const r = await host.cmd('combat.act', { action: { type: 'auto' } });
  if (!r.ok) { console.log('act refused', r.code, r.message); break; }
}
console.log('status', host.q('combat.session')?.status);
const end = await host.cmd('combat.end');
console.log('end', end.ok, end.code, end.message?.slice(0, 300));
console.log('session after', host.q('combat.session')?.status);
const end2 = await host.cmd('combat.end');
console.log('end2', end2.ok, end2.code, end2.message?.slice(0, 200));
// generation blocked?
const g = await host.send('and?', 'Ok.');
console.log('gen aborted?', g.aborted, host.st.notices.slice(-1));
