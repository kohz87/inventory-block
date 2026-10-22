import { market } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/econ.js';
console.warn = () => {};
const host = await market();
console.log(JSON.stringify(host.q('party.ranks', {})?.slice?.(0, 3)));
await host.internal('party.grantXp', { amount: 50000 });
console.log('level', host.q('party.pc')?.level);
await host.send('Go.', host.reply('Foes.', ['! encounter Rat King (boss) | rank: F', '! encounter 3 Rat | rank: F']));
for (const o of host.q('combat.offers')) console.log(JSON.stringify(o.foes), o.text ?? o.summary ?? '');
host.close();
