// a3 pass 3: hostile pack data for recipes / crafts / meterPresets / economy / ranks (SB #99, #103).
// usage: node packfuzz.mjs <seedFrom> <seedTo> [--host N] [-v]
// Per seed: mutate Ersveil, validatePack (as JSON text and as an object), check no throw, no prototype
// pollution, normalized output within the documented limits; every --host N-th seed also installs it into
// a testkit host and runs the packs queries, the economy, a + coin line and the craft/meter text.
import fs from 'node:fs';
const A = process.env.A3ROOT ?? '/home/user/cell/a3';
const { validatePack } = await import(`${A}/Story_block/src/v2/packs/validate.js`);
const { contentOf, craftsOf, economyOf } = await import(`${A}/Story_block/src/v2/packs/content.js`);
const L = await import(`${A}/Story_block/src/v2/packs/limits.js`);
const { createHost } = await import(`${A}/Story_block/testkit/index.js`);
const { prng } = await import(`${A}/Story_block/tests/v2/qa/helpers/seeded.js`);
const BASE = fs.readFileSync(`${A}/Story_block/examples/packs/ersveil-bluewatch/pack.json`, 'utf8');

const args = process.argv.slice(2);
const FROM = Number(args[0] ?? 1), TO = Number(args[1] ?? FROM);
const HOSTN = Number((args.find(a => a.startsWith('--host=')) ?? '--host=10').slice(7));
const VERBOSE = args.includes('-v');
const J = v => JSON.stringify(v);

const HOSTILE_STR = ['<img src=x onerror=alert(1)>', '<script>alert(1)</script>', '{{user}}', '__proto__', 'constructor', 'toString',
    'Ünïcødé ⚗️ 𝔄𝔩𝔠𝔥𝔢𝔪𝔶', 'a‮b', '\u0000nul', 'x'.repeat(5000), '', '   ', 'Leech-salt Pouch', 'iron-ingot', 'line\nbreak', '"quoted"', '${x}', '<style>*{display:none}</style>'];
const HOSTILE_NUM = [0, -1, 1, 2, 1e9, 9007199254740991, 9007199254740992, 1e308, -1e308, 0.5, NaN, Infinity, -0, 5, 40, 41, 4, 0.001, 0.0009, 1000, 1000.0001, '7', null, true, [], {}];
const KEYS = ['__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty', 'valueOf'];

function mutate(r, pack) {
    const c = pack.content;
    const pick = list => (Array.isArray(list) ? list[Math.floor(r() * list.length)] : null);
    const val = () => (r() < 0.5 ? pick(HOSTILE_NUM) : r() < 0.7 ? pick(HOSTILE_STR) : pick([undefined, null, [], {}, [1, 2], { a: 1 }]));
    const n = 1 + Math.floor(r() * (process.env.SOFT ? 2 : 6));
    const log = [];
    for (let i = 0; i < n; i++) {
        const what = Math.floor(r() * 14);
        try {
        const rec = c.recipes?.length ? pick(c.recipes) : null;
        if (what === 0 && rec) { const f = pick(['qty', 'fee', 'minutes', 'dc', 'craft', 'station', 'stat', 'known', 'teaches', 'makes', 'name']); rec[f] = val(); log.push(`recipe.${f}`); }
        else if (what === 1 && rec?.materials?.length) { const m = pick(rec.materials); const f = pick(['qty', 'item']); m[f] = val(); log.push(`material.${f}`); }
        else if (what === 2 && rec) { rec.makes = pick(rec.materials ?? [{ item: rec.makes }])?.item ?? rec.makes; log.push('cycle makes=material'); }
        else if (what === 3) { // a cycle: A from B, B from A
            const items = c.items.slice(0, 2).map(item => item.name);
            c.recipes = [...(c.recipes ?? []), { name: `Cyc ${i}a`, makes: items[0], materials: [{ item: items[1], qty: 1 }], qty: 1e6 }, { name: `Cyc ${i}b`, makes: items[1], materials: [{ item: items[0], qty: 1 }], qty: 1e6 }];
            log.push('cycle pair');
        } else if (what === 4 && c.crafts?.length) { const cr = pick(c.crafts); const f = pick(['id', 'title', 'stats', 'stations', 'note', pick(KEYS)]); cr[f] = r() < 0.3 ? [pick(HOSTILE_STR)] : val(); log.push(`craft.${f}`); }
        else if (what === 5 && c.meterPresets?.length) { const mp = pick(c.meterPresets); const m = mp.meters?.length ? pick(mp.meters) : null; if (m) { const f = pick(['id', 'name', 'min', 'max', 'start', 'describe', 'bands', 'drift']); m[f] = val(); log.push(`meter.${f}`); } }
        else if (what === 6 && c.meterPresets?.length) { const mp = pick(c.meterPresets); const st = mp.stages?.length ? pick(mp.stages) : null; if (st) { const f = pick(['id', 'name', 'needs', 'milestone']); st[f] = r() < 0.3 ? [{ meter: pick(['regard', 'nope', '__proto__']), at: pick(HOSTILE_NUM) }] : val(); log.push(`stage.${f}`); } }
        else if (what === 7) { pack.economy = r() < 0.7 ? { scale: pick(HOSTILE_NUM), note: pick(HOSTILE_STR) } : val(); log.push('economy'); }
        else if (what === 8 && c.ranks?.length) { const rk = pick(c.ranks); rk.reward = r() < 0.5 ? [0, pick([9007199254740991, 1e15, 1e9, -5, 1.5])] : val(); log.push('rank.reward'); }
        else if (what === 9) { const k = pick(KEYS); (rec ?? c)[k] = { polluted: true }; log.push(`key ${k}`); }
        else if (what === 10 && c.meterPresets?.length) { const mp = pick(c.meterPresets); mp.meters = Array.from({ length: pick([0, 6, 7, 100]) }, (_, j) => ({ id: `m${j}`, name: `M${j}`, min: -1000, max: 1000, start: 0 })); log.push('meters many'); }
        else if (what === 11) { c.recipes = Array.from({ length: pick([0, 1, 500, 5000]) }, (_, j) => ({ name: `R${j}`, makes: c.items[0].name, materials: [{ item: c.items[1].name, qty: 1 }] })); log.push('recipes many'); }
        else if (what === 12 && c.meterPresets) { c.meterPresets = val(); log.push('meterPresets='); }
        else if (what === 13 && Array.isArray(c.crafts)) { c.crafts = r() < 0.5 ? [...c.crafts, { ...c.crafts[0] }] : val(); log.push('crafts='); }
        } catch { /* a mutation on an earlier mutation's junk */ }
    }
    return log;
}

const sig = new Map();
let n = 0, hosted = 0, accepted = 0;
const fail = (seed, s, detail = '', log = []) => {
    sig.set(s, (sig.get(s) ?? 0) + 1);
    if (VERBOSE || sig.get(s) === 1) console.log(`seed ${seed}: ${s} ${String(detail).slice(0, 300)} | ${log.join(',')}`);
};
const protoKeys = () => J(Object.getOwnPropertyNames(Object.prototype).sort());
const PROTO = protoKeys();
const inRange = (v, lo, hi) => Number.isSafeInteger(v) && v >= lo && v <= hi;
console.warn = () => {};

for (let seed = FROM; seed <= TO; seed++) {
    const r = prng(seed);
    const pack = JSON.parse(BASE);
    const log = mutate(r, pack);
    n += 1;
    for (const form of ['text', 'object']) {
        let result;
        // JSON text with a literal "__proto__" key, as a hand-written file can hold.
        const text = J(pack).replace('"content":{', r() < 0.2 ? '"content":{"__proto__":{"polluted":true},' : '"content":{');
        try { result = validatePack(form === 'text' ? text : JSON.parse(text)); } catch (e) { fail(seed, `validate-threw:${form}`, e?.stack, log); continue; }
        if (protoKeys() !== PROTO || ({}).polluted) fail(seed, 'prototype-polluted', '', log);
        if (!result?.ok) continue;
        accepted += 1;
        const p = result.pack;
        for (const rec of p.content.recipes ?? []) {
            if (!inRange(rec.qty, 1, Number.MAX_SAFE_INTEGER)) fail(seed, 'recipe-qty', rec.qty, log);
            for (const m of rec.materials) if (!inRange(m.qty, 1, Number.MAX_SAFE_INTEGER)) fail(seed, 'material-qty', m.qty, log);
            if (rec.dc !== undefined && !inRange(rec.dc, 5, 40)) fail(seed, 'recipe-dc', rec.dc, log);
            for (const f of ['fee', 'minutes']) if (rec[f] !== undefined && !(Number.isSafeInteger(rec[f]) && rec[f] >= 0)) fail(seed, `recipe-${f}`, J(rec[f]), log);
            if (rec.materials.some(m => m.item === rec.makes)) fail(seed, 'recipe-makes-own-material(accepted)', rec.name, log);
            for (const k of KEYS) if (Object.hasOwn(rec, k) && k !== 'constructor' && k !== 'toString') fail(seed, `recipe-kept-key:${k}`, '', log);
        }
        if (p.economy && !(p.economy.scale >= 0.001 && p.economy.scale <= 1000)) fail(seed, 'economy-scale', p.economy.scale, log);
        for (const mp of p.content.meterPresets ?? []) for (const m of mp.meters ?? []) {
            if (!(m.min >= -1000 && m.max <= 1000 && m.min < m.max && m.start >= m.min && m.start <= m.max)) fail(seed, 'meter-range', J(m), log);
        }
        try {
            contentOf([p], 'recipes'); craftsOf([p]); economyOf([p]); contentOf([p], 'meterPresets');
        } catch (e) { fail(seed, 'content-threw', e?.message, log); }
        if (form !== 'text' || seed % HOSTN) continue;
        hosted += 1;
        let h;
        try {
            h = await createHost();
            const inst = await h.packs.packs.install(text);
            if (!inst.ok) { fail(seed, 'install-refused-valid', J(inst.errors?.slice(0, 2)), log); continue; }
            const queries = {};
            for (const [q, a] of [['packs.crafts', {}], ['packs.economy', {}], ['inventory.economy', {}], ['packs.content', { kind: 'recipes' }], ['packs.content', { kind: 'meterPresets' }], ['packs.content', { kind: 'crafts' }]]) {
                try { queries[q + (a.kind ?? '')] = h.sdk.query(q, a); } catch (e) { fail(seed, `query-threw:${q}`, e?.message, log); }
            }
            const eco = queries['inventory.economy'];
            if (!(eco?.scale >= 0.001 && eco.scale <= 1000)) fail(seed, 'inventory.economy-out', J(eco), log);
            await h.send('Chest.', 'Coins.\n<Changes>\n+ coin 999999999999\n</Changes>');
            const coin = h.head().domains.inventory.wallets?.party?.coin ?? 0;
            const ranks = (queries['packs.contentrecipes'] && h.sdk.query('packs.content', { kind: 'ranks' })) ?? [];
            const top = Math.max(0, ...ranks.filter(x => x.pack === ranks[0]?.pack && x.levels && 1 >= x.levels[0] && 1 <= x.levels[1]).map(x => x.reward?.[1] ?? 0));
            const bound = top || Math.max(1, Math.round(1000 * eco.scale));
            if (coin > bound) fail(seed, 'coin-over-budget', `${coin} > ${bound}`, log);
            if (coin > 1e9) fail(seed, 'coin-huge(pack rank reward)', coin, log);
        } catch (e) { fail(seed, 'host-threw', e?.stack, log); } finally { h?.close(); }
    }
}
console.log(J({ seeds: `${FROM}-${TO}`, packs: n, accepted, hosted, signatures: Object.fromEntries(sig) }));
