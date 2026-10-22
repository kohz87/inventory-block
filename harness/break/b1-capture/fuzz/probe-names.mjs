import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(5);
const forms = ['Rope', 'rope', 'ROPE', 'Rópe', 'Rópe', 'Ro​pe', 'Ｒｏｐｅ', '‮Rope', 'Rope ', 'Ropes', 'R o p e'];
for (const kind of ['item', 'present', 'hook', 'faction', 'landmark']) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', 'Hello.');
  const op = kind === 'present' ? '+' : '+';
  await host.send('go', host.reply('S.', forms.map(f => `${op} ${kind} ${f}${kind === 'landmark' ? ' | region: R | kind: town' : kind === 'faction' ? ' — guild' : ''}`)));
  const d = host.head().domains;
  let names;
  if (kind === 'item') names = Object.values(d.inventory.defs).map(x => x.name).concat(['stacks:' + Object.values(d.inventory.stacks).map(s => s.qty).join(',')]);
  if (kind === 'present') names = d.scene.present;
  if (kind === 'hook') names = Object.values(d.director.threads).map(t => t.key);
  if (kind === 'faction') names = Object.values(d.chronicle.factions).map(t => t.name ?? t.key);
  if (kind === 'landmark') names = Object.values(d.atlas.places).map(t => t.name);
  console.log(kind.padEnd(9), JSON.stringify(names));
  for (const p of host.turn.problems()) console.log('    P', p.code, JSON.stringify(p.message.slice(0, 130)));
  host.close();
}
