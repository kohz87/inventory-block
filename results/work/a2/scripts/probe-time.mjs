import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
await h.send('go', h.reply('x', ['~ time March 3, 8:00 am', '+ clock Doom — the end | due: Day 3, 09:00 | shown: sign', '+ agenda Fenna — plots | now: inn | then: x | on: Day 2, 10:00', '+ event Fair — a fair | then: x | on: Day 5, 10:00']));
for (const n of [1, 150]) {
  const t0 = performance.now();
  await h.send('wait', h.reply('Time passes.', Array.from({ length: n }, () => '! time +30d')));
  const d = h.head().domains.director;
  console.log(n, 'lines:', Math.round(performance.now() - t0), 'ms; days now', Math.round(d.time.minutes / 1440), '| state KB', Math.round(JSON.stringify(h.head()).length / 1024), '| tail chars', h.tails().at(-1)?.length);
}
const t0 = performance.now(); await h.send('next', 'Quiet.'); console.log('next reply', Math.round(performance.now() - t0), 'ms');
console.log(h.tails().at(-1)?.slice(0, 1500));
h.close();
