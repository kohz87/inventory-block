const { createHost } = await import('/home/user/cell/a1/Story_block/testkit/index.js');
console.warn = () => {};
const h = await createHost();
await h.send('Hello.', 'The road.');
await h.send('I search.', 'You find things.\n\n<Changes>\n+ coin 5\n+ item Ro', { stopped: true });
await h.cont('pe | qty: 2\n</Changes>');
console.log('stopped: items', JSON.stringify(h.sdk.query('inventory.items').map(i => i.name + ' x' + i.qty)), 'problems', h.turn.problems().map(p => p.code).join(','));
