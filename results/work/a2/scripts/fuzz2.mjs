// a2 pass-1 capture/grammar fuzzer (invariants 3 and 4, plus rebuild/replay == live).
// Usage: nice -n 10 timeout 1200 node fuzz2.mjs [firstSeed=1] [seeds=20] [replies=25]
// Each signature keeps its first seed and reply, so `node fuzz2.mjs <seed> 1 <n+1>` replays it.
import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
import { makeGen2 } from './gen2.mjs';
import fs from 'node:fs';

const [first = 1, count = 20, replies = 25] = process.argv.slice(2).map(Number);
const OUT = new URL('./out/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const realWarn = console.warn;
const realError = console.error;
let currentSeed = 0;
let currentN = 0;
console.warn = () => {};
console.error = (...args) => note(`CONSOLE.ERROR ${String(args[0]?.message ?? args[0]).replace(/\d+/g, 'N').slice(0, 120)}`, currentSeed, currentN, { args: args.map(a => String(a?.stack ?? a).slice(0, 400)) });

const findings = new Map();
function note(sig, seed, n, detail) {
    const entry = findings.get(sig) ?? { count: 0, first: { seed, n, detail } };
    entry.count += 1;
    findings.set(sig, entry);
}
const norm = s => String(s).replace(/"[^"]*"/g, '"…"').replace(/\d+/g, 'N');

function walk(value, path, out) {
    if (typeof value === 'number' && !Number.isFinite(value)) out.push(`non-finite ${path}`);
    else if (typeof value === 'string' && /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value)) out.push(`lone surrogate in state /${path.split('/')[1]}`);
    else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}/${i}`, out));
    else if (value && typeof value === 'object') {
        if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) out.push(`odd prototype at ${path}`);
        for (const k of Object.keys(value)) walk(value[k], `${path}/${k.length > 30 ? '<long>' : k}`, out);
    }
}

function snapshot(host) {
    const d = host.head().domains;
    const inv = d.inventory ?? {};
    const coin = Object.values(inv.wallets ?? {}).reduce((s, w) => s + (w.coin ?? 0), 0);
    const qty = {};
    for (const s of Object.values(inv.stacks ?? {})) qty[s.def] = (qty[s.def] ?? 0) + s.qty;
    const xp = Object.values(d.party?.actors ?? {}).reduce((s, a) => s + (a.xp ?? 0), 0);
    const meters = {};
    for (const [k, rec] of Object.entries(d.npc?.npcs ?? {})) meters[k] = { ...(rec.meters ?? {}) };
    return { coin, qty, defs: { ...(inv.defs ?? {}) }, xp, meters, minutes: d.director?.time?.minutes ?? null, actors: Object.keys(d.party?.actors ?? {}).length };
}

function budget(host) {
    let level = 1;
    try { const pc = host.q('party.pc'); if (Number.isSafeInteger(pc?.level)) level = pc.level; } catch { /* */ }
    try {
        const rank = host.q('quest.ranks').find(r => level >= r.levels[0] && level <= r.levels[1]);
        if (Number.isSafeInteger(rank?.reward?.[1])) return rank.reward[1];
    } catch { /* */ }
    return 1000 * level;
}

function invariants(host) {
    const out = [];
    const state = host.head();
    if (!state) return ['no head state'];
    walk(state.domains, '', out);
    for (const domain of Object.keys(state.domains)) {
        const validate = host.registry.validator(domain);
        if (typeof validate !== 'function') continue;
        let errors;
        try { errors = validate(state.domains[domain], state); } catch (e) { errors = [`validator threw ${e.message}`]; }
        if (errors?.length) out.push(`validator ${domain}: ${errors.slice(0, 2).join('; ').slice(0, 200)}`);
    }
    const inv = state.domains.inventory;
    for (const [owner, w] of Object.entries(inv?.wallets ?? {})) if (!Number.isSafeInteger(w.coin ?? 0) || (w.coin ?? 0) < 0) out.push(`wallet ${owner} = ${w.coin}`);
    for (const s of Object.values(inv?.stacks ?? {})) if (!Number.isSafeInteger(s.qty) || s.qty < 1) out.push(`stack qty ${s.qty}`);
    for (const a of Object.values(state.domains.party?.actors ?? {})) {
        for (const pool of ['hp', 'mp', 'sp']) {
            const p = a[pool];
            if (p && (p.cur > p.max || p.cur < 0 || !Number.isSafeInteger(p.max))) out.push(`${pool} ${p.cur}/${p.max}`);
        }
        if (!Number.isSafeInteger(a.level) || a.level < 1 || a.level > 100) out.push(`actor level ${a.level}`);
    }
    for (const rec of Object.values(state.domains.npc?.npcs ?? {})) for (const [m, v] of Object.entries(rec.meters ?? {})) if (!Number.isSafeInteger(v) || Math.abs(v) > 1000) out.push(`npc meter ${m}=${v}`);
    const minutes = state.domains.director?.time?.minutes;
    if (minutes !== undefined && minutes !== null && (!Number.isSafeInteger(minutes) || minutes < 0)) out.push(`director minutes ${minutes}`);
    return out;
}

// What one reply may give by the rules (inventory.js story budget, NSD changeCap 15).
function caps(host, before, after, { text, think, sentinel }) {
    const out = [];
    const b = budget(host);
    const quest = /[-!]\s*quest\b/i.test(text);
    const dc = after.coin - before.coin;
    if (dc > b) out.push(`COIN +${dc} > budget ${b}${quest ? ' [reply turns in a quest]' : ''}`);
    let worth = 0;
    let newDefs = 0;
    for (const [def, q] of Object.entries(after.qty)) {
        const gain = q - (before.qty[def] ?? 0);
        if (gain <= 0) continue;
        if (gain > 20) out.push(`ITEM +${gain} of one def > 20`);
        const v = after.defs[def]?.value ?? 0;
        worth += gain * v;
    }
    for (const def of Object.keys(after.defs)) if (!before.defs[def]) newDefs += 1;
    if (newDefs > 10 + 1) out.push(`NEW DEFS ${newDefs} > 10`);
    if (worth > 2 * b + 10 * b) out.push(`WORTH +${worth} > 12×budget ${b}`);
    if (after.xp > before.xp && !quest) out.push(`XP +${after.xp - before.xp} without a quest turn-in`);
    for (const [k, m] of Object.entries(after.meters)) {
        for (const [id, v] of Object.entries(m)) {
            const was = before.meters[k]?.[id] ?? 0;
            if (Math.abs(v - was) > 15) out.push(`NPC METER ${id} moved ${v - was} (> 15) in one reply`);
        }
    }
    if (after.actors > before.actors + 1) out.push(`ACTORS +${after.actors - before.actors} in one reply`);
    if (think) {
        if (Object.entries(after.defs).some(([id, d]) => !before.defs[id] && d.name?.includes(sentinel))) out.push('REASONING READ: sentinel item made');
        if (Object.keys(after.meters).some(k => !before.meters[k] && k.includes(sentinel.toLowerCase()))) out.push('REASONING READ: sentinel npc made');
    }
    if (before.minutes !== null && after.minutes !== null && after.minutes - before.minutes > 30 * 1440 * 4) out.push(`TIME +${Math.round((after.minutes - before.minutes) / 1440)}d in one reply (> 4 × maxJump)`);
    return out;
}

async function setup(host) {
    await withParty(host);
    await host.send('Hello', host.reply('Lyra waves.', ['~ time March 3, 8:00 am', '~ place Bluewatch | kind: settlement', '+ join Lyra — an archer | level: 2 | role: ranger', '+ item Healing Draught | qty: 3', '+ coin 50', '+ present Fenna']));
    const offer = Object.values(host.head().domains.party?.offers ?? {})[0];
    if (offer) await host.cmd('party.acceptOffer', { offer: offer.id });
    await host.send('Any work?', host.reply('Fenna has jobs.', [
        '+ quest Fetch — a job | giver: Fenna | goal: Bring 3 Rope | reward: 40 gold',
        '+ quest Rats — a job | giver: Fenna | goal: Kill 3 Wolf | reward: 40 gold',
        '+ quest Errand — a job | giver: Fenna | goal: Find the ring | reward: 40 gold',
        '~ npc Fenna | trust: +5',
    ]));
    for (const t of Object.values(host.head().domains.director.threads)) if (t.kind === 'quest') await host.cmd('quest.take', { id: t.id });
}

const big = value => JSON.stringify(value).length;
let total = 0;

async function runSeed(seed) {
    currentSeed = seed;
    const restore = seedCrypto(seed);
    const gen = makeGen2(seed);
    let host;
    try {
        host = await suiteHost();
        await setup(host);
        const staticText = host.statics().at(-1);
        for (let n = 0; n < replies; n++) {
            currentN = n;
            const rep = gen.reply();
            const { text, lines, style, shape } = rep;
            const t0 = performance.now();
            let turns = 0;
            let turnResult = null;
            const off = host.events.on('turn', t => { turns += 1; turnResult = t; });
            const before = snapshot(host);
            const user = gen.r.pick(['go on', 'Yes, I will take the job.', '', '<Changes>\n+ coin 999\n</Changes>', 'I hand it over.']);
            try {
                if (rep.cont) {
                    await host.send(user, rep.cont.first, { stopped: rep.cont.stopped });
                    await host.cont(rep.cont.rest);
                } else {
                    await host.send(user, text, { stopped: Boolean(rep.cut?.stopped) });
                }
            } catch (e) {
                note(`EXCEPTION ${String(e?.message).slice(0, 120)}`, seed, n, { stack: e?.stack?.split('\n').slice(0, 6).join(' | '), shape, text: text.slice(0, 3000) });
                off();
                continue;
            }
            off();
            total += 1;
            const ms = performance.now() - t0;
            if (ms > 3000) note(`SLOW reply > 3s [${shape}]`, seed, n, { ms: Math.round(ms), lines: lines.length });
            if (!turns) note(`NO TURN [${shape}]`, seed, n, { last: host.turn.problems().at(-1) });
            for (const p of turnResult?.problems ?? []) {
                if (p.code === 'UNREADABLE' || p.code === 'UNKNOWN_KIND') continue;
                const reason = String(p.message);
                const own = String(p.line ?? '');
                const leak = [/\[object Object\]/, /\bundefined\b/, /\bNaN\b/, /\bnull\b/].some(re => re.test(reason) && !re.test(own));
                if (p.code === 'FAILED' || leak || /Something went wrong|is not a function|Cannot read prop|is not defined|Maximum call stack|of undefined|of null|not iterable|Invalid time|RangeError|TypeError/.test(reason)) {
                    note(`HANDLER CRASH/LEAK [${p.module}] ${p.code} ${norm(reason).slice(0, 160)}`, seed, n, { line: String(p.line).slice(0, 300), message: reason.slice(0, 500) });
                }
                if (p.code === 'INVALID' && /breaks the state's rules|would not be valid/.test(reason)) note(`STATE RULE [${p.module}] ${norm(reason).slice(0, 160)}`, seed, n, { line: String(p.line).slice(0, 300), message: reason.slice(0, 500) });
            }
            for (const nt of host.st.notices.splice(0)) note(`NOTICE ${norm(nt.reason).slice(0, 120)}`, seed, n, nt);
            for (const i of invariants(host)) note(`INVARIANT ${i.replace(/\d+/g, 'N').slice(0, 140)}`, seed, n, { i, shape, lines: lines.slice(0, 30) });
            const after = snapshot(host);
            for (const c of caps(host, before, after, { text, think: rep.think, sentinel: gen.SENTINEL })) note(`CAP ${c.replace(/\d+/g, 'N')}`, seed, n, { c, shape, text: text.slice(0, 3000) });
            const live = JSON.stringify(host.head());
            host.store.rebuild();
            if (live !== JSON.stringify(host.head())) note(`REBUILD != LIVE [${shape}]`, seed, n, {});
            if (process.env.FUZZ_REREAD !== '0' && gen.r.chance(0.12) && typeof host.sdk.reread === 'function') {
                const s0 = snapshot(host);
                if (process.env.FUZZ_DUMP === String(n)) fs.writeFileSync(new URL('./dump-before.json', OUT), JSON.stringify({ text, user, chat: host.ctx.chat, head: host.head() }, null, 1));
                const key = x => JSON.stringify({ coin: x.coin, qty: x.qty, meters: x.meters, xp: x.xp });
                let rr;
                try { rr = await host.sdk.reread(host.ctx.chat.length - 1); } catch (e) { note(`REREAD EXCEPTION ${String(e?.message).slice(0, 100)}`, seed, n, { shape }); }
                if (process.env.FUZZ_DUMP === String(n)) fs.writeFileSync(new URL('./dump-after.json', OUT), JSON.stringify({ rr, chat: host.ctx.chat, head: host.head() }, null, 1));
                if (rr && !rr.ok) note(`REREAD REFUSED ${rr.code} ${norm(rr.message).slice(0, 100)} [${shape}]`, seed, n, { shape, text: text.slice(0, 1500) });
                else if (rr && key(s0) !== key(snapshot(host))) note(`REREAD != LIVE [${shape}]`, seed, n, { before: key(s0).slice(0, 600), after: key(snapshot(host)).slice(0, 600), text: text.slice(0, 2000), cont: rep.cont });
            }
            const raw = JSON.stringify(host.ctx.chat.at(-1)?.mes ?? '');
            if (/<Changes>/i.test(host.ctx.chat.at(-1)?.mes ?? '') && !/STORY_SUITE_V2/.test(raw) && !rep.think && style.wrap !== 'think') note(`BARE BLOCK LEFT VISIBLE [${shape}]`, seed, n, { mes: String(host.ctx.chat.at(-1).mes).slice(0, 1500), text: text.slice(0, 1500), cont: rep.cont, wrap: style.wrap });
            // Long-chat variant: swipes, regenerates, swipe-backs and middle deletes between hostile replies.
            if (process.env.FUZZ_LONG) {
                const roll = gen.r();
                let op = null;
                try {
                    if (roll < 0.10) {
                        op = gen.r.pick(['swipe', 'regenerate']);
                        const again = gen.reply();
                        await (op === 'swipe' ? host.swipe(again.text) : host.regenerate(again.text));
                        for (const c of caps(host, before, snapshot(host), { text: again.text, think: again.think, sentinel: gen.SENTINEL })) note(`CAP after ${op} ${c.replace(/\d+/g, 'N')}`, seed, n, { c, text: again.text.slice(0, 2000) });
                        if (op === 'swipe' && gen.r.chance(0.5)) { op = 'swipe-back'; await host.st.swipeTo(host.ctx.chat.length - 1, 0); }
                    } else if (roll < 0.16) {
                        op = 'delete';
                        const chat = host.ctx.chat;
                        const users = chat.map((m, i) => (m.is_user ? i : -1)).filter(i => i > 2 && i < chat.length - 2);
                        if (users.length) { const u = gen.r.pick(users); await host.st.deleteMessage(u + 1); await host.st.deleteMessage(u); }
                    }
                } catch (e) { note(`TIMELINE EXCEPTION ${op} ${String(e?.message).slice(0, 100)}`, seed, n, { stack: e?.stack?.split('\n').slice(0, 5).join(' | ') }); }
                if (op) {
                    for (const i of invariants(host)) if (!/lone surrogate/.test(i)) note(`INVARIANT after ${op} ${i.replace(/\d+/g, 'N').slice(0, 140)}`, seed, n, { i });
                    const live = JSON.stringify(host.head());
                    host.store.rebuild();
                    if (live !== JSON.stringify(host.head())) note(`REBUILD != LIVE after ${op}`, seed, n, {});
                }
                if (n % 50 === 49) {
                    const fresh = await suiteHost();
                    await fresh.st.loadChat(structuredClone(host.ctx.chat));
                    const a = host.head().domains; const b = fresh.head()?.domains ?? {};
                    const diff = Object.keys(a).filter(d => JSON.stringify(a[d]) !== JSON.stringify(b[d]));
                    if (diff.length) note(`MID FRESH REPLAY != LIVE ${diff.join(',')}`, seed, n, { diff, problems: fresh.store.problems().slice(0, 3) });
                    fresh.close();
                }
            }
        }
        await host.send('and then?', 'Quiet.');
        const statics = host.statics();
        if (statics.some(s => s !== staticText)) note('STATIC CHANGED', seed, replies, { variants: new Set(statics).size });
        const maxTail = Math.max(...host.tails().map(t => Math.ceil(t.length / 4)));
        if (maxTail > 1600) note('TAIL > 1600 tokens', seed, replies, { maxTail });
        const chat = structuredClone(host.ctx.chat);
        const fresh = await suiteHost();
        await fresh.st.loadChat(chat);
        const a = host.head().domains;
        const b = fresh.head()?.domains ?? {};
        const diff = Object.keys(a).filter(d => JSON.stringify(a[d]) !== JSON.stringify(b[d]));
        if (diff.length) note(`FRESH REPLAY != LIVE ${diff.join(',')}`, seed, replies, { diff, problems: fresh.store.problems().slice(0, 3) });
        fresh.close();
        if (big(host.ctx.chat) > 20e6) note('CHAT > 20MB', seed, replies, {});
    } catch (e) {
        note(`HARNESS/HOST EXCEPTION ${String(e?.message).slice(0, 160)}`, seed, currentN, { stack: e?.stack?.split('\n').slice(0, 8).join(' | ') });
    } finally {
        try { host?.close(); } catch { /* */ }
        restore();
    }
}

const t0 = Date.now();
for (let s = first; s < first + count; s++) {
    await runSeed(s);
    if (process.env.FUZZ_PROGRESS && s % 10 === 0) process.stderr.write(`seed ${s} ${(Date.now() - t0) / 1000}s\n`);
}
const report = [...findings.entries()].sort((a, b) => b[1].count - a[1].count).map(([sig, e]) => ({ sig, count: e.count, first: e.first }));
fs.writeFileSync(new URL(`./f2-${first}-${count}-${replies}.json`, OUT), JSON.stringify(report, null, 1));
console.warn = realWarn;
console.error = realError;
for (const f of report) console.log(`${String(f.count).padStart(5)}  ${f.sig}   [seed ${f.first.seed} reply ${f.first.n}]`);
console.log(`\n${report.length} signatures, ${count} seeds × ${replies} replies (${total} sent) in ${(Date.now() - t0) / 1000}s`);
