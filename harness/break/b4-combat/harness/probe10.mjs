import { started, seeded } from './helpers.js';
await seeded(71, async () => {
  const host = await started();
  const tailBefore = host.tails().at(-1) ?? '';
  console.log('tail has rolls?', /Roll 1/i.test(tailBefore), tailBefore.slice(0, 300));
  const r = await host.send('sneak', host.reply('You slip past.', [
    '? check stealth — slipping past | dc: hard | roll: 1 | result: success | mod: +15',
    '? check athletics — climbing | dc: easy | roll: 2 | result: success',
    '? check lockpicking — the door | dc: normal | roll: 3 | result: critical success',
    '? check persuasion — the guard | dc: 5 | who: Nobody',
  ]));
  const checks = host.head().domains.checks;
  console.log('pending', checks.pending.length, 'log', checks.log.length, JSON.stringify(checks.pending.map(c => ({ skill: c.skill, mods: c.modifiers }))));
  const id = checks.pending[0]?.id;
  if (id) {
    const m = await host.cmd('check.addModifier', { id, source: 'custom', amount: 10, reason: 'because I say so' });
    console.log('reader custom +10', m.ok, m.code ?? '', m.message ?? m.receipt.summary);
    const ro = await host.cmd('check.roll', { id }); console.log('roll', ro.ok, ro.receipt?.summary);
  }
  host.close();
});
