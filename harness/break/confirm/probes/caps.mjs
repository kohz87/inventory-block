// Per-reply caps with the new kinds: coins in silver/gold, story XP, stray lines and Continue.
import { suiteHost } from '../fuzz/helpers/suite-final.js';
const show = (h, tag) => {
    const d = h.head().domains; const pc = Object.values(d.party.actors)[0];
    const recs = h.receipts().slice(-12).map(x => `${x.type}${x.data?.refused ? ' REFUSED' : ''}`).join(', ');
    console.log(tag, 'wallet', JSON.stringify(d.inventory.wallets?.party), 'xp', pc?.xp ?? pc?.growth ?? JSON.stringify(Object.keys(pc)).slice(0, 80));
};
async function fresh() { const h = await suiteHost({ seed: 5 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' }); await h.send('hi', h.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement'])); return h; }
const probs = h => h.sdk.problems?.().slice(-6).map(p => `${p.module ?? 'host'}:${p.code} ${String(p.message).slice(0, 110)}`) ?? [];
let h = await fresh(); show(h, 'start');
const pc = () => Object.values(h.head().domains.party.actors)[0];
console.log('pc keys', Object.keys(pc()).join(','));
// coins
for (const lines of [['+ coin 30 | from: Fenna'], ['+ coin 3 silver | from: Fenna'], ['+ coin 1 gold | from: Fenna'], ['+ coin 9 gold | from: Fenna'], ['+ coin 2 gold | from: Fenna', '+ coin 2 gold | from: Marrit', '+ coin 9 silver | from: Hollis', '+ coin 90 | from: Dov']]) {
    const before = h.wallet(); await h.send('x', h.reply('Coins.', lines)); console.log(lines.join(' ; '), '→ +', h.wallet() - before, probs(h).slice(-2));
}
// stray coin + block coin
{ const before = h.wallet(); await h.send('x', 'Fenna pays.\n+ coin 9 gold | from: Fenna\n\n<Changes>\n+ coin 9 gold | from: Marrit\n</Changes>'); console.log('stray+block 9 gold x2 → +', h.wallet() - before); }
{ const before = h.wallet(); await h.send('x', 'Fenna pays.\n\n<Changes>\n+ coin 9 gold | from: Marrit\n</Changes>'); const mid = h.wallet(); await h.cont('\n\nAnd more.\n<Changes>\n+ coin 9 gold | from: Hollis\n</Changes>'); console.log('block then Continue 9 gold each → +', mid - before, '+', h.wallet() - mid); await h.cont('\n\nAnd more.\n+ coin 9 gold | from: Dov'); console.log('  then a stray in a second Continue → +', h.wallet() - mid); }
// xp
const xpOf = () => JSON.stringify(pc().xp ?? pc().growth ?? pc().soul ?? null);
console.log('xp before', xpOf());
await h.send('x', h.reply('Big day.', ['+ xp milestone — held the gate', '+ xp milestone — again', '+ xp major — more', '+ xp minor — a', '+ xp minor — b', '+ xp minor — c'])); console.log('xp after 2 milestone+major+3 minor', xpOf(), probs(h).slice(-4));
await h.send('x', h.reply('Another.', ['+ xp milestone — held the gate'])); const a = xpOf(); await h.cont('\n\nAnd then.\n<Changes>\n+ xp milestone — again in a Continue\n</Changes>'); console.log('milestone then Continue milestone', a, '→', xpOf(), probs(h).slice(-2));
await h.send('x', 'They won.\n+ xp milestone — stray one\n\n<Changes>\n+ xp milestone — block one\n</Changes>'); console.log('stray milestone + block milestone →', xpOf(), probs(h).slice(-2));
await h.swipe(h.reply('Swiped.', ['+ xp milestone — on a swipe'])); console.log('swipe →', xpOf());
h.close();
