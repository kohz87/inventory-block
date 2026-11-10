import { started, seeded, offerAndStart } from './helpers.js';
await seeded(21, async () => {
  const host = await started();
  await host.send('search', host.reply('vials', ['+ item Minor Healing Draught | qty: 5 | note: heal 20']));
  await offerAndStart(host, '! encounter 3 Wolf | tier: even');
  await host.cmd('combat.act', { action: { type: 'defend' } });
  const before = host.head().domains.combat.session.actions.length;
  await host.send('I drink', host.reply('You gulp them down one after another.', Array(5).fill('! use Minor Healing Draught')));
  const after = host.head().domains.combat.session;
  console.log('actions', before, '->', after?.actions.length, 'status', after?.status, 'left', host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught')?.qty);
  console.log(host.st.ctx.chat.at(-1).extra.storySuite.receipts.map(r => r.type + ': ' + r.summary.slice(0, 120)).join('\n'));
  host.close();
});
