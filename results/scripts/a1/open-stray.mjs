const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const J = v => JSON.stringify(v).replace(/"rc_[0-9a-z]+"/g, '"rc"');
for (const stopped of [false, true]) {
  const h = await createHost();
  await h.send('Hi.', 'Road.');
  await h.send('Go.', 'Story.\n\n+ present Kael\n\n<Changes>\n+ coin 3\n+ item Ro', { stopped });
  await h.cont('pe\n</Changes>\n\nAfter.\n\n- present Kael');
  const s = () => J({ inv: h.head().domains.inventory.stacks, w: h.head().domains.inventory.wallets, p: h.head().domains.scene.present });
  const live = s();
  console.log('stopped', stopped, 'live', live.slice(0, 300));
  console.log(JSON.stringify(h.ctx.chat.at(-1).mes));
  await h.turn.reread(h.ctx.chat.length - 1);
  console.log(' reread', s() === live ? 'SAME' : 'DIFF ' + s().slice(0, 300));
  h.close();
}
