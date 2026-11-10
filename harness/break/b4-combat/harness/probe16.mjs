import { started, seeded, replayed, hash } from './helpers.js';
await seeded(71, async () => {
  const host = await started();
  const log = () => host.head().domains.checks.log.map(e => `${e.skill} roll${e.roll}=${e.die} ${e.outcome}${e.mismatch ? ' MISMATCH ' + e.mismatch : ''}${e.note ? ' [' + e.note + ']' : ''}`);
  const prepared = () => JSON.stringify(host.head().domains.checks.prepared.at(-1));
  // A: cherry-pick
  await host.send('sneak', host.reply('You slip past.', ['? check stealth — slipping past | dc: hard | roll: 2 | result: success']));
  console.log('A prepared', prepared(), log());
  // B: by die value
  const rolls = host.head().domains.checks.prepared.at(-1);
  await host.send('climb', 'thinking');
  const p = host.head().domains.checks.prepared.at(-1).rolls; console.log('B tail rolls', p);
  await host.swipe(host.reply('You climb.', [`? check climbing — the wall | dc: normal | roll: ${Math.max(...p)} | result: success`]));
  console.log('B', JSON.stringify(host.head().domains.checks.prepared.at(-1)), log().slice(-1));
  // C: continue changes dice?
  await host.send('pick lock', host.reply('You work the lock.', ['? check lockpicking — the door | dc: normal | roll: 1 | result: success']));
  const before = log().slice(-1)[0];
  await host.cont(host.reply(' And then more.', ['? check perception — the hall | dc: easy | roll: 2 | result: success']));
  console.log('C before cont', before, '| after', log().slice(-2));
  await host.st.editMessage(host.st.ctx.chat.length - 1, host.st.ctx.chat.at(-1).mes.replace('roll: 1', 'roll: 2'));
  console.log('C after edit', log().slice(-2));
  const rp = await replayed(host); console.log(hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH');
  // D: stat choice
  await host.send('x', host.reply('y', ['? check climbing — wall | dc: normal | stat: STR | roll: 1 | result: success', '? check climbing — wall again | dc: normal | stat: CHA | roll: 2 | result: success']));
  console.log('D', host.head().domains.checks.log.slice(-2).map(e => e.stat + ' ' + JSON.stringify(e.modifiers)));
  // E: 3rd check
  await host.send('x', host.reply('y', ['? check a | dc: 5 | roll: 1', '? check b | dc: 5 | roll: 2', '? check c | dc: 5 | roll: 1']));
  console.log('E log tail', log().slice(-3));
  host.close();
});
