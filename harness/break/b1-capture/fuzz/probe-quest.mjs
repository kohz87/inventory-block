import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(13);
const host = await suiteHost();
await withParty(host);
await host.send('hi', 'Hello.');
await host.send('Work?', host.reply('Fenna: rats.', ['~ place Bluewatch | kind: settlement', '+ quest Granary Rats — cellar | giver: Fenna | goal: Kill 1 cellar rat | reward: 9007199254740991 gold', '+ quest Lost Ring — find it | giver: Fenna | goal: Find the ring | reward: 1e309 gold', '+ quest Ring Two — find it | giver: Fenna | goal: Find the ring | reward: 999999 gold | difficulty: easy']));
for (const k of ['Granary Rats', 'Lost Ring', 'Ring Two']) console.log(k, JSON.stringify(host.q('director.thread', { key: k })?.reward));
for (const k of ['Granary Rats', 'Lost Ring', 'Ring Two']) console.log('take', k, (await host.cmd('quest.take', { key: k })).ok);
await host.send('fight', host.reply('A rat.', ['! encounter 1 Cellar Rat — squeaks | tier: trivial']));
await host.cmd('combat.start', { offer: host.q('combat.offers')[0].id });
for (let i = 0; i < 60; i++) { const s = host.q('combat.session'); if (!s || s.status !== 'active') break; await host.cmd('combat.act', { action: { type: 'auto' } }); }
console.log('end', (await host.cmd('combat.end')).ok);
console.log('progress', JSON.stringify(host.q('quest.progress', { key: 'Granary Rats' })));
await host.send('I hand in the rat tails to Fenna.', host.reply('Fenna pays.', ['- quest Granary Rats — done', '~ quest Lost Ring | met: yes', '- quest Lost Ring — done', '~ quest Ring Two | met: yes', '- quest Ring Two — done']));
console.log('wallet', host.q('inventory.wallet', { owner: 'party' }));
for (const p of host.turn.problems().slice(-8)) console.log('P', p.code, p.message.slice(0, 200));
for (const p of host.head().domains.director.problems.slice(-6)) console.log('DP', p.text?.slice(0, 200));
for (const k of ['Granary Rats', 'Lost Ring', 'Ring Two']) console.log(k, JSON.stringify(host.q('director.thread', { key: k })?.ended));
