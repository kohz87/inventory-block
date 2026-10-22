const { createHost } = await import('/home/user/cell/a1/Story_block/testkit/index.js');
console.warn = () => {};
const h = await createHost();
await h.send('Hi.', 'Road.');
await h.send('Look.', 'The hall.\n\n+ item Rope </Changes>');
console.log(JSON.stringify(h.sdk.query('inventory.items').map(i => i.name)));
