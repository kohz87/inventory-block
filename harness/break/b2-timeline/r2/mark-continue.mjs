const { createHost } = await import('/home/user/_break/b2-timeline-r2/Story_block/testkit/index.js');
const { readRecord } = await import('/home/user/_break/b2-timeline-r2/Story_block/src/v2/persist.js');
console.warn = () => {};
const items = h => { const inv = h.head()?.domains?.inventory; return inv ? Object.values(inv.stacks).map(s => inv.defs[s.def].name).sort() : []; };
for (const variant of ['plain', 'leading-space', 'macro-name']) {
  const h = await createHost();
  // SillyTavern stamps send_date on a reply; the fake leaves '' — give each reply a date like SillyTavern.
  h.st.eventSource.makeFirst('message_received', id => { const m = h.ctx.chat[id]; m.send_date = `d${Date.now()}-${Math.random()}`; });
  const open = variant === 'leading-space' ? '  ' : variant === 'macro-name' ? 'Narrator: ' : '';
  await h.send('a', `${open}A rope on the floor.\n<Changes>\n+ item Rope\n</Changes>`);
  console.log(variant, 'after reply', items(h), 'mark', JSON.stringify(readRecord(h.ctx.chat[2])?.mark));
  // SillyTavern's Continue: the old text written back cleaned up (trimmed / name prefix removed), more text, a new date
  const st = h.st;
  const realGenerate = st.generate.bind(st);
  const m = h.ctx.chat[2];
  const cleaned = m.mes.replace(/^\s+/, '').replace(/^Narrator: /, '');
  st.eventSource.makeFirst('chat_completion_prompt_ready', () => { m.mes = cleaned; m.swipes[0] = cleaned; });
  await h.cont(' And a lamp.');
  console.log(variant, 'after continue', items(h), 'record kept', !!readRecord(h.ctx.chat[2]));
  h.close();
}
