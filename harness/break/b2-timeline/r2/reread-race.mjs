const { createHost } = await import('/home/user/_break/b2-timeline-r2/Story_block/testkit/index.js');
const { readRecord } = await import('/home/user/_break/b2-timeline-r2/Story_block/src/v2/persist.js');
console.warn = () => {};
const R = (t, l) => `${t}\n<Changes>\n${l.join('\n')}\n</Changes>`;
for (const race of ['delete', 'delete2', 'send', 'swipe']) {
  const h = await createHost();
  await h.send('a', R('A rope.', ['+ item Rope']));
  await h.send('b', R('A lamp.', ['+ item Lamp']));
  await h.send('c', R('A key.', ['+ item Iron Key']));
  // the reader edits reply 4 (lamp) to say torch, then Re-reads it, and at once does something else
  h.ctx.chat[4].mes = R('A torch.', ['+ item Torch']);
  const p = h.sdk.reread(4);
  if (race === 'delete') await h.st.deleteMessage(1);
  if (race === 'delete2') { h.ctx.chat.splice(1, 2); await h.st.eventSource.emit('message_deleted', h.ctx.chat.length); }
  if (race === 'send') await h.send('d', R('An apple.', ['+ item Apple']));
  if (race === 'swipe') await h.swipe(R('Another key.', ['+ item Iron Key']));
  const r = await p;
  const inv = h.head().domains.inventory;
  const names = Object.values(inv.stacks).map(s => inv.defs[s.def].name).sort();
  const where = h.ctx.chat.map((m, i) => (readRecord(m)?.receipts ?? []).filter(x => x.type === 'capture.item').map(x => `${i}:${x.summary?.slice(0, 20)}`)).flat();
  console.log(race, J(r?.ok), r?.code ?? '', r?.message?.slice(0, 80) ?? '', '| items', names.join(','), '| receipts', where.join(' ; '));
  h.close();
}
function J(x) { return JSON.stringify(x); }
