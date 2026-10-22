// a3 features-toggle fuzz. usage: node fuzz.mjs <seedFrom> <seedTo> <steps> [-v] [--known] [--stop]
import fs from 'node:fs';
// --known: skip the ops behind already-filed findings (fy.all toggles, blocked gens, preview/commit across
// a toggle, re-read while a feature is off) so other signatures show.
import { allHost, H, FZ_TAIL, storeMod, seededMod, notes, turnMod } from './lib.mjs';
const { createStore } = storeMod;
const { prng, seedCrypto } = seededMod;
const { refusedFrom } = notes;
const { STATIC_KEY, TAIL_KEY } = turnMod;

const args = process.argv.slice(2);
const FROM = Number(args[0] ?? 1), TO = Number(args[1] ?? FROM), STEPS = Number(args[2] ?? 60);
const MID = args.includes('--p2');
const VERBOSE = args.includes('-v'), KNOWN = args.includes('--known'), STOP = args.includes('--stop');
const J = v => JSON.stringify(v ?? null);
const isCarrier = m => m && !m.is_user;
const carriers = chat => chat.map((m, i) => (isCarrier(m) ? i : -1)).filter(i => i >= 0);

const ITEMS = ['Rope', 'Lamp', 'Iron Key', 'Apple', 'Torch'];
const PEOPLE = ['Fenna', 'Kael', 'Lyra'];
function line(r) {
    switch (r.int(0, 13)) {
        case 0: case 1: case 2: return `~ tick ${r.pick(['Alpha', 'Beta', 'Gamma', 'Delta'])} | n: ${r.int(1, 9)}`;
        case 3: return r.chance(0.3) ? `~ time March ${r.int(1, 28)}, 8:00 am` : `+ tock ${r.pick(['One', 'Two', 'Three'])}`;
        case 4: return `+ item ${r.pick(ITEMS)} | qty: ${r.int(1, 3)}`;
        case 5: return `- item ${r.pick(ITEMS)}`;
        case 6: return `+ coin ${r.int(1, 30)} | from: ${r.pick(PEOPLE)}`;
        case 7: return `${r.pick(['+', '-'])} present ${r.pick(PEOPLE)}`;
        case 8: return `+ hook Rumor ${r.int(1, 9)} — an open thread`;
        case 9: return r.chance(0.4) ? `! time +${r.int(20, 50)}h` : `! time +${r.int(1, 5)}h`;
        case 10: return `~ wound Ren — a fall | harm: scratch`;
        case 11: return `+ quest Find ${r.pick(ITEMS)} — a job | giver: ${r.pick(PEOPLE)} | goal: get it | reward: 10 coin`;
        case 12: return `? check athletics — climb | dc: easy | who: Ren`;
        default: return r.chance(0.5) ? `! time +${r.int(20, 50)}h` : `~ TICK ${r.pick(['Alpha', 'Beta'])} | n: 2`;
    }
}
const reply = (r, step) => {
    const story = `Reply ${step}: the story goes on.`;
    if (r.chance(0.15)) return story;
    return `${story}\n<Changes>\n${Array.from({ length: r.int(1, 5) }, () => line(r)).join('\n')}\n</Changes>`;
};

function diff(a, b) {
    const out = [];
    const walk = (x, y, p) => { if (out.length > 4 || JSON.stringify(x) === JSON.stringify(y)) return;
        if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}/${k}`); }
        else out.push(`${p}: ${JSON.stringify(x)?.slice(0, 80)} -> ${JSON.stringify(y)?.slice(0, 80)}`); };
    walk(JSON.parse(a), JSON.parse(b), ''); return out.join('; ');
}
const signatures = new Map();
let totalSteps = 0, totalToggles = 0, totalLinesOff = 0;

async function runSeed(seed) {
    const restore = seedCrypto(seed);
    const r = prng(seed);
    const warn = console.warn; console.warn = () => {};
    const h = await allHost();
    const { st, ctx, store, sdk, registry, features } = h;
    const violations = [];
    const log = [];
    const fail = (sig, detail = '') => {
        violations.push({ sig, detail: String(detail).slice(0, 300), step: log.length, op: log.at(-1) });
        signatures.set(sig, (signatures.get(sig) ?? 0) + 1);
        if (process.env.DUMPDEL && violations.length === 1) fs.writeFileSync(process.env.DUMPDEL, J(globalThis.__dels.at(-1)));
        if (process.env.DUMPCHAT && violations.length === 1) fs.writeFileSync(process.env.DUMPCHAT, J({ chat: ctx.chat, head: store.head() }));
        if (process.env.DUMPLOG && (violations.length === 1 || sig === process.env.DUMPLOG)) console.error('LOG', J(log), '\nCHAT', J(ctx.chat.map(m => [m.is_user ? 'U' : 'A', m.swipe_id, m.swipes?.length, m.mes.slice(0, 200)])));
        if (VERBOSE) console.error('VIOLATION', seed, log.length, log.at(-1), sig, String(detail).slice(0, 300));
    };
    const turns = [];
    sdk.on('turn', t => turns.push(t));
    const IDS = registry.features().map(f => f.id).filter(id => !(KNOWN && id === 'fy.all'));
    const isOn = id => registry.featureOn(id);
    const promptIds = registry.features().filter(f => f.prompt).map(f => f.id);
    const staticByKey = new Map();
    const validate = (state, names) => names.flatMap(name => {
        const fn = registry.validator(name);
        if (typeof fn !== 'function') return [];
        try { const e = fn(state?.domains?.[name], state); return Array.isArray(e) ? e.map(String) : []; } catch (error) { return [`The ${name} check failed: ${error?.message ?? error}`]; }
    });
    const fresh = () => createStore({ chat: () => structuredClone(ctx.chat), save: async () => {}, validate, scratch: n => registry.scratch(n) });

    await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    await sdk.command('scene.place', { name: 'Bluewatch Village', kind: 'settlement' });
    sdk.on('committed', ({ receipt }) => {
        if (receipt?.type !== 'chronicle.digest') return;
        globalThis.__digests = (globalThis.__digests ?? 0) + 1;
        if (!isOn('story-director.digest')) fail('digest-ran-while-off');
    });
    await h.send('Morning.', 'Dawn.\n<Changes>\n~ time March 3, 8:00 am\n</Changes>');
    if (process.env.DBGT) console.log('START', J(store.head()?.domains?.director?.time), J(turns.at(-1)?.problems));
    await store.flush?.();

    // At prompt-ready (after the host's listener): what the request was built with, then a pending
    // mid-generation toggle (between interceptor and MESSAGE_RECEIVED).
    let gen = null, midToggle = null;
    ctx.eventSource.on(ctx.eventTypes.CHAT_COMPLETION_PROMPT_READY, () => {
        gen = { on: Object.fromEntries(registry.features().map(f => [f.id, isOn(f.id)])), static: st.prompt(STATIC_KEY), tail: st.prompt(TAIL_KEY) };
        if (midToggle) { const [id, want] = midToggle; midToggle = null; features.set(id, want); totalToggles += 1; log[log.length - 1] += ` mid:${id}=${want}`; }
    });
    const genOn = id => (gen ? gen.on[id] : isOn(id));
    function checkGen(label) {
        if (!gen) return;
        const last = gen.static;
        const key = J(promptIds.map(id => genOn(id)));
        if (staticByKey.has(key) && staticByKey.get(key) !== last) fail('static-differs-same-prompt-features', label);
        if (!staticByKey.has(key)) {
            for (const [k, v] of staticByKey) if (v === last && k !== key) { /* two keys same static: fine for prompt:true */ }
            staticByKey.set(key, last);
        }
        const tick = last.includes('~ tick');
        if (tick !== genOn('fz.kind')) fail('static-grammar-vs-feature', `tick grammar ${tick} fz.kind ${genOn('fz.kind')}`);
        checkTail(gen.tail);
        gen = null;
    }
    function checkTail(tail) {
        if (typeof tail !== 'string' || !tail) return;
        if (tail.includes(FZ_TAIL) !== genOn('fz.tail')) fail('tail-part-vs-feature', `fz.tail ${genOn('fz.tail')}`);
        if (tail.includes('FY tail.') !== genOn('fy.all')) fail('tail-whole-vs-feature', `fy.all ${genOn('fy.all')}`);
        if (/FZ ticks \d/.test(tail) !== genOn('fz.kind')) fail('tail-kindpart-vs-feature', `fz.kind ${genOn('fz.kind')}`);
    }
    function checkAll(label) {
        let live;
        try { live = J(store.head()); } catch (e) { fail('head-threw', e.message); return; }
        const f = J(fresh().head());
        if (f !== live) fail('replay!=live', `${label} ${diff(live, f)} fresh=${J(fresh().problems?.().map(p=>p.message??p).slice(0,2))} live=${J(store.problems?.().map(p=>p.message??p).slice(-2))}`);
        if (H.calls.some(c => !c.on)) fail(`hook-called-while-off:${H.calls.filter(c => !c.on).map(c => c.name).join(',')}`, label);
        H.calls.length = 0;
        const peek = sdk.query('fz.peek');
        if ((peek === null) === isOn('fz.cmd')) fail('query-vs-feature', `peek ${J(peek)} on ${isOn('fz.cmd')}`);
        const tab = registry.tabs().some(t => t.id === 'fz-tab');
        if (tab !== isOn('fz.cmd')) fail('tab-vs-feature');
    }
    // after a generation that added/replaced carrier `index` with text `text`
    function checkCapture(index, text, kindOn) {
        const t = turns.at(-1);
        if (!t || t.index !== index) return;
        const lines = (text.match(/^~ tick .*$/gim) ?? []);
        if (!kindOn) {
            totalLinesOff += lines.length;
            const quiet = t.problems.filter(p => p.code === 'FEATURE_OFF');
            if (lines.length && quiet.length < Math.min(lines.length, 1)) fail('off-line-not-quiet-problem', J(t.problems.map(p => p.code)));
            if (quiet.some(p => p.quiet !== true)) fail('feature-off-problem-not-quiet');
            const refused = refusedFrom(t.problems, index);
            if (refused.some(x => /^~ tick/i.test(x.line))) fail('off-line-shown-as-refusal');
            // the reply's own ops do not touch fzk
            const prev = carriers(ctx.chat).filter(i => i < index).at(-1);
            const before = prev === undefined ? null : J(store.at(prev)?.domains?.fzk);
            const after = J(store.at(index)?.domains?.fzk);
            if (before !== after) fail('off-kind-touched-state', `${before} -> ${after}`);
        } else if (t.problems.some(p => p.code === 'FEATURE_OFF' && /tick/i.test(p.line ?? ''))) fail('on-line-told-off');
    }

    const OPS = {
        async toggle() {
            const id = r.pick(IDS);
            const want = r.chance(0.5);
            const before = J(store.head());
            if (process.env.NOTOGGLE) return;
            const ok = features.set(id, want);
            totalToggles += 1;
            log[log.length - 1] += ` ${id}=${want}`;
            if (ok !== want) fail('set-return', `${id} ${ok}`);
            if (isOn(id) !== want) fail('set-not-effective', id);
            if (J(store.head()) !== before) fail('toggle-changed-state', id);
        },
        async send(step) {
            let text = reply(r, step);
            if (store.head()?.domains?.director?.time?.minutes == null && r.chance(0.5)) text = `${text.split('\n')[0]}\n<Changes>\n~ time March ${r.int(1, 28)}, 8:00 am\n</Changes>`;
            if (MID && r.chance(0.3)) midToggle = [r.pick(IDS), r.chance(0.5)];
            const res = await h.send(`User ${step}.`, text);
            midToggle = null;
            if (res?.index >= 0) checkCapture(res.index, text, isOn('fz.kind'));
            checkGen('send');
        },
        async swipe(step) {
            if (!isCarrier(ctx.chat.at(-1)) || ctx.chat.length < 2) return;
            const text = reply(r, step);
            if (MID && r.chance(0.3)) midToggle = [r.pick(IDS), r.chance(0.5)];
            const res = await h.swipe(text);
            midToggle = null;
            if (res?.index >= 0) checkCapture(res.index, text, isOn('fz.kind'));
            checkGen('swipe');
        },
        async regenerate(step) {
            if (!isCarrier(ctx.chat.at(-1)) || ctx.chat.length < 3) return;
            const text = reply(r, step);
            if (MID && r.chance(0.3)) midToggle = [r.pick(IDS), r.chance(0.5)];
            const res = await h.regenerate(text);
            midToggle = null;
            if (res?.index >= 0) checkCapture(res.index, text, isOn('fz.kind'));
            checkGen('regenerate');
        },
        async cont(step) {
            if (!isCarrier(ctx.chat.at(-1)) || ctx.chat.length < 2) return;
            await h.cont(` More ${step}.`);
            checkGen('continue');
        },
        async swipeBack() {
            const i = ctx.chat.length - 1; const m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            await st.swipeTo(i, r.int(0, m.swipes.length - 1));
        },
        async del() {
            if (ctx.chat.length < 3) return;
            const i = r.chance(0.7) ? ctx.chat.length - 1 : r.int(1, ctx.chat.length - 1);
            if (process.env.DUMPDEL) { globalThis.__dels = globalThis.__dels ?? []; globalThis.__dels.push({ step: log.length - 1, i, chat: structuredClone(ctx.chat), head: store.head() }); }
            await st.deleteMessage(i);
        },
        async reload() {
            const before = J(store.head());
            await st.loadChat(structuredClone(ctx.chat));
            if (J(store.head()) !== before) fail('reload-changed-head');
        },
        async command() {
            const which = r.pick(['fz.poke', 'fz.free', 'fy.ask', 'scene.present']);
            const rev = store.head()?.meta?.rev;
            const on = isOn('fz.cmd');
            const res = await sdk.command(which, which === 'scene.present' ? { add: r.pick(PEOPLE) } : {});
            if (which === 'fz.poke') {
                if (on && !res.ok) fail('poke-on-refused', res.code);
                if (!on && (res.ok || res.code !== 'FEATURE_OFF')) fail('poke-off-not-refused', res.code);
                if (!on && store.head()?.meta?.rev !== rev) fail('poke-off-changed-rev');
            }
            if (which === 'fz.free' && res.ok) {
                if ((res.receipt.data.code === 'FEATURE_OFF') === on) fail('ctxcall-vs-feature', res.receipt.data.code);
                if ((res.receipt.data.peek === null) === on) fail('ctxquery-vs-feature');
            }
        },
        async preview() {
            if (KNOWN) return;
            const pv = await sdk.preview('fz.poke', {});
            if (!pv.ok) return;
            if (r.chance(0.5)) features.set('fz.cmd', false);
            const on = isOn('fz.cmd');
            const res = await sdk.commit(pv.token);
            if (!on && res.ok) fail('commit-after-feature-off-stored');
        },
        async reread() {
            const idx = carriers(ctx.chat).filter(i => i > 0);
            if (!idx.length) return;
            if (KNOWN && !isOn('fz.kind')) return;
            const i = r.pick(idx);
            const before = J(store.at(i)?.domains?.fzk);
            const on = isOn('fz.kind');
            const res = await sdk.reread(i);
            if (res?.ok && !on && J(store.at(i)?.domains?.fzk) !== before) fail('reread-while-off-dropped-feature-state', `${before} -> ${J(store.at(i)?.domains?.fzk)}`);
        },
        async edit(step) {
            const idx = carriers(ctx.chat).filter(i => i > 0);
            if (!idx.length) return;
            const i = r.pick(idx);
            const m = ctx.chat[i];
            await st.editMessage(i, r.chance(0.5) ? `${m.mes} (edited ${step})` : `Edited ${step}.\n<Changes>\n${line(r)}\n</Changes>`);
        },
        async corrupt() {
            const idx = carriers(ctx.chat).filter(i => i > 0);
            if (!idx.length) return;
            const m = ctx.chat[r.pick(idx)];
            const rec = m.extra?.storySuite;
            if (!rec) return;
            const how = r.int(0, 4);
            const bad = structuredClone(rec);
            if (how === 0) bad.ops = 'junk';
            else if (how === 1) { if (KNOWN) return; bad.spans = [{ n: 999, story: true }]; }
            else if (how === 2) { bad.ops = [...(bad.ops ?? []), { op: 'replace', path: '/domains/fzk/ticks/Nope/x', value: 1 }]; if (KNOWN) bad.spans = [...(bad.spans ?? []), { n: 1, story: false }]; }
            else if (how === 3) bad.checkpoint = { v: 2, meta: { rev: 'x' }, domains: [] };
            else bad.receipts = null;
            m.extra.storySuite = bad;
            if (m.swipe_info?.[m.swipe_id ?? 0]) m.swipe_info[m.swipe_id ?? 0].extra = structuredClone(m.extra);
            log[log.length - 1] += ` how${how}`;
            await st.loadChat(structuredClone(ctx.chat));
        },
        async rewind() {
            const idx = carriers(ctx.chat).filter(i => (ctx.chat[i].extra?.storySuite?.receipts?.length ?? 0) > 0);
            if (!idx.length) return;
            const i = r.pick(idx);
            const revs = ctx.chat[i].extra.storySuite.receipts.map(x => x?.rev).filter(Number.isInteger);
            if (!revs.length) return;
            const res = await sdk.rewind({ index: i, beforeRev: r.pick(revs) });
            log[log.length - 1] += ` ${i} ${res?.ok ?? res?.code}`;
        },
        async branch() {
            if (ctx.chat.length < 2) return;
            await ctx.branchChat(r.int(0, ctx.chat.length - 1));
        },
        async midsave() {
            // A command whose save is pending while the reader flips a feature.
            let release;
            const gate = new Promise(res => { release = res; });
            const real = ctx.saveChat;
            ctx.saveChat = async (...a) => { await gate; return real(...a); };
            try {
                const on = isOn('fz.cmd');
                const pending = sdk.command(r.pick(['fz.poke', 'fz.free', 'scene.present']), { add: r.pick(PEOPLE) });
                await Promise.resolve();
                const id = r.pick(IDS); const want = r.chance(0.5);
                features.set(id, want); totalToggles += 1; log[log.length - 1] += ` ${id}=${want} cmdOn=${on}`;
                release();
                const res = await pending;
                if (res && typeof res.ok !== 'boolean') fail('midsave-odd-result');
            } finally { ctx.saveChat = real; release(); }
        },
        async blocked(step) {
            if (KNOWN) return;
            H.block = true;
            try { await h.send(`Blocked ${step}.`, 'never'); } finally { H.block = false; }
            // drop the dangling user message
            if (ctx.chat.at(-1)?.is_user) await st.deleteMessage(ctx.chat.length - 1);
        },
    };
    const weights = [['toggle', 6], ['send', 6], ['swipe', 2], ['regenerate', 2], ['cont', 1], ['swipeBack', 1], ['del', 2], ['reload', 1], ['command', 3], ['preview', 1], ['reread', 1], ['blocked', 1]];
    if (MID) weights.push(['edit', 2], ['corrupt', 1], ['rewind', 1], ['branch', 1], ['midsave', 2], ['reread', 1]);
    const bag = weights.flatMap(([n, w]) => Array(w).fill(n));
    for (let step = 0; step < STEPS; step++) {
        const op = r.pick(bag);
        log.push(op);
        try { await OPS[op](step); } catch (e) { fail(`threw:${op}`, e?.stack ?? e); }
        await store.flush?.();
        checkAll(op);
        if (process.env.DBGT2) console.log('T', step, log.at(-1), J(store.head()?.domains?.director?.time?.minutes), ctx.chat.length);
        totalSteps += 1;
        if (STOP && violations.length) break;
    }
    if (process.env.DBGT) console.log('END', seed, J(store.head()?.domains?.director?.time), J(store.head()?.domains?.chronicle?.written), isOn('story-director.digest'), log.filter(x => x.startsWith('send')).length);
    h.close();
    console.warn = warn;
    restore();
    return violations;
}

let bad = 0;
for (let seed = FROM; seed <= TO; seed++) {
    const v = await runSeed(seed);
    if (v.length) { bad += 1; if (!VERBOSE) console.log(`seed ${seed}: ${v.length} violations, first ${v[0].sig} @${v[0].step} ${v[0].op} ${v[0].detail.slice(0, 120)}`); }
    if (STOP && v.length) break;
}
console.log(JSON.stringify({ digests: globalThis.__digests ?? 0, seeds: `${FROM}-${TO}`, steps: STEPS, totalSteps, totalToggles, totalLinesOff, badSeeds: bad, signatures: Object.fromEntries(signatures) }, null, 1));
