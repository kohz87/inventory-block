// a1 replay/storage fuzzer: all four modules (Story_block break harness suite.js, Ersveil pack), the b6 gen.mjs
// reply generator plus beta lines; sends, swipes (new + back), regenerates, Continue split blocks, middle deletes,
// last deletes, edits, re-reads, rewinds, reloads, feature toggles, UI commands. After every step:
//   A. a cold store over a copy of the chat (host validators + scratch) == live head
//   B. a cold store over the chat with every checkpoint stripped (replay from scratch) == live head
//   C. after a reload (loadChat of a copy), head == head before
//   D. swipe back to a swipe that was head before == the head it had then (no commands since)
//   E. every 25 steps: each carrier's live store.at(i) == cold store over chat[0..i]
//   F. nothing throws
// usage: node fuzz.mjs <seedFrom> <seedTo> <steps> [outJsonl]
import { appendFileSync } from 'node:fs';
const SB = process.env.SB_ROOT ?? '/home/user/cell/a1/Story_block';
const { suiteHost } = await import(`${SB}/tests/v2/break/helpers/suite.js`);
const { createStore } = await import(`${SB}/src/v2/store.js`);
import { createGen } from '/home/user/inventory-block/harness/break-scripts/gen.mjs';

const [from = 1, to = 1, STEPS = 300, OUT = '/home/user/cell/out/a1/scripts/fuzz-results.jsonl'] = process.argv.slice(2).map((v, i) => (i < 3 ? Number(v) : v));
const plain = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const J = v => JSON.stringify(plain(v));
console.warn = () => {};
console.error = () => {};

function firstDiff(a, b, path = '') {
    if (J(a) === J(b)) return null;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) === !Array.isArray(b)) {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
            const d = firstDiff(a[k], b[k], `${path}/${k}`);
            if (d) return d;
        }
    }
    return { path, live: J(a)?.slice(0, 300), other: J(b)?.slice(0, 300) };
}

function coldStore(host, chat) {
    const validate = (state, names) => names.flatMap(name => {
        const fn = host.registry.validator(name);
        if (typeof fn !== 'function') return [];
        try { const e = fn(state?.domains?.[name], state); return Array.isArray(e) ? e.map(String) : []; } catch (error) { return [`The ${name} check failed: ${error?.message ?? error}`]; }
    });
    return createStore({ chat: () => chat, save: async () => {}, validate, scratch: name => host.registry.scratch(name) });
}
const stripCheckpoints = chat => chat.map((m, i) => {
    if (i === 0) return structuredClone(m);
    const c = structuredClone(m);
    const strip = r => { if (r && typeof r === 'object') { delete r.checkpoint; delete r.covers; } };
    strip(c?.extra?.storySuite);
    for (const s of c?.swipe_info ?? []) strip(s?.extra?.storySuite);
    return c;
});

const EXTRA = [
    () => `~ npc Fenna | trust: +${1 + (Math.random() * 3 | 0)}`,
];

async function runSeed(seed) {
    const realUUID = globalThis.crypto.randomUUID.bind(globalThis.crypto);
    const h = await suiteHost({ pack: true, seed, nsdNpcs: [{ name: 'Fenna' }, { name: 'Marrit' }] });
    let n = 0;
    globalThis.crypto.randomUUID = () => `${(++n).toString(16).padStart(8, '0')}-0000-4000-8000-${String(seed).padStart(12, '0').slice(-12)}`;
    const gen = createGen(seed * 7919);
    const r = gen.rnd; const pick = gen.pick; const chance = gen.chance; const int = gen.int;
    const log = [];
    const snaps = new Map();       // `${index}|${swipe}|${text}` -> head JSON when that swipe was last and untouched
    const featureIds = h.sdk.features().map(f => f.id);
    const sigs = [];
    let replies = 0;
    const cstat = {};
    const made = await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
    if (!made.ok) throw new Error('party.create ' + made.message);

    const hint = () => {
        const head = h.head();
        const inv = head?.domains?.inventory ?? {};
        const carried = Object.values(inv.stacks ?? {}).map(s => inv.defs?.[s.def]?.name).filter(Boolean);
        return { present: head?.domains?.scene?.present ?? [], carried, wallet: inv.wallets?.party?.coin ?? 0, quests: [], companions: [] };
    };
    const lastKey = () => { const i = h.ctx.chat.length - 1; const m = h.ctx.chat[i]; return m && !m.is_user ? `${i}|${m.swipe_id ?? 0}|${m.mes}` : null; };
    const betaLines = () => {
        const hh = hint();
        const p = hh.carried.length ? pick(hh.carried) : 'Spear';
        return pick([
            `! repair ${p} | at: ${pick(['smith', 'tailor'])}`,
            `! refine ${p} | at: smith | with: Small Monster Core`,
            `+ recipe ${pick(['Camp Stew', 'Leech-salt Pouch', 'Healing Salve'])} | from: Old Tamsin | who: Wessel`,
            `! use ${p} | on: Wessel | by: Wessel | qty: 1`,
            `! market Bluewatch Village — salt is short | until: Goldwane 20, 08:00 am`,
            `~ market Bluewatch Village — supplies back`,
            `~ npc ${pick(['Fenna', 'Marrit'])} | trust: +${int(1, 4)} | affection: ${pick(['+1', '-1'])}`,
            `+ milestone ${pick(['Fenna', 'Marrit'])} — ${pick(['shared a secret', 'saved a life'])}`,
            `~ item ${p} | wear: ${pick(['scuff', 'tear', 'ruin'])}`,
            `~ item ${p} | equip: Wessel`,
            `+ coin ${int(1, 60)} | from: ${pick(['Fenna', 'a stranger'])}`,
            `! time +${pick(['2h', '14h', '1d'])}`,
        ]);
    };
    const reply = () => {
        const g = gen.next(hint());
        let text = g.reply;
        if (chance(0.5)) {
            const extra = Array.from({ length: int(1, 3) }, betaLines).join('\n');
            text += /<\/Changes>/.test(text) ? '' : '';
            text = text.includes('</Changes>') ? text.replace(/<\/Changes>(?![\s\S]*<\/Changes>)/, `${extra}\n</Changes>`) : `${text}\n\n<Changes>\n${extra}\n</Changes>`;
        }
        return { user: g.user, text };
    };
    const uiCommand = () => {
        const head = h.head();
        const stacks = Object.values(head?.domains?.inventory?.stacks ?? {});
        const defs = head?.domains?.inventory?.defs ?? {};
        const gear = stacks.filter(x => defs[x.def]?.slot || defs[x.def]?.kind === 'equipment');
        const s = (gear.length && chance(0.7) ? pick(gear) : stacks.length ? pick(stacks) : { id: 'none' }).id;
        const threads = Object.values(head?.domains?.director?.threads ?? {});
        const offers = threads.filter(t => t.offer).map(t => t.id);
        const open = threads.filter(t => t.taken && !t.over && !t.closed).map(t => t.id);
        return pick([
            ['inventory.wear', { stack: s, amount: int(1, 30) }],
            ['inventory.repair', { stack: s }],
            ['item.equip', { stack: s }],
            ['item.unequip', { stack: s }],
            ['trade.repair', { stack: s }],
            ['trade.refine', { stack: s }],
            ['trade.sell', { stack: s, qty: 1 }],
            ['item.use', { stack: s }],
            ['wallet.pay', { owner: 'party', amount: int(1, 8) }],
            ['wallet.receive', { owner: 'party', amount: int(1, 6) }],
            ['inventory.drop', { stack: s, qty: 1 }],
            ['inventory.lootTake', { index: 0 }],
            ['npc.adjust', { name: pick(['Fenna', 'Marrit']), meters: { trust: int(-3, 3) } }],
            ['quest.take', { id: offers.length ? pick(offers) : 'x' }],
            ['quest.take', { id: offers.length ? pick(offers) : 'x' }],
            ['quest.finish', { id: open.length ? pick(open) : 'x' }],
            ['quest.abandon', { id: open.length ? pick(open) : 'x' }],
            ['party.rest', { kind: pick(['short', 'long']) }],
            ['party.addEffect', { name: 'Keen Sight', who: 'Wessel', on: 'perception', for: '2h', kind: 'buff' }],
            ['scene.present', { add: pick(['Fenna', 'Kael']) }],
            ['chronicle.digest', {}],
        ]);
    };

    async function check(step, action) {
        if (action === 'send' && step % 3 !== 0) return null;
        const live = plain(h.head());
        const chat = structuredClone(h.ctx.chat);
        const cold = plain(coldStore(h, chat).head());
        let d = firstDiff(live, cold);
        if (d) return { inv: 'A cold==live', ...d };
        if (step % 2 === 0 || /delete|rewind|reread|feature|edit/.test(action)) {
            const bare = plain(coldStore(h, stripCheckpoints(chat)).head());
            d = firstDiff(live, bare);
            if (d) return { inv: 'B no-checkpoint replay==live', ...d };
        }
        if (step % 60 === 0) {
            const idx = chat.map((m, i) => (i > 0 && !m.is_user ? i : -1)).filter(i => i > 0);
            const sample = idx.length <= 8 ? idx : [idx.at(-1), idx.at(-2), ...Array.from({ length: 6 }, () => pick(idx))];
            for (const i of sample) {
                const at = plain(h.store.at(i));
                const pre = plain(coldStore(h, structuredClone(chat.slice(0, i + 1))).head());
                d = firstDiff(at, pre);
                if (d) return { inv: `E at(${i})==cold prefix`, ...d };
            }
        }
        return null;
    }

    for (let step = 1; step <= STEPS; step++) {
        const chat = h.ctx.chat;
        const last = chat.length - 1;
        const lastAI = last > 0 && !chat[last].is_user;
        const roll = r();
        let action;
        let expect = null;
        try {
            const sendP = seed % 2 ? 0.36 : 0.56;
            const multi = lastAI && (chat[last].swipes?.length ?? 0) > 1;
            const openBlock = lastAI && /<Changes>(?![\s\S]*<\/Changes>)/.test(chat[last].mes);
            if (openBlock && chance(0.6)) {
                action = 'continue-close';
                await h.cont(`\n${betaLines()}\n</Changes>`);
            } else if (last >= 2 && chance(0.05)) {
                action = 'send-split';
                await h.send('I keep going.', `The road bends.\n\n<Changes>\n${betaLines()}\n${betaLines()}`);
                await h.cont(`\n${betaLines()}\n</Changes>`);
                replies++;
            } else if (multi && chance(0.3)) {
                const m = chat[last];
                let id = int(0, m.swipes.length - 1);
                if (id === m.swipe_id) id = (id + 1) % m.swipes.length;
                const key = `${last}|${id}|${m.swipes[id]}`;
                expect = snaps.get(key) ?? null;
                action = `swipeTo ${id}${expect ? ' (snap)' : ''}`;
                await h.st.swipeTo(last, id);
            } else if (roll < sendP || last < 2) {
                const { user, text } = reply();
                action = 'send';
                await h.send(user, text);
                replies++;
            } else if (roll < sendP + 0.08 && lastAI) {
                action = 'swipe';
                await h.swipe(reply().text);
            } else if (roll < 0.50 && lastAI && (chat[last].swipes?.length ?? 0) > 1) {
                const m = chat[last];
                let id = int(0, m.swipes.length - 1);
                if (id === m.swipe_id) id = (id + 1) % m.swipes.length;
                const key = `${last}|${id}|${m.swipes[id]}`;
                expect = snaps.get(key) ?? null;
                action = `swipeTo ${id}${expect ? ' (snap)' : ''}`;
                await h.st.swipeTo(last, id);
            } else if (roll < 0.54 && lastAI) {
                action = 'regenerate';
                await h.regenerate(reply().text);
            } else if (roll < 0.58 && lastAI) {
                // Continue: sometimes completes an unclosed block (split), sometimes plain text.
                const unclosed = /<Changes>(?![\s\S]*<\/Changes>)/.test(chat[last].mes);
                action = unclosed ? 'continue-close' : 'continue';
                await h.cont(unclosed ? `\n${betaLines()}\n</Changes>` : pick([' The wind turns.', `\n\n<Changes>\n${betaLines()}\n</Changes>`, '\n\n<Changes>\n' + betaLines()]));
            } else if (roll < 0.63 && last > 3) {
                const i = int(1, last - 1);
                action = `deleteMiddle ${i}`;
                await h.st.deleteMessage(i);
                snaps.clear();
            } else if (roll < 0.67 && last > 2) {
                action = 'deleteLast';
                await h.st.deleteMessage(last);
            } else if (roll < 0.70 && lastAI) {
                action = 'edit';
                const m = chat[last];
                await h.st.editMessage(last, m.mes.replace(/^[^\n<]*/, s => `${s} (edited)`));
                snaps.clear();
            } else if (roll < 0.72 && lastAI) {
                action = 'reread';
                await h.sdk.reread(last);
                snaps.clear();
            } else if (roll < 0.74) {
                const carriers = chat.map((m, i) => (!m.is_user && m.extra?.storySuite?.receipts?.length ? i : -1)).filter(i => i > 0);
                if (carriers.length) {
                    const i = pick(carriers);
                    const recs = chat[i].extra.storySuite.receipts;
                    const rev = pick(recs).rev ?? recs[0]?.rev;
                    action = `rewind ${i}@${rev}`;
                    await h.sdk.rewind({ index: i, beforeRev: rev });
                    snaps.clear();
                } else action = 'rewind-none';
            } else if (roll < 0.79) {
                action = 'reload';
                const before = plain(h.head());
                await h.store.flush().catch(() => {});
                await h.st.loadChat(structuredClone(h.ctx.chat), h.ctx.chatId);
                const d = firstDiff(before, plain(h.head()));
                if (d) { sigs.push({ seed, step, inv: 'C reload==before', action, ...d, log: log.slice(-12) }); break; }
            } else if (roll < 0.83) {
                const id = pick(featureIds);
                const on = h.features.on ? !h.features.on(id) : chance(0.5);
                action = `feature ${id} ${on}`;
                h.features.set(id, on);
                snaps.clear();
            } else {
                const [type, payload] = uiCommand();
                action = `cmd ${type}`;
                const res = await h.cmd(type, payload);
                cstat[`${type}:${res?.ok ? 'ok' : (res?.message ?? res?.code ?? '?').slice(0, 60)}`] = (cstat[`${type}:${res?.ok ? 'ok' : (res?.message ?? res?.code ?? '?').slice(0, 60)}`] ?? 0) + 1;
            }
        } catch (error) {
            sigs.push({ seed, step, inv: 'F threw', action, error: String(error?.stack ?? error).slice(0, 500), log: log.slice(-12) });
            break;
        }
        log.push(`${step}:${action}`);
        if (expect) {
            const d = firstDiff(plain(h.head()), JSON.parse(expect));
            if (d) { sigs.push({ seed, step, inv: 'D swipe-back==snapshot', action, ...d, log: log.slice(-12) }); break; }
        }
        const bad = await check(step, action);
        if (bad) { sigs.push({ seed, step, action, ...bad, log: log.slice(-12) }); break; }
        const k = lastKey();
        if (k) snaps.set(k, J(h.head()));
    }
    const out = { seed, cstat, replies, len: h.ctx.chat.length, checkpoints: h.ctx.chat.filter(m => m.extra?.storySuite?.checkpoint).length, kinds: Object.entries(h.ctx.chat.flatMap(m => m.extra?.storySuite?.receipts ?? []).reduce((a, x) => { const k = x.kind ?? x.type ?? x.line?.slice(0, 8) ?? '?'; a[k] = (a[k] ?? 0) + 1; return a; }, {})).map(e => e.join(':')).join(' '), sigs };
    h.close();
    globalThis.crypto.randomUUID = realUUID;
    return out;
}

for (let seed = from; seed <= to; seed++) {
    let out;
    try { out = await runSeed(seed); } catch (error) { out = { seed, crash: String(error?.stack ?? error).slice(0, 600) }; }
    appendFileSync(OUT, JSON.stringify(out) + '\n');
    process.stdout.write(`${seed}: ${out.crash ? 'CRASH ' + out.crash.slice(0, 120) : `replies ${out.replies} cps ${out.checkpoints} sigs ${out.sigs.map(s => `${s.inv}@${s.step} ${s.path ?? ''} [${s.action}]`).join('; ')}`}\n`);
}
