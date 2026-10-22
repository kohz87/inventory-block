// a2 probe 5b: Ersveil (scale 8): generic shop off the pack's map vs pack shop; fight loot coin.
import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { playOut } from '/home/user/cell/a2/rpg_battle/tests/v2/integration/helpers/host.js';
console.warn = () => {};
const host = await started({ seed: 3 });
const forge = host.q('trade.stock', { kind: 'Gate Forge' });
console.log('Bluewatch Gate Forge', JSON.stringify(forge.items.filter(i => i.def.kind === 'equipment').map(i => [i.def.name, i.def.value, i.price])));
await host.send('Travel.', host.reply('Thornwick.', ['~ place Thornwick Village | kind: settlement', '+ item Short Sword | note: weapon, ATK +3']));
const st = host.q('trade.stock', { kind: 'smith' });
console.log('Thornwick smith', JSON.stringify(st.items.map(i => [i.def.name, i.def.value, i.price])));
const sw = host.items().find(i => i.name === 'Short Sword'); console.log('story Short Sword', sw?.kind, sw?.value);
let total = 0;
for (let i = 0; i < 3; i++) {
  await host.send('Road.', host.reply('Bandits.', ['! encounter 2 Bandit | tier: trivial']));
  const offer = host.q('combat.offers').at(-1); const c0 = host.wallet();
  const r = await host.cmd('combat.start', { offer: offer.id }); if (!r.ok) { console.log(r.message); break; }
  await playOut(host); total += host.wallet() - c0;
}
console.log('loot coin over 3 trivial bandit fights', total, 'moneyScale', JSON.stringify(host.receipts().filter(r => /fight|loot/i.test(r.summary)).slice(-1).map(r => r.summary)));
host.close();
