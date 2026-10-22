import { suiteHost } from './helpers/suite.js';
const show = (label, r) => console.log(label, r.ok, r.code ?? '', (r.message ?? r.receipt?.summary ?? '').slice(0, 220));
for (const variant of ['gear']) {
const h = await suiteHost({ seed: 5 });
const def = variant === 'gear' ? { name: 'Epic Sword', kind: 'equipment', rarity: 'epic', slot: 'weapon', stats: { ATK: 999 } } : variant === 'id' ? { id: 'pack.ersveil-bluewatch/mana-draught', name: 'Mana Draught', kind: 'consumable' } : { name: 'Minor Healing Draught', kind: 'consumable', effect: { heal: 20 } };
const file = { rpgBattleCharacter: 1, name: 'Trader', role: '', level: 1, xp: 0, points: 0, stats: { STR: 5, VIT: 5, AGI: 5, DEX: 5, INT: 5, LUK: 5, CHA: 5 }, skills: [], custom: [], items: Array.from({ length: 200 }, () => ({ def, qty: 1 })), purse: 250 };
show('import ' + variant, await h.cmd('creation.import', { character: file }));
await h.send('look', h.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
const w0 = h.wallet();
for (const it of h.items().filter(i => i.name === def.name)) {
  console.log(' got', it.qty, it.def, 'value', it.value);
  let best = null; for (const k of ['general','smith','guild']) { const q = h.q('trade.quote', { type: 'sell', stack: it.stack, qty: it.qty, kind: k }); if (q.ok && (!best || q.total > best.total)) best = { ...q, k }; }
  show(' sell', await h.cmd('trade.sell', { stack: it.stack, qty: it.qty, kind: best?.k }));
}
console.log(' wallet', w0, '->', h.wallet());
h.close();
}
