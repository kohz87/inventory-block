import { started, seeded, offerAndStart } from './helpers.js';
await seeded(301, async () => {
  const host = await started();
  const log = () => JSON.stringify(host.head().domains.checks.log.map(e => [e.skill, e.roll, e.die, e.carrier.slice(0, 10)]));
  const prep = () => JSON.stringify(host.head().domains.checks.prepared.slice(-2));
  await host.send('try', host.reply('You sneak.', ['? check stealth — a | dc: 10 | roll: 1 | result: success']));
  console.log('1', log(), prep());
  await host.cont(host.reply(' Then you climb.', ['? check climb — b | dc: 10 | roll: 2 | result: success']));
  console.log('2 after continue', log(), prep());
  await host.cont(host.reply(' And look.', ['? check perception — c | dc: 10 | roll: 1 | result: success']));
  console.log('3 after 2nd continue', log());
  await host.swipe(host.reply('Swiped.', ['? check stealth — d | dc: 10 | roll: 1 | result: success']));
  console.log('4 after swipe', log(), prep());
  host.close();
});
