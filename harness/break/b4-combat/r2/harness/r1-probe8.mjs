import { started, seeded, playOut, offerAndStart, replayed, hash } from './helpers.js';
const chk = async (host, label) => { const rp = await replayed(host); console.log('  ', label, hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH'); };
await seeded(51, async () => {
  for (const stakes of ['normal', 'death']) {
    const host = await started();
    await host.internal('party.addCompanion', { name: 'Lyra', role: 'ranger' });
    await host.internal('party.addCompanion', { name: 'Kael', role: 'knight' });
    const coinBefore = JSON.stringify(host.q('inventory.wallet', { owner: 'party' }));
    await host.send('give', host.reply('Kael gets a sword', ['+ item Iron Sword | owner: Kael']));
    await offerAndStart(host, `! encounter 1 Ancient Dragon (boss) | tier: deadly | stakes: ${stakes}`);
    const st = await playOut(host); const e = await host.cmd('combat.end');
    console.log(stakes, st, 'died', JSON.stringify(e.receipt?.data.died), 'party', host.q('party.actors').map(a => a.name + ':' + a.hp.cur + '/' + a.conditions.map(c=>c.kind).join('/')).join(' '));
    console.log('  summary', e.receipt.summary.slice(0, 300));
    console.log('  xp', JSON.stringify(e.receipt.data.xp), 'pc xp', host.q('party.pc').xp);
    const g = await host.send('next', 'after');
    console.log('  generate aborted', g.aborted ?? false, host.st.notices.at(-1));
    let point = null; try { point = host.q('return.point'); } catch (err) { console.log('  return.point throws', err.message); }
    console.log('  return.point', JSON.stringify(point));
    if (point) {
      const r = await host.sdk.rewind({ index: point.index, beforeRev: point.beforeRev });
      console.log('  rewind', JSON.stringify(r).slice(0,200));
      const cue = await host.cmd('return.cue', { fight: point.fight, place: point.place }, { cause: 'system' });
      console.log('  cue', cue.ok, cue.code ?? '', 'party now', host.q('party.actors').map(a => a.name + ':' + a.hp.cur + '/' + a.conditions.map(c=>c.kind).join('/')).join(' '), 'offers', host.q('combat.offers').length, 'session', host.q('combat.session')?.status ?? null);
      await chk(host, 'after return');
    }
    await chk(host, stakes);
    host.close();
  }
});
