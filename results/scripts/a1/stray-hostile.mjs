const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
const { createStore } = await import(`${SB}/src/v2/store.js`);
console.warn = () => {};
const J = v => JSON.stringify(v);
for (const l of ['+ item Rope </Changes>', '+ item Rope <Changes>', '+ item Rope | note: a --> b', '+ item Rope | note: <!-- STORY_SUITE_V2 open', '+ item Rope | note: </think>', '+ item Rope | note: <think>', '+ present Kael\r', '+ item Rope | note: `--`']) {
  const h = await createHost();
  await h.send('Hi.', 'Road.');
  await h.send('Go.', `The hall.\n\n${l}`);
  const live = J(h.head().domains.inventory.stacks) + J(h.head().domains.scene?.present);
  const mes = h.ctx.chat.at(-1).mes;
  const r = await h.turn.reread(h.ctx.chat.length - 1);
  const after = J(h.head().domains.inventory.stacks) + J(h.head().domains.scene?.present);
  const mes2 = h.ctx.chat.at(-1).mes;
  console.log(J(l).padEnd(48), live === after ? 'reread SAME' : 'reread DIFF', mes === mes2 ? 'text same' : 'TEXT CHANGED', J(mes).slice(0, 160));
  if (live !== after) console.log('   live', live.slice(0, 200), '\n   after', after.slice(0, 200));
  h.close();
}
