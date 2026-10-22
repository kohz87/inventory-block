import { rpgHost, seeded, playOut, replayed, hash, storyDirector } from './helpers.js';
await seeded(61, async () => {
  const sd = await storyDirector();
  const host = await rpgHost({ modules: [sd] });
  await host.cmd('party.create', { name: 'Ren', preset: 'fighter' });
  await host.send('work?', host.reply('Fenna: rats.', ['~ place Bluewatch | kind: settlement', '+ present Fenna', '+ quest Granary Rats — clear the cellar | giver: Fenna | goal: Kill 4 cellar rats | reward: 2 silver each']));
  const take = await host.cmd('quest.take', { key: 'Granary Rats' }); console.log('take', take.ok, take.message ?? take.receipt.summary);
  const fight = async (line) => {
    await host.send('go', host.reply('Foes!', [line]));
    const offer = host.q('combat.offers').at(-1);
    const s = await host.cmd('combat.start', { offer: offer.id });
    if (!s.ok) return console.log('start', s.message);
    const st = await playOut(host); const e = await host.cmd('combat.end');
    console.log(line, '->', st, JSON.stringify(e.receipt.data.foes), 'progress', JSON.stringify(host.q('quest.progress', { key: 'Granary Rats' })));
  };
  await fight('! encounter 2 Cellar Rat | tier: trivial');
  await fight('! encounter a swarm of cellar rats | tier: trivial');
  await fight('! encounter 9 Rat | tier: trivial');
  await fight('! encounter 3 Cellar Rat Swarm | tier: trivial');
  const fin = await host.cmd('quest.finish', { key: 'Granary Rats' }); console.log('finish', fin.ok, fin.code ?? '', fin.message ?? fin.receipt.summary);
  const rp = await replayed(host, { modules: [await storyDirector()] }); console.log(hash(rp) === hash(host.head()) ? 'replay ok' : 'REPLAY MISMATCH');
  host.close();
});
