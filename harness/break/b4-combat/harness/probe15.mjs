import { rpgHost, seeded } from './helpers.js';
await seeded(5, async () => {
  for (const name of ['(Ren)', '[Ren]', '<b>Ren</b>', 'Ren | Bold', '{{char}}', '—', 'A'.repeat(40), 'Ren\nTwo', '   ']) {
    const host = await rpgHost();
    const c = host.q('creation.content', {});
    const race = c.races?.[0]?.id; const r = await host.cmd('creation.finish', { name, race, points: { STR: 4, VIT: 3, AGI: 1, DEX: 2 } }); if (name==='(Ren)') console.log('race', race, Object.keys(c));
    console.log(JSON.stringify(name), r.ok, r.code ?? '', r.message ?? r.receipt.summary, '| pc name', JSON.stringify(host.q('party.pc')?.name));
    host.close();
  }
});
