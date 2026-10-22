import { allHost, persist, storeMod } from './lib/host.mjs';
const { readRecord } = persist;
const J = v => JSON.stringify(v);
const q = (h) => { const inv = h.head()?.domains?.inventory; return inv ? Object.values(inv.stacks).map(s => `${inv.defs[s.def]?.name}x${s.qty}`).sort().join(',') : null; };
console.warn = () => {};
const reply = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;

// 1. delete the greeting
{
  const h = await allHost();
  await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
  await h.send('a', reply('A rope.', ['+ item Rope']));
  await h.send('b', reply('A lamp.', ['+ item Lamp']));
  console.log('1 before', q(h), 'pc', h.head().domains.party.pc);
  const rec2 = J(readRecord(h.ctx.chat[2]));
  await h.st.deleteMessage(0);
  console.log('1 after delete greeting', q(h), 'pc', h.head()?.domains?.party?.pc, 'problems', h.store.problems().length);
  console.log('   reply-1 record overwritten:', J(readRecord(h.ctx.chat[1])) !== rec2, 'ops now', readRecord(h.ctx.chat[1])?.ops.length, 'receipts', readRecord(h.ctx.chat[1])?.receipts.length);
  h.close();
}
// 2. delete a middle reply before vs after a checkpoint
for (const n of [5, 25]) {
  const h = await allHost();
  await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
  await h.send('a', reply('A rope.', ['+ item Rope']));
  for (let i = 0; i < n; i++) await h.send(`m${i}`, `Nothing ${i}.`);
  const cps = h.ctx.chat.map((m, i) => readRecord(m)?.checkpoint ? i : -1).filter(i => i >= 0);
  console.log(`2 n=${n} before`, q(h), 'checkpoints at', cps);
  await h.st.deleteMessage(2);   // the reply that gave the rope
  console.log(`2 n=${n} after deleting the rope reply`, q(h), 'problems', h.store.problems().length);
  h.close();
}
// 3. garbage checkpoint
{
  const h = await allHost();
  await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
  await h.send('a', reply('A rope.', ['+ item Rope']));
  const chat = structuredClone(h.ctx.chat);
  chat[0].extra.storySuite.checkpoint = {};
  chat[0].swipe_info[0].extra.storySuite.checkpoint = {};
  await h.st.loadChat(chat);
  console.log('3 head', J(h.head())?.slice(0, 100));
  let r;
  try { r = await h.send('b', reply('A lamp.', ['+ item Lamp', '+ coin 5'])); console.log('3 send ok', r.index, h.turn.problems().map(p => p.message).slice(0, 4)); } catch (e) { console.log('3 send threw', e.message); }
  try { const c = await h.sdk.command('wallet.receive', { owner: 'party', amount: 1 }); console.log('3 cmd', c.ok, c.code, c.message); } catch (e) { console.log('3 cmd threw', e.message); }
  for (const qn of ['inventory.items', 'party.roster', 'director.threads', 'combat.session']) { try { h.sdk.query(qn); } catch (e) { console.log('3 query threw', qn, e.message); } }
  try { console.log('3 preview', h.turn.preview()?.length); } catch (e) { console.log('3 preview threw', e.message); }
  h.close();
}
