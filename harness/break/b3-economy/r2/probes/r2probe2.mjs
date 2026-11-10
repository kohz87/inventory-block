import { started } from './helpers/suite.js';
const show = (label, r) => console.log(label, r.ok, r.code ?? '', (r.message ?? r.receipt?.summary ?? '').slice(0, 220));
const h = await started({ seed: 3 });
const rs = () => h.sdk.receipts().filter(r => r.index === h.ctx.chat.length - 1).map(r => r.receipt.summary.slice(0, 160));
for (const [n, extra] of [[1, '| rank: E | reward: 1 mark'], [2, '| reward: 1 mark'], [3, '| rank: S | reward: 99999999 marks'], [4, '| difficulty: nightmare | reward: 99999999 marks']]) {
  const name = `Letter Run ${n}`;
  const w0 = h.wallet();
  await h.send(`I take the ${name} job.`, h.reply('Fenna hands over a sealed letter.', [`+ quest ${name} — carry a letter to the quay | giver: Fenna | goal: deliver the letter to the quay inspector ${extra}`]));
  const t = h.q('director.thread', { key: name });
  console.log(name, 'taken', !!t?.taken, 'offer', t?.offer);
  await h.send('I deliver it.', h.reply('The inspector takes the letter.', [`~ quest ${name} | met: yes`, `- quest ${name} — done, delivered`]));
  console.log(' paid', h.wallet() - w0, rs());
}
h.close();
