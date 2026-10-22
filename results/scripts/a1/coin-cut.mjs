const { createHost } = await import('/home/user/cell/a1/Story_block/testkit/index.js');
console.warn = () => {};
const h = await createHost({ settings: { modules: { 'story-block': { storyCoinPerReply: 5000 } } } });
await h.send('Hi.', 'Road.');
await h.send('Pay.', 'The merchant counts.\n\n<Changes>\n+ coin 5');
await h.cont('00\n</Changes>');
console.log('wallet', h.sdk.query('inventory.wallet', { owner: 'party' }).coin, h.turn.problems().map(p => p.code).join(','));
