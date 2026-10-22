import { started, seeded, offerAndStart } from './helpers.js';
await seeded(201, async () => {
  const host = await started();
  const hp = () => host.q('party.pc').hp.cur;
  const types = () => host.st.ctx.chat.at(-1).extra?.storySuite?.receipts?.map(r => r.type).join(',');
  await host.send('ow', host.reply('A thorn.', ['~ wound Ren — a thorn | harm: wound', '? check stealth — x | dc: 10 | roll: 1 | result: success']));
  const h1 = hp(); const log1 = JSON.stringify(host.head().domains.checks.log.map(e => [e.roll, e.die, e.carrier]));
  console.log('after reply hp', h1, types(), log1);
  await host.st.editMessage(host.st.ctx.chat.length - 1, host.st.ctx.chat.at(-1).mes.replace('A thorn.', 'A sharp thorn.'));
  console.log('after edit hp', hp(), types(), JSON.stringify(host.head().domains.checks.log.map(e => [e.roll, e.die, e.carrier])), 'problems', JSON.stringify(host.st.ctx.chat.at(-1).extra?.storySuite?.problems ?? []).slice(0,200));
  if (host.sdk.reread) { const r = await host.sdk.reread(host.st.ctx.chat.length - 1); console.log('reread', JSON.stringify(r).slice(0,150), 'hp', hp(), types(), JSON.stringify(host.head().domains.checks.log.map(e => [e.roll, e.die]))); }
  // edit adding a second wound line and a third check
  await host.st.editMessage(host.st.ctx.chat.length - 1, host.st.ctx.chat.at(-1).mes.replace('</Changes>', '~ wound Ren — another | harm: grievous\n? check climb — y | dc: 10 | roll: 2\n? check perception — z | dc: 10 | roll: 1\n</Changes>'));
  console.log('after edit2 hp', hp(), types(), JSON.stringify(host.head().domains.checks.log.map(e => [e.skill, e.roll, e.die])));
  const rr = await host.sdk.reread(host.st.ctx.chat.length - 1); console.log('reread2', rr.ok, 'hp', hp(), types(), JSON.stringify(host.head().domains.checks.log.map(e => [e.skill, e.roll, e.die, e.note])), JSON.stringify(rr.problems ?? []).slice(0, 400));
  host.close();
});
