import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost(); await withParty(h);
await h.send('go', 'Road.');
for (const lines of [['? check stealth — sneak | dc: hard | roll: 2'], ['? check stealth — sneak | dc: hard | roll: 2', '? check stealth — sneak | dc: hard | roll: 2'], ['? check stealth — sneak | dc: hard | result: success'], ['? check stealth — sneak | dc: 1'], ['? check stealth — sneak | dc: -5'], ['? check stealth — sneak | dc: 0x1'], ['? check STR — lift | dc: easy | who: Fenna']]) {
  const tail = h.tails().at(-1); const dice = /Roll 1 = (\d+) · Roll 2 = (\d+)/.exec(tail);
  let t; const off = h.events.on('turn', x => { t = x; }); await h.send('go', h.reply('Try.', lines)); off();
  const log = Object.values(h.head().domains.checks.log).slice(-lines.length);
  console.log('dice', dice?.slice(1), JSON.stringify(lines), '→', JSON.stringify(log.map(l => [l.roll ?? l.die ?? l.d20, l.dc, l.success ?? l.outcome ?? l.result])), (t?.problems ?? []).map(p => p.message.slice(0, 100)));
}
console.log(JSON.stringify(Object.values(h.head().domains.checks.log).at(-1)).slice(0, 400));
h.close();
