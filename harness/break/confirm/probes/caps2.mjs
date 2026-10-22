import { suiteHost } from '../fuzz/helpers/suite-final.js';
const h = await suiteHost({ seed: 5 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await h.send('hi', h.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
const pc = () => Object.values(h.head().domains.party.actors)[0];
const warns = []; console.warn = (...a) => warns.push(a.join(' ').slice(0, 220));
const last = () => { const m = h.ctx.chat.at(-1); return (m.extra?.storySuite?.receipts ?? []).map(r => `${r.type}:${r.summary ?? ''}`.slice(0, 140)); };
async function step(tag, fn) { warns.length = 0; const w0 = h.wallet(); const x0 = pc().xp, l0 = pc().level; await fn(); console.log(`${tag}: coin +${h.wallet() - w0} | xp ${x0}→${pc().xp} lvl ${l0}→${pc().level}\n   receipts: ${last().join(' || ')}\n   warns: ${warns.join(' || ').slice(0, 600)}`); }
await step('30 copper', () => h.send('x', h.reply('Coins.', ['+ coin 30 | from: Fenna'])));
await step('9 gold', () => h.send('x', h.reply('Coins.', ['+ coin 9 gold | from: Fenna'])));
await step('3 silver', () => h.send('x', h.reply('Coins.', ['+ coin 3 silver | from: Fenna'])));
await step('30 copper again', () => h.send('x', h.reply('Coins.', ['+ coin 30 | from: Fenna'])));
await step('time +1d then 30', () => h.send('x', h.reply('A day.', ['! time +1d', '+ coin 30 | from: Fenna'])));
await step('milestone', () => h.send('x', h.reply('Big.', ['+ xp milestone — held the gate'])));
await step('milestone 2', () => h.send('x', h.reply('Big.', ['+ xp milestone — held the gate again'])));
await step('minor', () => h.send('x', h.reply('Small.', ['+ xp minor — a thing'])));
console.log(JSON.stringify(h.head().domains.inventory.wallets), JSON.stringify(h.head().meta.budget ?? h.head().domains.money ?? null)?.slice(0, 300));
h.close();
