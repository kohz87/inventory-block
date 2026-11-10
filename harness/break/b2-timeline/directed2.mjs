import { allHost, persist } from './lib/host.mjs';
const { readRecord } = persist;
const J = v => JSON.stringify(v);
const q = (h) => { const inv = h.head()?.domains?.inventory; return inv ? Object.values(inv.stacks).map(s => `${inv.defs[s.def]?.name}x${s.qty}`).sort().join(',') : null; };
console.warn = () => {};
const reply = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
async function hero() { const h = await allHost(); await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }); return h; }

// 4. continue after a captured block
{
  const h = await hero();
  await h.send('a', reply('A rope.', ['+ item Rope']));
  await h.cont(reply(' And a lamp.', ['+ item Lamp']));
  console.log('4 continue with a second block:', q(h), '| mes tail:', JSON.stringify(h.ctx.chat.at(-1).mes.slice(-80)));
  h.close();
}
// 5. swipe whose record never got written (interceptor failed), then the original swipe deleted
{
  const h = await hero();
  await h.send('a', reply('A rope.', ['+ item Rope']));
  await h.sdk.command('wallet.receive', { owner: 'party', amount: 3 });   // pending save
  h.st.failSaves = 1;
  await h.swipe(reply('Nothing here.', []));
  console.log('5 swipe 1 head', q(h), 'coin', h.head().domains.inventory.wallets?.party?.coin, 'session-less capture; record swipe', readRecord(h.ctx.chat[2])?.swipe);
  // reader deletes swipe 0 (the rope one); ST: splice and show swipe 0 (the former swipe 1)
  const m = h.ctx.chat[2];
  m.swipes.splice(0, 1); m.swipe_info.splice(0, 1); m.swipe_id = 0; m.mes = m.swipes[0]; m.extra = structuredClone(m.swipe_info[0].extra);
  await h.st.eventSource.emit('message_swipe_deleted', { messageId: 2, swipeId: 0 });
  console.log('5 after deleting swipe 0, shown text:', JSON.stringify(m.mes.slice(0, 20)), 'state:', q(h), 'coin', h.head().domains.inventory.wallets?.party?.coin);
  h.close();
}
// 6. UI command between the interceptor and the reply (during generation)
{
  const h = await hero();
  await h.send('a', reply('A rope.', ['+ item Rope']));
  let did = null;
  h.st.eventSource.on('chat_completion_prompt_ready', async () => { if (!did) did = await h.sdk.command('wallet.receive', { owner: 'party', amount: 7 }); });
  await h.send('b', reply('A lamp.', ['+ item Lamp']));
  const rec2 = readRecord(h.ctx.chat[2]);
  console.log('6 ui during generation ok', did?.ok, 'coin', h.head().domains.inventory.wallets?.party?.coin, 'landed on carrier', h.ctx.chat.findIndex(m => readRecord(m)?.receipts?.some(r => r.id === did?.receipt?.id)));
  await h.regenerate(reply('Other.', []));
  console.log('6 after regenerate coin', h.head().domains.inventory.wallets?.party?.coin);
  h.close();
}
// 7. rewind on a carrier whose ops no longer apply (delete middle) - stray branch
{
  const h = await hero();
  await h.send('a', reply('A rope.', ['+ item Rope']));
  await h.send('b', reply('Rope used, lamp found.', ['- item Rope', '+ item Lamp']));
  await h.st.deleteMessage(2);
  const idx = h.ctx.chat.length - 1;
  const rec = readRecord(h.ctx.chat[idx]);
  const id0 = h.ctx.chatId;
  const res = await h.sdk.rewind({ index: idx, beforeRev: rec.receipts.at(-1).rev });
  console.log('7 rewind', J(res), 'chat now', h.ctx.chatId, '(was', id0 + ')');
  h.close();
}
