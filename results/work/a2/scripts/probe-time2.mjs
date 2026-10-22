import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(3);
for (const t of ['+999999h', '+1e309h', '+9007199254740993m', '+99999999999d', '+1,000h', '+½h', '+0h', '-5h', '+2h30m', '+1y', '+100 years', 'June 3, 99999999999, 09:00 am', 'June 3, 1200, 25:99 pm', 'June 3, -5, 09:00 am', 'June 3, 1e309, 09:00 am', 'Smarch 40, 1200, 09:00 am', 'June 3, 9007199254740993, 09:00 am', '+3h | due: x']) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', host.reply('Hello.', ['~ time June 3, 1200, 08:00 am', '+ quest Rats — cellar | giver: Fenna | goal: Kill 3 rats | reward: 5 gold | due: June 4, 1200, 08:00 am']));
  const m0 = host.head().domains.director.time;
  const line = t.startsWith('June') || t.startsWith('Smarch') ? `~ time ${t}` : `! time ${t}`;
  const t0 = performance.now();
  await host.send('go', host.reply('Story.', [line]));
  const ms = performance.now() - t0;
  const d = host.head().domains.director;
  const p = host.turn.problems().slice(-1)[0];
  let tail = '';
  try { await host.send('next', 'ok'); tail = host.tails().at(-1); } catch (e) { tail = 'ERR ' + e.message; }
  console.log(line.padEnd(30), 'min', JSON.stringify(m0?.minutes), '->', JSON.stringify(d.time?.minutes), `${ms.toFixed(0)}ms`, 'prob:', p ? p.message.slice(0, 120) : '-', '| dirProb:', d.problems.at(-1)?.text?.slice(0, 100) ?? '-');
  console.log('   tail:', tail.split('\n').filter(l => /time|Day|clock|Rats|quest/i.test(l)).join(' / ').slice(0, 300));
  host.close();
}
