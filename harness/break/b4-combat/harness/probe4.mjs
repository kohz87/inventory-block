import { rpgHost, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
const MID = 'rpg-battle';
async function mk(settings) {
  const host = await rpgHost({ settings: { modules: { [MID]: settings } } });
  const r = await host.cmd('party.create', { name: 'Ren', preset: 'fighter' });
  if (!r.ok) console.log('create', r.message);
  return host;
}
await seeded(5, async () => {
  for (const s of [{ 'party.maxLevel': 1 }, { 'party.maxLevel': 999 }, { 'party.maxLevel': 1, terms: { tiers: { size: 10 } } }, { 'party.maxLevel': 999, terms: { tiers: { size: 1 } } }, { 'party.maxLevel': 999, terms: { tiers: { size: 999 }, levelName: 'Circle' } }]) {
    const host = await mk(s);
    for (const amount of [100, 1e6, Number.MAX_SAFE_INTEGER, 1e300]) {
      const g = await host.cmd('party.grantXp', { amount });
      const pc = host.q('party.pc');
      console.log(JSON.stringify(s), amount, g.ok, g.code ?? '', (g.message ?? g.receipt.summary).slice(0,120), '| lvl', pc.level, 'xp', pc.xp, 'pts', pc.points, 'hp', pc.hp.max);
    }
    const cards = host.q('rpg-battle.cards');
    console.log('  card', JSON.stringify(cards?.[0])?.slice(0,300));
    const rp = await replayed(host); if (hash(rp) !== hash(host.head())) console.log('  REPLAY MISMATCH');
    host.close();
  }
  // level-down via settings edit
  const host = await mk({ 'party.maxLevel': 20 });
  await host.cmd('party.grantXp', { amount: 5000 });
  console.log('lvl before', host.q('party.pc').level);
  host.settings.set(MID, 'party.maxLevel', 3);
  const pc = host.q('party.pc');
  console.log('after cap 3: level', pc.level, 'card', JSON.stringify(host.q('rpg-battle.cards')?.[0])?.slice(0,200));
  const g = await host.cmd('party.grantXp', { amount: 10 }); console.log('grant at cap', g.ok, g.code, g.message ?? g.receipt.summary);
  host.close();
});
