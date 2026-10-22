import { started } from './helpers/suite.js';
const show = (label, r) => console.log(label, r.ok, r.code ?? '', (r.message ?? r.receipt?.summary ?? '').slice(0, 200));
async function fight(h) {
  await h.send('fight', h.reply('They come.', ['! encounter 2 Cellar Rat — in the cellar | tier: trivial']));
  const offer = h.q('combat.offers').at(-1);
  await h.cmd('combat.start', { offer: offer.id });
  for (let n = 0; n < 200 && h.q('combat.session')?.status === 'active'; n++) await h.cmd('combat.act', { action: { type: 'auto' } });
  return h.cmd('combat.end');
}
const h = await started({ seed: 3 });
await h.send('I take the rat job.', h.reply('Notice.', ['+ quest Granary Rats — cellar | giver: Fenna | goal: Kill 2 cellar rats | reward: 50 marks']));
await fight(h);
console.log('progress', h.q('quest.progress', { key: 'Granary Rats' }).label);
for (const line of ['- quest Granary Rats — done, Fenna is pleased', '~ quest Granary Rats | step: done']) {
  // try on a swipe so we can compare
}
await h.send('We report.', h.reply('Fenna nods.', ['- quest Granary Rats — done, Fenna is pleased']));
const t = h.q('director.thread', { key: 'Granary Rats' });
console.log('status', t.status, t.ended);
show('finish', await h.cmd('quest.finish', { key: 'Granary Rats' }));
console.log('wallet', h.wallet());
await h.send('More?', h.reply('Paid.', ['- coin 99999 | to: nobody']));
console.log('wallet after over-pay', h.wallet());
h.close();
