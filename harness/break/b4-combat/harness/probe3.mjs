import { started, seeded, replayed, hash, playOut, offerAndStart } from './helpers.js';
async function dead() {
  const host = await started();
  const { start } = await offerAndStart(host, '! encounter 1 Lich (boss) | tier: deadly | stakes: death');
  await playOut(host); const e = await host.cmd('combat.end');
  return { host, e };
}
await seeded(3, async () => {
  let { host, e } = await dead();
  const pc = () => host.q('party.pc');
  console.log('end', e.receipt.data.outcome, pc().hp, pc().conditions);
  for (const [t, p] of [['party.rest', { kind: 'long' }], ['party.rest', { kind: 'short' }], ['party.heal', { actor: pc().id, hp: 10 }], ['item.use', {}],
     ['party.applyResult', { outcome: 'victory', stakes: 'normal', actors: [{ id: pc().id, hp: { cur: 50, max: 50 }, mp: { cur: 5, max: 5 }, down: false, conditions: [], uses: {} }] }]]) {
    const r = await host.cmd(t, p);
    console.log(t, r.ok, r.code ?? '', r.message ?? r.receipt?.summary, 'dead?', pc().conditions.map(c=>c.kind), pc().hp.cur);
  }
  host.close();
  ({ host, e } = await dead());
  for (const type of ['continue', 'quiet', 'impersonate', 'swipe', 'regenerate']) {
    const r = await host.st.generate(type, { reply: host.reply(' more', ['~ wound Ren — heal grievous: a miracle | heal: grievous']) });
    console.log('gen', type, 'aborted', r.aborted ?? false, 'hp', pc().hp.cur, pc().conditions.map(c => c.kind));
  }
  host.close();
  ({ host, e } = await dead());
  const r = await host.cmd('party.create', { name: 'Ren Two', preset: 'fighter', replace: true });
  console.log('recreate while dead', r.ok, r.code ?? '', r.message ?? r.receipt.summary, 'dead?', pc().name, pc().conditions);
  const g = await host.send('hi', 'new life'); console.log('gen after recreate aborted', g.aborted ?? false);
  host.close();
});
