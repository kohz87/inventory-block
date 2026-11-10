import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(11);
const show = (host, label) => {
  const d = host.head().domains;
  const quests = Object.values(d.director?.threads ?? {}).map(t => `${t.key}:${t.kind}${t.offer ? ':offer' : ''}${t.taken ? ':taken' : ''}${t.ended ? ':ended=' + t.ended.outcome : ''}`);
  console.log(`--- ${label}: coin=${d.inventory.wallets.party?.coin ?? 0} items=${Object.values(d.inventory.stacks).map(s => d.inventory.defs[s.def].name + 'x' + s.qty + '@' + s.owner).join(',')} offers=${(d.party.offers ?? []).map(o => o.kind + ':' + (o.name ?? o.actor)).join(',')} combat=${JSON.stringify(d.combat).slice(0, 160)} time=${d.director?.time?.minutes} quests=${quests.join(' ')}`);
  for (const p of host.turn.problems().slice(-12)) console.log('   P', p.code, p.message.slice(0, 200));
  host.turn.clearProblems();
};
async function fresh() { const h = await suiteHost(); await withParty(h); await h.send('hi', 'Hello.'); return h; }

// A. quest turn-in in the same reply as the fight that counts toward it
{
  const host = await fresh();
  await host.send('Work?', host.reply('Fenna: rats.', ['~ time June 3, 1200, 08:00 am', '~ place Bluewatch | kind: settlement', '+ quest Granary Rats — cellar | giver: Fenna | goal: Kill 3 cellar rats | reward: 30 gold']));
  show(host, 'A offer');
  await host.send('I accept the job, I will clear the cellar.', host.reply('You go down.', []));
  show(host, 'A after accept words');
  const q = host.q('director.thread', { key: 'Granary Rats' });
  if (!q?.taken) { const t = await host.cmd('quest.take', { key: 'Granary Rats' }); console.log('take', t.ok, t.message); }
  await host.send('I fight.', host.reply('Three rats die. Fenna pays.', ['! encounter 3 Cellar Rat — in the cellar | tier: weak', '- quest Granary Rats — done', '~ quest Granary Rats | met: yes', '+ coin 30 | from: Fenna']));
  show(host, 'A same-reply turn-in');
  host.close();
}
// B. item used and sold together, contradictory lines
{
  const host = await fresh();
  await host.send('x', host.reply('Loot.', ['+ item Healing Draught | qty: 1']));
  await host.send('I drink it and sell it.', host.reply('Glug. Sold.', ['- item Healing Draught | note: used', '- item Healing Draught | to: merchant', '+ coin 25 | from: merchant']));
  show(host, 'B use+sell (1 held)');
  await host.send('x', host.reply('Rope.', ['+ item Rope', '- item Rope', '+ item Rope', '- item Rope', '- item Rope']));
  show(host, 'B +/- rope');
  host.close();
}
// C. place move + travel + deadline
{
  const host = await fresh();
  await host.send('x', host.reply('Start.', ['~ time June 3, 1200, 08:00 am', '~ place Alton | kind: settlement', '+ route Alton — Brigg | hours: 5 | kind: road', '+ quest Letter — deliver | giver: Fenna | goal: Bring the letter to Brigg | reward: 10 gold | due: June 3, 1200, 12:00 pm']));
  await host.send('I take the letter job.', host.reply('ok', []));
  const t0 = host.head().domains.director.time.minutes;
  await host.send('We go to Brigg.', host.reply('Five hours later.', ['~ place Brigg | kind: settlement', '! time +5h', '~ quest Letter | met: yes']));
  console.log('C time delta (min):', host.head().domains.director.time.minutes - t0);
  show(host, 'C travel+deadline');
  host.close();
}
// D. companion death + their item use
{
  const host = await fresh();
  await host.send('x', host.reply('Lyra.', ['+ join Lyra — archer | level: 2 | role: ranger']));
  const offer = host.head().domains.party.offers[0];
  console.log('accept', (await host.cmd('party.acceptOffer', { offer: offer.id })).ok);
  const lyra = Object.values(host.head().domains.party.actors).find(a => a.name === 'Lyra');
  await host.send('x', host.reply('Gift.', ['+ item Healing Draught | qty: 2']));
  const stack = Object.values(host.head().domains.inventory.stacks)[0];
  console.log('give', JSON.stringify((await host.cmd('item.give', { stack: stack.id, to: lyra.id, qty: 1 })).message ?? 'ok'));
  await host.send('x', host.reply('Lyra falls and drinks.', ['~ wound Lyra — run through | harm: grievous', '~ wound Lyra — again | harm: grievous', '- item Healing Draught', '- leave Lyra — dies', '~ wound Lyra | heal: grievous']));
  show(host, 'D death+use');
  console.log('lyra hp', JSON.stringify(host.head().domains.party.actors[lyra.id]?.hp));
  host.close();
}
// E. checks: wrong roll/result, >2 checks
{
  const host = await fresh();
  await host.send('x', host.reply('Try.', ['? check stealth — sneak | dc: hard | roll: 20 | result: critical success', '? check athletics — climb | dc: 1e309', '? check luk — luck | dc: 5 | roll: 99', '? check STR — lift | dc: normal', '? check persuasion — talk | dc: easy | who: Lyra']));
  show(host, 'E checks');
  await host.send('then', 'ok');
  const tail = host.tails().at(-1);
  console.log('tail:\n' + tail);
  host.close();
}
