// Confirm soak: the soak generator (with the kinds merged since the final soak) on Story Block's testkit
// with all four modules and the Ersveil pack. Random sends, swipes, regenerates, Continues, end deletes,
// middle deletes, fights and feature flips; after every step the chat is reloaded into a fresh host (the
// real runtime: validators and replay rules) and compared with the live head (invariant 1).
// usage: STORY_SUITE_ROOT=<repos> node fuzz.mjs <seedFrom> <seedTo> <steps> [--stop]
import { suiteHost } from './helpers/suite-final.js';
import { createGen, rng } from '../../../break-scripts/gen.mjs';

const [from = 1, to = from, steps = 150] = process.argv.slice(2).filter(a => !a.startsWith('--')).map(Number);
const STOP = process.argv.includes('--stop');
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x));
function firstDiff(a, b, path = '') {
    if (canon(a) === canon(b)) return null;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) { const d = firstDiff(a[k], b[k], `${path}/${k}`); if (d) return d; }
    }
    return { path: path || '/', live: JSON.stringify(a)?.slice(0, 300), rebuilt: JSON.stringify(b)?.slice(0, 300) };
}

function hint(host) {
    const st = host.head();
    const d = st?.domains ?? {};
    const inv = d.inventory ?? {};
    const party = d.party ?? {};
    return {
        present: (d.scene?.present ?? []).map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean),
        carried: [...new Set(Object.values(inv.stacks ?? {}).map(s => inv.defs?.[s.def]?.name).filter(Boolean))],
        consumables: [...new Set(Object.values(inv.stacks ?? {}).map(s => inv.defs?.[s.def]).filter(x => x?.kind === 'consumable').map(x => x.name))],
        quests: Object.values(d.director?.threads ?? {}).filter(t => t?.kind === 'quest' && !t.ended).map(t => t.key ?? t.fields?.name).filter(Boolean),
        companions: Object.values(party.actors ?? {}).filter(a => a.id !== party.pc).map(a => a.name),
        party: Object.values(party.actors ?? {}).map(a => a.name).filter(Boolean),
    };
}

async function fight(host) {
    const offers = host.q('combat.offers') ?? [];
    const fair = offers.filter(o => o.stakes !== 'death');
    for (const o of offers.filter(o => o.stakes === 'death')) await host.cmd('combat.dismiss', { offer: o.id });
    if (!fair.length) return;
    const s = await host.cmd('combat.start', { offer: fair[0].id });
    if (!s.ok) return;
    for (let i = 0; i < 60; i += 1) { const c = host.q('combat.session'); if (!c || c.status !== 'active') break; const a = await host.cmd('combat.act', { action: { type: 'auto' } }); if (!a.ok) break; }
    await host.cmd('combat.end', {});
}

const FLIPS = ['story-block.choices', 'story-block.chatter', 'rpg-battle.recovery', 'story-director.digest'];
let bad = 0;
for (let seed = from; seed <= to; seed += 1) {
    const host = await suiteHost({ seed });
    const made = await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
    if (!made.ok) throw new Error(made.message);
    const gen = createGen(seed * 31 + 7);
    const r = rng(seed * 977 + 3);
    const log = [];
    let failed = null;
    for (let step = 1; step <= steps && !failed; step += 1) {
        const roll = r();
        const chat = host.ctx.chat;
        const lastAi = chat.length > 1 && !chat.at(-1).is_user;
        let op = 'send';
        try {
            if (roll < 0.10 && lastAi) { op = 'swipe'; await host.swipe(gen.next(hint(host)).reply); }
            else if (roll < 0.15 && lastAi) { op = 'regenerate'; await host.regenerate(gen.next(hint(host)).reply); }
            else if (roll < 0.18 && lastAi) { op = 'continue'; await host.cont(`\n\nThe rain picks up.\n<Changes>\n! time +${1 + Math.floor(r() * 7)}h\n</Changes>`); }
            else if (roll < 0.23 && chat.length > 4) { op = 'delete-end'; await host.st.deleteMessage(chat.length - 1); }
            else if (roll < 0.29 && chat.length > 10) {
                const ais = chat.map((m, i) => (!m.is_user && i > 0 && i < chat.length - 2 && m.extra?.storySuite ? i : -1)).filter(i => i > 0);
                const at = ais[Math.floor(r() * ais.length)];
                op = `delete-middle ${at}`;
                if (at) await host.st.deleteMessage(at);
            } else if (roll < 0.31) { const id = FLIPS[Math.floor(r() * FLIPS.length)]; const now = host.features.on(id); host.features.set(id, !now); op = `feature ${id} ${!now}`; }
            else {
                const out = gen.next(hint(host));
                await host.send(out.user, out.reply);
                log.push({ step, reply: out.reply });
                if (r() < 0.7) await fight(host);
            }
        } catch (error) { failed = { step, op, throw: String(error?.stack ?? error).slice(0, 600) }; break; }
        // Invariant 1 through the real runtime: the saved chat loaded into a fresh host.
        const live = host.head();
        const chatCopy = structuredClone(host.ctx.chat);
        const fresh = await suiteHost({ seed: 999 });
        await fresh.st.loadChat(chatCopy, 'rebuild');
        const rebuilt = fresh.head();
        const problems = (fresh.store.problems?.() ?? []).map(p => `${p.index}: ${String(p.why).slice(0, 160)}`);
        fresh.close();
        const diff = firstDiff(live, rebuilt);
        if (diff) failed = { step, op, diff, problems: problems.slice(0, 5) };
    }
    if (failed) { bad += 1; console.log(JSON.stringify({ seed, ...failed })); if (STOP) process.exit(1); }
    else console.log(JSON.stringify({ seed, ok: true, steps, chat: host.ctx.chat.length }));
    host.close();
}
console.log(`done: ${bad} of ${to - from + 1} seeds broke invariant 1`);
