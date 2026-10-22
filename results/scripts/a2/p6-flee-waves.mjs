// a2 probe 6: flee mid-wave: what counts as beaten, what loot/XP is paid, quest progress.
import { suiteHost } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
import { sessionOf } from '/home/user/cell/a2/rpg_battle/src/v2/combat/stored.js';
console.warn = () => {};
for (const seed of [1, 2, 3, 4, 5, 6]) {
  const host = await suiteHost({ pack: false, seed });
  await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
  await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', '+ quest Rat Cull — clear rats | goal: kill 8 Cellar Rat | reward: 40 gold | giver: Fenna']));
  const [q] = host.q('director.threads', { kind: 'quest', status: 'active' });
  await host.send('Down.', host.reply('Rats.', ['! encounter 8 Cellar Rat | tier: trivial']));
  const offer = host.q('combat.offers').at(-1);
  await host.cmd('combat.start', { offer: offer.id });
  let s = sessionOf(host.head().domains.combat);
  const xp0 = host.q('party.pc').xp;
  let n = 0, fled = null;
  for (; n < 80; n++) {
    s = sessionOf(host.head().domains.combat);
    if (!s || s.status !== 'active') break;
    const fight = host.q('combat.session');
    const foes = (fight?.combatants ?? []).filter(c => c.side === 'enemy'); const down = foes.filter(c => c.hp?.cur <= 0 || c.gone).length; const live = foes.find(c => c.hp?.cur > 0 && !c.gone);
    if (down >= 4 && !fled) { const r = await host.cmd('combat.flee', {}); fled = r.ok ? (r.receipt?.summary ?? 'ok').slice(0, 120) : r.code + ' ' + r.message; continue; }
    const r2 = await host.cmd('combat.act', { action: { type: 'attack', target: live?.id } }); if (!r2.ok) { console.log('act', r2.code, r2.message); break; }
  }
  const end = await host.cmd('combat.end', {});
  const beaten = host.q('combat.foesBeaten', {});
  console.log('seed', seed, 'status', host.q('combat.session')?.status ?? s?.status, '| fled:', fled, '| beaten', JSON.stringify(beaten.map(b => [b.won, b.foes])), '| quest', host.q('quest.progress', { id: q.id }).label, '| xp', xp0, '→', host.q('party.pc').xp, '| end', end.ok ? end.receipt?.summary?.slice(0, 160) : end.code);
  host.close();
}
