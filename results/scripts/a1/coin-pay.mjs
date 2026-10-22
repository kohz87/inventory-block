const { createHost } = await import('/home/user/cell/a1/Story_block/testkit/index.js');
console.warn = () => {};
const COINS = [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }];
const h = await createHost({ settings: { modules: { 'story-block': { coins: COINS, storyCoinPerReply: 1000 } } } });
const coin = () => h.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
await h.send('Hi.', 'Road.\n\n<Changes>\n+ coin 3 silver\n</Changes>');
for (const l of ['- coin 5 gold', '- coin 2 silver', '- coin 2 silver 5 copper', '+ coin 0 silver', '+ coin 99999999999999 gold', '+ coin 1,000 copper']) {
  const b = coin();
  await h.send('Go.', `Hm.\n\n<Changes>\n${l}\n</Changes>`);
  console.log(l.padEnd(30), b, '->', coin(), h.turn.problems().filter(p => p.index === h.ctx.chat.length - 1).map(p => p.code + ' ' + p.message.slice(0, 80)).join(' | '));
}
