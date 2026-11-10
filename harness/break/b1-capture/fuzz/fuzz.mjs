// Seeded capture fuzzer. Usage: node fuzz.mjs [firstSeed=1] [seeds=20] [replies=25]
// Every finding is printed with the seed and reply number, so `node fuzz.mjs <seed> 1 <n>` replays it.
import { suiteHost, withParty, seedCrypto, createHost } from './suite-host.mjs';
import { makeGen } from './gen.mjs';
import fs from 'node:fs';

const [first = 1, count = 20, replies = 25] = process.argv.slice(2).map(Number);
const OUT = new URL('./out/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const quiet = process.env.FUZZ_VERBOSE ? null : console.warn;
if (!process.env.FUZZ_VERBOSE) console.warn = () => {};

const findings = new Map();   // signature → { count, first: { seed, n, detail } }
function note(sig, seed, n, detail) {
    const entry = findings.get(sig) ?? { count: 0, first: { seed, n, detail } };
    entry.count += 1;
    findings.set(sig, entry);
}

function walkNumbers(value, path, out) {
    if (typeof value === 'number' && !Number.isFinite(value)) out.push(`${path}=${value}`);
    else if (typeof value === 'function') out.push(`${path} is a function`);
    else if (Array.isArray(value)) value.forEach((v, i) => walkNumbers(v, `${path}/${i}`, out));
    else if (value && typeof value === 'object') for (const k of Object.keys(value)) walkNumbers(value[k], `${path}/${k}`, out);
}

function invariants(host) {
    const out = [];
    const state = host.head();
    if (!state) return ['no head state'];
    walkNumbers(state, '', out);
    for (const domain of Object.keys(state.domains)) {
        const validate = host.registry.validator(domain);
        if (typeof validate !== 'function') continue;
        let errors;
        try { errors = validate(state.domains[domain], state); } catch (e) { errors = [`validator threw ${e.message}`]; }
        if (errors?.length) out.push(`validator ${domain}: ${errors.slice(0, 2).join('; ').slice(0, 200)}`);
    }
    const inv = state.domains.inventory;
    for (const [owner, w] of Object.entries(inv?.wallets ?? {})) {
        if (!Number.isSafeInteger(w.coin ?? 0) || (w.coin ?? 0) < 0) out.push(`wallet ${owner} = ${w.coin}`);
    }
    for (const s of Object.values(inv?.stacks ?? {})) if (!Number.isInteger(s.qty) || s.qty < 1) out.push(`stack qty ${s.qty}`);
    for (const a of Object.values(state.domains.party?.actors ?? {})) {
        for (const pool of ['hp', 'mp', 'sp']) {
            const p = a[pool];
            if (p && (p.cur > p.max || p.cur < 0)) out.push(`${pool} ${p.cur}/${p.max} for ${a.name}`);
        }
    }
    const minutes = state.domains.director?.time?.minutes;
    if (minutes !== undefined && minutes !== null && (!Number.isSafeInteger(minutes) || minutes < 0)) out.push(`director minutes ${minutes}`);
    return out;
}

const big = value => JSON.stringify(value).length;

async function runSeed(seed) {
    const restore = seedCrypto(seed);
    const gen = makeGen(seed);
    let host;
    try {
        host = await suiteHost();
        await withParty(host);
        // A companion so wound/leave/death lines have someone to hit.
        await host.send('Hello', host.reply('Lyra waves.', ['+ join Lyra — an archer | level: 2 | role: ranger', '+ item Healing Draught | qty: 3', '+ coin 50']));
        const offer = host.head().domains.party?.offers?.[0];
        if (offer) await host.cmd('party.acceptOffer', { offer: offer.id });
        const staticText = host.statics().at(-1);
        let coinBefore = host.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
        for (let n = 0; n < replies; n++) {
            const { text, lines, style } = gen.reply();
            const t0 = performance.now();
            const heap0 = process.memoryUsage().heapUsed;
            let turnResult = null;
            const off = host.events.on('turn', t => { turnResult = t; });
            const probBefore = host.turn.problems().length;
            try {
                await host.send(`turn ${n}`, text);
            } catch (e) {
                note(`EXCEPTION ${String(e?.message).slice(0, 120)}`, seed, n, { stack: e?.stack?.split('\n').slice(0, 5).join(' | '), wrap: style.wrap, text: text.slice(0, 2000) });
                off();
                continue;
            }
            off();
            const ms = performance.now() - t0;
            if (ms > 3000) note(`SLOW reply > 3s`, seed, n, { ms: Math.round(ms), lines: lines.length });
            if (!turnResult) {
                const last = host.turn.problems().at(-1);
                note(`NO TURN (capture returned nothing): ${String(last?.message).slice(0, 100)}`, seed, n, { wrap: style.wrap, last });
            }
            for (const p of turnResult?.problems ?? []) {
                if (p.code === 'UNREADABLE' || p.code === 'UNKNOWN_KIND') continue;
                const reason = String(p.message).split(' was not used: ').slice(1).join(' was not used: ') || String(p.message);
                if (p.code === 'FAILED' || /Something went wrong|is not a function|Cannot read prop|is not defined|Maximum call stack|of undefined|of null|not iterable|Invalid time|RangeError|TypeError/.test(reason)) {
                    const sig = reason.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, 'N').slice(0, 160);
                    note(`HANDLER CRASH [${p.module}] ${p.code} ${sig}`, seed, n, { line: String(p.line).slice(0, 300), message: reason.slice(0, 400) });
                }
                if (p.code === 'INVALID' && /breaks the state's rules|would not be valid/.test(reason)) {
                    note(`STATE RULE [${p.module}] ${reason.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, 'N').slice(0, 160)}`, seed, n, { line: String(p.line).slice(0, 300), message: reason.slice(0, 400) });
                }
            }
            const probs = host.turn.problems().length;
            if (probs > 200) note('PROBLEM LOG > 200', seed, n, { probs });
            const inv = invariants(host);
            for (const i of inv) note(`INVARIANT ${i.replace(/\d+/g, 'N').slice(0, 120)}`, seed, n, { i, wrap: style.wrap, lines: lines.slice(0, 40) });
            // Store rebuild == incremental.
            const live = JSON.stringify(host.head());
            host.store.rebuild();
            const rebuilt = JSON.stringify(host.head());
            if (live !== rebuilt) note('REBUILD != LIVE', seed, n, { live: live.length, rebuilt: rebuilt.length });
            const coinNow = host.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
            if (coinNow - coinBefore > 1e6) note('COIN MINTED > 1e6 in one reply', seed, n, { from: coinBefore, to: coinNow });
            coinBefore = coinNow;
            // Round 2: sometimes the reader deletes an earlier exchange; replay problems are recorded by path.
            if (process.env.FUZZ_DELETE && gen.r.chance(0.12)) {
                const chat = host.ctx.chat;
                const users = chat.map((m, i) => (m.is_user ? i : -1)).filter(i => i > 0 && i < chat.length - 2);
                if (users.length) {
                    const u = gen.r.pick(users);
                    try {
                        await host.st.deleteMessage(u + 1);
                        await host.st.deleteMessage(u);
                    } catch (e) { note(`DELETE EXCEPTION ${String(e?.message).slice(0, 100)}`, seed, n, {}); }
                    for (const p of host.store.problems()) note(`DELETE REPLAY SKIP ${String(p.why ?? p.message).replace(/"[^"]*"/g, (m) => m.replace(/[a-z]{2}_[0-9a-z]{8}/g, 'ID').replace(/\d+/g, 'N')).slice(0, 140)}`, seed, n, { problem: p });
                    coinBefore = host.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
                }
            }
            const heap = process.memoryUsage().heapUsed - heap0;
            if (heap > 200e6) note('HEAP +200MB in a reply', seed, n, { heap });
        }
        // Next prompt: static identical, tail within budget.
        await host.send('and then?', 'Quiet.');
        const statics = host.statics();
        if (statics.some(s => s !== staticText)) note('STATIC CHANGED', seed, replies, { variants: new Set(statics).size });
        const maxTail = Math.max(...host.tails().map(t => Math.ceil(t.length / 4)));
        if (maxTail > 1500) note('TAIL > 1500 tokens', seed, replies, { maxTail, happened: (host.tails().find(t => t.length / 4 > 1500) ?? '').split('\n').length });
        // Replay from scratch on a fresh host (load the saved chat).
        const chat = structuredClone(host.ctx.chat);
        const fresh = await suiteHost();
        await fresh.st.loadChat(chat);
        const a = JSON.stringify(host.head().domains);
        const b = JSON.stringify(fresh.head()?.domains);
        if (a !== b) {
            const diffDomains = Object.keys(host.head().domains).filter(d => JSON.stringify(host.head().domains[d]) !== JSON.stringify(fresh.head()?.domains?.[d]));
            note('FRESH REPLAY != LIVE', seed, replies, { diffDomains, problems: fresh.store.problems().slice(0, 3) });
        }
        fresh.close();
        const size = big(host.ctx.chat);
        if (size > 20e6) note('CHAT > 20MB', seed, replies, { size });
    } catch (e) {
        note(`HARNESS/HOST EXCEPTION ${String(e?.message).slice(0, 160)}`, seed, -1, { stack: e?.stack?.split('\n').slice(0, 6).join(' | ') });
    } finally {
        try { host?.close(); } catch { /* */ }
        restore();
    }
}

const t0 = Date.now();
for (let s = first; s < first + count; s++) {
    await runSeed(s);
    if (process.env.FUZZ_PROGRESS) process.stderr.write(`seed ${s} done ${(Date.now() - t0) / 1000}s\n`);
}
const report = [...findings.entries()].sort((a, b) => b[1].count - a[1].count).map(([sig, e]) => ({ sig, count: e.count, first: e.first }));
fs.writeFileSync(new URL(`./findings-${first}-${count}-${replies}.json`, OUT), JSON.stringify(report, null, 1));
for (const f of report) console.log(`${String(f.count).padStart(5)}  ${f.sig}   [seed ${f.first.seed} reply ${f.first.n}]`);
console.log(`\n${report.length} signatures, ${count} seeds × ${replies} replies in ${(Date.now() - t0) / 1000}s`);
if (quiet) console.warn = quiet;
