const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const COINS = [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }];
for (const set of [{ coins: COINS, storyCoinPerReply: 60 }, { storyCoinPerReply: 60 }]) {
  const h = await createHost({ settings: { modules: { 'story-block': set } } });
  const coin = () => h.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
  await h.send('Hi.', 'Road.');
  await h.send('Look.', `A chest.\n\n<Changes>\n? loot ${set.coins ? '90 gold' : '9000 gold'}, Rope — in the chest\n+ coin ${set.coins ? '5 silver' : '50'}\n</Changes>`);
  const loot = h.sdk.query('inventory.loot');
  console.log(set.coins ? 'coins' : 'plain', 'wallet', coin(), 'loot', JSON.stringify(loot?.at(-1)?.items));
  const r = await h.cmd?.('inventory.lootTake', { index: 0 }) ?? await h.sdk.command('inventory.lootTake', { index: 0 });
  console.log(' take ->', r?.ok, r?.message, 'wallet', coin());
  const r2 = await h.sdk.command('inventory.lootTake', { index: 0, item: 0 });
  console.log(' take2 ->', r2?.ok, r2?.message, 'wallet', coin());
  h.close();
}
