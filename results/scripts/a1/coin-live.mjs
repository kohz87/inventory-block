const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const COINS = [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }];
const h = await createHost({ settings: { modules: { 'story-block': { coins: COINS, storyCoinPerReply: 500 } } } });
const coin = () => h.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
const items = () => h.sdk.query('inventory.items').map(i => `${i.name}x${i.qty}`).join(',');
await h.send('Hi.', 'Road.');
for (const l of ['+ item Silver Coins | qty: 3', '+ item 3 silver coins', '+ item Golds | qty: 2', '+ item Silver | qty: 3', '+ coin 3 silver coins', '? loot 3 silver coins, 2 gold pieces — on the floor']) {
  const b = coin();
  await h.send('Go.', `Hm.\n\n<Changes>\n${l}\n</Changes>`);
  console.log(l.padEnd(45), 'coin +', coin() - b, '| items', items(), '| loot', JSON.stringify(h.sdk.query('inventory.loot')?.at(-1)?.items ?? null), '|', h.turn.problems().slice(-1).map(p=>p.code+':'+p.message.slice(0,80)).join(''));
}
h.close();
