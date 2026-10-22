const { createHost } = await import('/home/user/cell/a1/Story_block/testkit/index.js');
console.warn = () => {};
const COINS = [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }];
for (const l of ['? loot 1 gold 5 silver, Rope — in the chest', '? loot 3 gp, Rope — x', '? loot 5 crowns — x', '? loot Silver x3 — x']) {
  const h = await createHost({ settings: { modules: { 'story-block': { coins: COINS, storyCoinPerReply: 5000 } } } });
  await h.send('Hi.', 'Road.');
  await h.send('Look.', `A chest.\n\n<Changes>\n${l}\n</Changes>`);
  console.log(l.padEnd(44), JSON.stringify(h.sdk.query('inventory.loot')?.at(-1)?.items ?? null), h.turn.problems().slice(-1).map(p => p.code).join(''));
  h.close();
}
