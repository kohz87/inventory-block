import { started, seeded, replayed, hash } from './helpers.js';
await seeded(401, async () => {
  const host = await started();
  await host.send('vials', host.reply('vials', ['+ item Minor Healing Draught | qty: 2 | note: heal 20', '~ wound Ren — a thorn | harm: wound', '+ coin 10']));
  const before = { hp: host.q('party.pc').hp.cur, qty: host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught').qty, coin: host.q('inventory.wallet', { owner: 'party' }).coin };
  const chat = structuredClone(host.st.ctx.chat);
  chat.push(structuredClone(chat.at(-1)));   // a duplicated reply (SillyTavern "Duplicate"), extra and all
  await host.st.loadChat(chat);
  const after = { hp: host.q('party.pc').hp.cur, qty: host.q('inventory.items', {}).find(i => i.name === 'Minor Healing Draught').qty, coin: host.q('inventory.wallet', { owner: 'party' }).coin };
  console.log('before', JSON.stringify(before), 'after dup', JSON.stringify(after), 'problems', JSON.stringify(host.store.problems?.() ?? null).slice(0, 300));
  await host.send('next', host.reply('another', ['~ wound Ren — again | harm: scratch']));
  console.log('next reply hp', host.q('party.pc').hp.cur);
  host.close();
});
