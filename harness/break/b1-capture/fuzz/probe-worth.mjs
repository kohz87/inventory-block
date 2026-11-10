import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(4);
const items = ['Healing Draught', 'Greater Healing Draught', 'Superior Healing Potion', 'Iron Sword', 'Steel Sword', 'Longsword', 'Leather Armour', 'Chainmail', 'Wooden Shield', 'Silver Ring', 'Lockpicks', 'Rope', 'Torch', 'Lantern', 'Bedroll', 'Map of the Vale', 'Horse', 'Spellbook', 'Mithril Dagger | note: rare weapon'];
for (const lvl of [1]) {
  const host = await suiteHost();
  await withParty(host);
  await host.send('hi', host.reply('Hello.', ['~ place Bluewatch | kind: settlement']));
  for (const it of items) {
    await host.send('loot', host.reply('You find it.', [`+ item ${it}`]));
    const p = host.turn.problems().at(-1);
    const got = host.q('inventory.items').some(i => i.name === it.split(' |')[0]);
    console.log(it.padEnd(36), got ? 'given' : 'REFUSED', got ? '' : p?.message.slice(-160));
  }
  console.log('budget hints', host.q('inventory.wallet', { owner: 'party' }));
}
