import { suiteHost } from '../fuzz/helpers/suite-final.js';
async function run(deleteB) {
    const h = await suiteHost({ seed: 9 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
    await h.send('hi', h.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
    const hp = () => { const p = Object.values(h.head().domains.party.actors)[0]; return `${p.hp.max - (p.hp.lost ?? 0)}/${p.hp.max} rested=${h.head().domains.party.rested} clock=${h.q('time.now')?.text}`; };
    await h.send('a', h.reply('A.', ['~ wound Wessel — a deep cut | harm: severe'])); const s1 = hp();
    await h.send('b', h.reply('B.', ['! time +6h'])); const b = h.ctx.chat.length - 1; const s2 = hp();
    await h.send('c', h.reply('C.', ['+ present Fenna'])); const s3 = hp();
    await h.send('d', h.reply('D.', ['+ present Marrit'])); const s4 = hp();
    if (deleteB) await h.st.deleteMessage(b);
    console.log(deleteB ? 'B deleted:' : 'kept:     ', 'after A', s1, '| after B', s2, '| after C', s3, '| after D', s4, '| now', hp());
    h.close();
}
await run(false); await run(true);
// Reference: A, C, D with no B at all.
const g = await suiteHost({ seed: 9 }); await g.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
await g.send('hi', g.reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
await g.send('a', g.reply('A.', ['~ wound Wessel — a deep cut | harm: severe'])); await g.send('c', g.reply('C.', ['+ present Fenna'])); await g.send('d', g.reply('D.', ['+ present Marrit']));
const p = Object.values(g.head().domains.party.actors)[0]; console.log('never B:   ', `${p.hp.max - (p.hp.lost ?? 0)}/${p.hp.max}`, g.q('time.now')?.text); g.close();
