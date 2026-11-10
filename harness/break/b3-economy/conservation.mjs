#!/usr/bin/env node
// b3-economy conservation checker (F103 break round).
//
// Runs a random, seeded session of the whole Story Suite v2 (Story Block core + RPG Battle + Story
// Director + NPC State Delta, Ersveil pack installed) on Story Block's testkit, and after every step
// sums the world's value:
//
//   coin    Σ every wallet
//   goods   Σ stack qty × def.value (the inventory's own price of a thing), plus the value of every
//           piece waiting with a crafter (trade.orders)
//   xp      Σ every party member's lifetime XP (xp + the XP of every level below theirs)
//   pending Σ what code would pay right now for every taken quest whose target is met
//
// Each step's change is checked against the receipts that step committed. Every receipt type has a
// rule: what it may make, move or destroy (RULES below). A change no receipt pays for, a mint above
// its rule's bound, a sale above the value of what left, a purchase below it, a click that mints, a
// timeline move (swipe/delete) that does not restore the state recorded at that point, stacks or
// coin held by someone not in the party, and a cold rebuild that differs from the live state are
// all flagged.
//
// Usage:
//   node conservation.mjs [--seed N] [--steps N] [--cheats] [--timeline] [--json out.json]
//     --cheats    also mixes in the hostile moves of the b3 report (UI internal commands, inflated
//                 change lines and files, claim collisions, middle deletes after a sale…)
//     --timeline  also swipes, regenerates and deletes replies
//   STORY_SUITE_ROOT = the folder holding Story_block, rpg_battle, Story_director, npc_state_delta
//   (default /home/user/_break/b3-economy).
//
// Exit code 1 when anything was flagged.

import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.STORY_SUITE_ROOT ??= '/home/user/_break/b3-economy';
const here = path.dirname(fileURLToPath(import.meta.url));
const { suiteHost, rebuilt, PACK, ROOT } = await import(pathToFileURL(path.join(here, 'tests/Story_block/helpers/suite.js')).href);
const rules = await import(pathToFileURL(path.join(ROOT, 'rpg_battle/src/rules.js')).href);
const termsLib = await import(pathToFileURL(path.join(ROOT, 'rpg_battle/src/terms.js')).href);

// ---------------------------------------------------------------- options
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
    const at = argv.indexOf(`--${name}`);
    if (at < 0) return fallback;
    const next = argv[at + 1];
    return next === undefined || next.startsWith('--') ? true : next;
};
const SEED = Number(opt('seed', 7));
const STEPS = Number(opt('steps', 120));
const CHEATS = Boolean(opt('cheats', false));
const TIMELINE = Boolean(opt('timeline', false));
const JSON_OUT = opt('json', null);
// What the story may mint in one reply before the checker calls it model-minted beyond the rules.
// The pack's lowest rank (F) pays 50–400 marks for a whole quest; a reply's own coin/goods are held
// to that rank's top by default.
const STORY_CAP = Number(opt('story-cap', PACK.content.ranks?.[0]?.reward?.[1] ?? 400));

// ---------------------------------------------------------------- rng
function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rnd = mulberry(SEED);
const pick = list => list[Math.floor(rnd() * list.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---------------------------------------------------------------- measuring
const RULES = rules.makeRules(null);
function lifetimeXp(actor) {
    let sum = Number(actor?.xp) || 0;
    for (let level = 1; level < (actor?.level ?? 1); level += 1) sum += rules.xpToNext(level, RULES);
    return sum;
}

function measure(state) {
    const inv = state?.domains?.inventory ?? { defs: {}, stacks: {}, wallets: {} };
    const party = state?.domains?.party ?? { actors: {} };
    const trade = state?.domains?.trade ?? { orders: {} };
    const coin = Object.values(inv.wallets ?? {}).reduce((sum, w) => sum + (Number(w?.coin) || 0), 0);
    let goods = 0;
    const byDef = {};
    for (const stack of Object.values(inv.stacks ?? {})) {
        const value = Number(inv.defs?.[stack.def]?.value) || 0;
        goods += value * stack.qty;
        byDef[stack.def] = (byDef[stack.def] ?? 0) + stack.qty;
    }
    let orders = 0;
    for (const order of Object.values(trade.orders ?? {})) orders += Number(order?.piece?.value) || 0;
    const xp = Object.values(party.actors ?? {}).reduce((sum, actor) => sum + lifetimeXp(actor), 0);
    const members = new Set(['party', ...Object.keys(party.actors ?? {})]);
    const orphans = [
        ...Object.values(inv.stacks ?? {}).filter(stack => !members.has(stack.owner)).map(stack => `${inv.defs?.[stack.def]?.name ?? stack.def}×${stack.qty} held by ${stack.owner}`),
        ...Object.entries(inv.wallets ?? {}).filter(([owner, w]) => !members.has(owner) && (Number(w?.coin) || 0) > 0).map(([owner, w]) => `${w.coin} coin held by ${owner}`),
    ];
    return { coin, goods: goods + orders, xp, byDef, orphans };
}

function pendingOf(host) {
    let pending = 0;
    const threads = Object.values(host.head().domains.director?.threads ?? {});
    for (const thread of threads) {
        if (thread.kind !== 'quest' || thread.status !== 'active' || !thread.taken) continue;
        let progress = null;
        try { progress = host.q('quest.progress', { id: thread.id }); } catch { progress = null; }
        if (!progress?.met || !progress.finish?.ok) continue;
        const reward = thread.reward;
        if (!reward || !Number.isSafeInteger(reward.amount)) continue;
        pending += reward.each ? reward.amount * (thread.target?.kind === 'items' ? thread.target.count : progress.have) : reward.amount;
    }
    return pending;
}

const sumDelta = (a, b) => ({ coin: b.coin - a.coin, goods: b.goods - a.goods, xp: b.xp - a.xp });

// ---------------------------------------------------------------- the rules per receipt
// Each rule gets (receipt, before, after) and returns { coin, goods, xp } bounds the receipt may
// change, as [min, max], plus `why` lines to flag. Missing keys mean 0..0.
const ANY = [-Infinity, Infinity];
const ZERO = [0, 0];
const LOSS = [-Infinity, 0];
const GAIN = [0, Infinity];

function rankCap(level) {
    for (const rank of PACK.content.ranks ?? []) if (level >= rank.levels[0] && level <= rank.levels[1]) return rank.reward[1];
    return PACK.content.ranks?.at(-1)?.reward?.[1] ?? Infinity;
}

const INTERNAL_FROM_UI = new Set(['wallet.receive', 'inventory.grant', 'events.fire', 'party.grantXp', 'party.applyResult', 'party.heal', 'party.restore', 'party.fightPools', 'party.import', 'party.addCompanion']);

function ruleFor(receipt, step) {
    const d = receipt.data ?? {};
    const type = receipt.type;
    const why = [];
    if (receipt.cause === 'ui' && (type.startsWith('capture.') || type.startsWith('module.') || INTERNAL_FROM_UI.has(type))) {
        why.push(`${type} ran as a click (cause ui): no rule pays for a button`);
        return { coin: ZERO, goods: ZERO, xp: ZERO, why, cause: 'click' };
    }
    switch (type) {
        case 'party.create': return { coin: ZERO, goods: ZERO, xp: ANY, why, cause: 'creation' };
        case 'creation.import': {
            why.push(`a character file brought ${d.purse ?? 0} coin and ${d.items ?? 0} things (nothing checks a file's purse or items)`);
            return { coin: GAIN, goods: GAIN, xp: GAIN, why, cause: 'import' };
        }
        case 'trade.sell': return { coin: [d.total, d.total], goods: LOSS, xp: ZERO, why, cause: 'trade', sale: d };
        case 'trade.buy': return { coin: [-d.total, -d.total], goods: GAIN, xp: ZERO, why, cause: 'trade', buy: d };
        case 'craft.commission': return { coin: [-d.fee, -d.fee], goods: ANY, xp: ZERO, why, cause: 'trade', commission: d };
        case 'craft.collect': return { coin: ZERO, goods: ANY, xp: ZERO, why, cause: 'trade', collect: d };
        case 'combat.end': {
            const xp = Object.values(d.xp ?? {}).reduce((s, n) => s + (Number(n) || 0), 0);
            return { coin: [d.loot?.money ?? 0, d.loot?.money ?? 0], goods: GAIN, xp: [0, xp], why, cause: 'fight' };
        }
        case 'quest.finish': {
            const paid = d.paid?.amount ?? 0;
            const level = step.pcLevel ?? 1;
            if (paid > rankCap(level)) why.push(`quest reward ${paid} is above the top of the rank range for level ${level} (${rankCap(level)}): the reward came from the model's reward: label`);
            const gained = (d.xp?.gains ?? []).reduce((s, g) => s + (g.xp ?? 0), 0);
            const levelXp = rules.xpToNext(level, RULES);
            if (gained > levelXp) why.push(`quest XP ${gained} is more than a whole level at level ${level} (${levelXp}): the amount came from the model's xp: label`);
            return { coin: [paid, paid], goods: LOSS, xp: [0, gained], why, cause: 'quest', xpGain: gained };
        }
        case 'events.fire': {
            const def = (PACK.content.events ?? []).find(e => `pack.${PACK.id}/${e.id}` === d.event);
            const pays = (def?.then ?? []).filter(s => s.command === 'wallet.receive').reduce((s, st) => s + (st.payload?.amount ?? 0), 0);
            if (!def) why.push(`event ${d.event} is not an Ersveil event`);
            return { coin: [0, pays], goods: def ? ZERO : ANY, xp: ZERO, why, cause: 'event' };
        }
        case 'inventory.consume': case 'inventory.drop': case 'item.use': case 'wallet.pay':
            return { coin: LOSS, goods: LOSS, xp: ZERO, why, cause: 'use' };
        case 'inventory.transfer': case 'inventory.split': case 'inventory.merge': case 'inventory.equip': case 'inventory.unequip':
        case 'item.give': case 'item.equip': case 'item.unequip': case 'party.dismissOffer':
            return { coin: ZERO, goods: ZERO, xp: ZERO, why, cause: 'move' };
        // A companion who leaves keeps their own XP (it is theirs, not the party's); goods and coin stay.
        case 'party.removeCompanion': return { coin: ZERO, goods: ZERO, xp: LOSS, why, cause: 'move' };
        case 'party.acceptOffer': return { coin: ZERO, goods: ZERO, xp: ANY, why, cause: 'join' };
        case 'party.grantXp': return { coin: ZERO, goods: ZERO, xp: GAIN, why, cause: 'xp' };
        default:
            if (type.startsWith('capture.') && receipt.cause === 'story') return { coin: ANY, goods: ANY, xp: ANY, why, cause: 'story' };
            return { coin: ZERO, goods: ZERO, xp: ZERO, why, cause: 'other' };
    }
}

// ---------------------------------------------------------------- the session
const h = await suiteHost({ seed: SEED });
const flags = [];
const counts = {};
const steps = [];
const pointMetrics = new Map();   // "index:swipe" → metrics when that reply was the head
const flag = (step, kind, text, extra = {}) => flags.push({ step: step.n, action: step.action, kind, text, ...extra });

const keyOf = () => {
    const chat = h.ctx.chat;
    const i = chat.findLastIndex(m => !m.is_user);
    return `${i}:${chat[i]?.swipe_id ?? 0}`;
};

async function run(action, fn, { timeline = false } = {}) {
    const n = steps.length + 1;
    const before = h.head();
    const m0 = { ...measure(before), pending: pendingOf(h) };
    const seen = new Set(h.sdk.receipts().map(r => r.receipt.id));
    const pcLevel = h.q('party.pc')?.level ?? 1;
    let result;
    try { result = await fn(); } catch (error) {
        flag({ n, action }, 'throw', `threw to the reader: ${error?.message ?? error}`);
    }
    const after = h.head();
    const m1 = { ...measure(after), pending: pendingOf(h) };
    const fresh = h.sdk.receipts().map(r => r.receipt).filter(r => !seen.has(r.id));
    const step = { n, action, pcLevel, receipts: fresh.map(r => `${r.type}/${r.cause}`), delta: { ...sumDelta(m0, m1), pending: m1.pending - m0.pending } };
    steps.push(step);
    counts[action.split(' ')[0]] = (counts[action.split(' ')[0]] ?? 0) + 1;

    for (const orphan of m1.orphans.filter(o => !m0.orphans.includes(o))) flag(step, 'out-of-reach', `${orphan}: not a party member, the value is out of reach`);

    if (timeline) {
        const want = pointMetrics.get(keyOf());
        if (want && (want.coin !== m1.coin || want.goods !== m1.goods || want.xp !== m1.xp)) {
            flag(step, 'timeline', `after ${action} the head ${keyOf()} has coin ${m1.coin} goods ${m1.goods} xp ${m1.xp}; when it was last the head it had coin ${want.coin} goods ${want.goods} xp ${want.xp}`);
        }
        pointMetrics.set(keyOf(), m1);
        return result;
    }

    // Bounds from the receipts this step committed.
    const bounds = { coin: [0, 0], goods: [0, 0], xp: [0, 0] };
    let storyCoin = 0;
    let storyGoods = 0;
    for (const receipt of fresh) {
        const rule = ruleFor(receipt, step);
        for (const text of rule.why) flag(step, rule.cause, text, { receipt: receipt.type });
        for (const key of ['coin', 'goods', 'xp']) {
            const [lo, hi] = rule[key] ?? ZERO;
            bounds[key][0] += lo;
            bounds[key][1] += hi;
        }
        if (rule.cause === 'story') {
            if (receipt.type === 'capture.coin' && receipt.data?.amount && /receives/.test(receipt.summary)) storyCoin += receipt.data.amount;
        }
        if (rule.sale) {
            // A sale: the coin received must not exceed the inventory's own value of what left.
            const def = before.domains.inventory.defs[rule.sale.def];
            const worth = (Number(def?.value) || 0) * rule.sale.qty;
            if (rule.sale.total > worth) flag(step, 'sold-above-value', `${rule.sale.qty} ${rule.sale.name} sold for ${rule.sale.total}, valued ${worth} in the inventory`);
        }
        if (rule.buy) {
            const def = after.domains.inventory.defs[rule.buy.def];
            const worth = (Number(def?.value) || 0) * rule.buy.qty;
            if (worth > rule.buy.total) flag(step, 'info:bought-below-value', `${rule.buy.qty} ${rule.buy.name} bought for ${rule.buy.total}, valued ${worth}`);
        }
        if (rule.commission) {
            const order = after.domains.trade.orders[rule.commission.order];
            const used = (order?.materials ?? []).reduce((s, part) => s + (Number(before.domains.inventory.defs[part.def]?.value) || 0) * part.qty, 0);
            const worth = Number(order?.piece?.value) || 0;
            if (worth > used + rule.commission.fee) flag(step, 'commission-mints', `${order?.piece?.name} worth ${worth} made from materials worth ${used} for a fee of ${rule.commission.fee}`);
        }
    }
    // A '+ coin -N' line (a payment written with a sign) must not pay the party.
    const lastReply = h.ctx.chat.at(-1);
    if (!lastReply?.is_user && /\n\+\s*coin\s+-\s*\d/.test(String(lastReply?.mes ?? '')) && fresh.some(r => r.type === 'capture.coin' && /receives/.test(r.summary))) {
        flag(step, 'sign', `"+ coin -N" was read as a gain: ${fresh.filter(r => r.type === 'capture.coin').map(r => r.summary).join(' ')}`);
    }
    // Story receipts: what one reply's lines minted.
    const storyFresh = fresh.filter(r => r.cause === 'story');
    if (storyFresh.length) {
        // What the reply's new things fetch at the best buyer here (the price the rules pay), not
        // def.value: a pack's value and RPG Battle's prices are different scales (see B-b3 report).
        const before0 = measure(before).byDef;
        for (const [def, qty] of Object.entries(measure(after).byDef)) {
            const gained = qty - (before0[def] ?? 0);
            if (gained <= 0) continue;
            const stack = items().find(i => i.def === def && !i.equipped && i.qty >= 1);
            if (!stack) continue;
            let best = 0;
            for (const kind of ['general', 'smith', 'apothecary', 'crafter', 'guild']) {
                const quote = h.q('trade.quote', { type: 'sell', stack: stack.stack, qty: 1, kind });
                if (quote?.ok) best = Math.max(best, quote.total);
            }
            storyGoods += best * gained;
        }
        if (storyCoin > STORY_CAP) flag(step, 'model-minted', `one reply's change lines gave ${storyCoin} coin (cap ${STORY_CAP}); nothing in code bounds + coin`);
        if (storyGoods > STORY_CAP) flag(step, 'model-minted', `one reply's change lines made goods that sell for ${storyGoods} (cap ${STORY_CAP}); an item's price comes from the line's own note`);
    }
    for (const key of ['coin', 'goods', 'xp']) {
        const value = step.delta[key];
        const [lo, hi] = bounds[key];
        if (value < lo || value > hi) flag(step, 'unexplained', `${key} changed by ${value}; the receipts (${step.receipts.join(', ') || 'none'}) allow ${lo}..${hi}`);
    }
    pointMetrics.set(keyOf(), m1);
    return result;
}

// ---------------------------------------------------------------- moves
const packItems = PACK.content.items.map(item => item.name);
const foes = ['Cellar Rat', 'Crag Wolf', 'Sluice Leech'];
const places = ['Bluewatch Village', 'Highmark Capital', 'Shorn Hamlet', 'Glassdock', 'Ledgerford Town'];
const reply = (text, lines) => h.reply(text, lines);
const items = () => h.items();

async function fightOut() {
    for (let n = 0; n < 200 && h.q('combat.session')?.status === 'active'; n += 1) await h.cmd('combat.act', { action: { type: 'auto' } });
}

const honest = [
    ['story item', 3, () => h.send('We look around.', reply('Something turns up.', [`+ item ${pick(packItems)} | qty: ${int(1, 3)}`]))],
    ['story coin', 2, () => h.send('We do a job.', reply('Someone pays.', [`+ coin ${int(1, 30)} | from: a local`]))],
    ['story spend', 1, () => h.send('We pay the ferry.', reply('Coins change hands.', [`- coin ${int(1, 10)} | to: the ferryman`]))],
    ['story place', 1, () => h.send('We walk on.', reply('The road.', [`~ place ${pick(places)} | kind: settlement`]))],
    ['story time', 1, () => h.send('We wait.', reply('Hours pass.', [`! time +${int(1, 30)}h`]))],
    ['story quest', 1, () => {
        const q = pick(PACK.content.quests);
        return h.send(`I take the ${q.name} job.`, reply('Fenna pins a notice.', [`+ quest ${q.name} — ${q.goal} | giver: ${q.giver} | goal: Kill ${q.target} | reward: ${q.reward}`]));
    }],
    ['fight', 2, async () => {
        await h.send('We hunt.', reply('Foes!', [`! encounter ${int(1, 3)} ${pick(foes)} — ahead | tier: trivial`]));
        const offer = h.q('combat.offers').at(-1);
        if (!offer) return;
        const begun = await h.cmd('combat.start', { offer: offer.id });
        if (!begun.ok) return;
        await fightOut();
        await h.cmd('combat.end');
    }],
    ['ui sell', 2, async () => {
        const loose = items().filter(i => !i.equipped && i.kind !== 'money' && i.kind !== 'quest');
        if (!loose.length) return;
        const it = pick(loose);
        await h.cmd('trade.sell', { stack: it.stack, qty: int(1, it.qty), kind: pick(['general', 'smith', 'apothecary', 'crafter', 'guild', 'fence']) });
    }],
    ['ui buy', 2, async () => {
        const stock = h.q('trade.stock', { kind: pick(['general', 'smith', 'apothecary', 'crafter', 'guild', 'fence']) });
        const entry = stock.items.length ? pick(stock.items) : null;
        if (entry) await h.cmd('trade.buy', { shop: stock.shop, def: entry.def.id, qty: entry.def.kind === 'equipment' ? 1 : int(1, 3) });
    }],
    ['ui commission', 1, async () => {
        const mats = items().filter(i => i.kind === 'material' && !i.equipped);
        if (!mats.length) return;
        const m = pick(mats);
        await h.cmd('craft.commission', { piece: `${m.name.split(' ')[0]} Charm`, materials: [{ stack: m.stack, qty: Math.min(m.qty, 3) }], crafter: pick(['the smith', 'the tanner', 'the apothecary']) });
    }],
    ['ui collect', 1, async () => {
        for (const order of h.q('trade.orders') ?? []) if (order.due) await h.cmd('craft.collect', { order: order.id });
    }],
    ['ui quest', 1, async () => {
        for (const t of Object.values(h.head().domains.director?.threads ?? {})) {
            if (t.kind !== 'quest' || t.status !== 'active') continue;
            if (!t.taken) await h.cmd('quest.take', { id: t.id });
            else await h.cmd('quest.finish', { id: t.id });
        }
    }],
    ['ui companion', 1, async () => {
        const party = h.q('party.actors') ?? [];
        const companion = party.find(a => a.kind === 'companion');
        if (!companion) return h.send('Someone joins?', reply('A guard offers to come.', [`+ join Brann — a guard | role: guard`])).then(() => {
            const offer = h.head().domains.party.offers.at(-1);
            return offer ? h.cmd('party.acceptOffer', { offer: offer.id }) : null;
        });
        const loose = items().filter(i => i.owner === 'party' && !i.equipped);
        if (loose.length && rnd() < 0.7) return h.cmd('item.give', { stack: pick(loose).stack, to: companion.id, qty: 1 });
        return h.cmd('party.removeCompanion', { actor: companion.id });
    }],
    ['ui split-merge', 1, async () => {
        const many = items().filter(i => i.qty > 1 && !i.equipped);
        if (!many.length) return;
        const it = pick(many);
        await h.cmd('inventory.split', { stack: it.stack, qty: 1 });
        const same = items().filter(i => i.def === it.def && i.owner === it.owner && !i.equipped);
        if (same.length > 1) await h.cmd('inventory.merge', { stack: same[1].stack, into: same[0].stack });
    }],
];

const timeline = [
    ['swipe', 1, () => h.swipe('Another way it went.')],
    ['swipe-back', 1, async () => {
        const i = h.ctx.chat.findLastIndex(m => !m.is_user);
        const m = h.ctx.chat[i];
        if (m?.swipes?.length > 1) await h.st.swipeTo(i, int(0, m.swipes.length - 1));
    }],
    ['delete-last', 1, async () => {
        if (h.ctx.chat.length > 4) { await h.st.deleteMessage(h.ctx.chat.length - 1); await h.st.deleteMessage(h.ctx.chat.length - 1); }
    }],
];

const cheats = [
    ['cheat ui-wallet', 1, () => h.cmd('wallet.receive', { owner: 'party', amount: 500 })],
    ['cheat ui-event', 1, () => h.cmd('events.fire', { id: 'x', cue: 'x', once: false, then: [{ command: 'wallet.receive', payload: { owner: 'party', amount: 300 } }] })],
    ['cheat ui-capture', 1, () => h.cmd('capture.item', { op: '+', kind: 'item', name: 'Gambeson', text: '', labels: {} })],
    ['cheat ui-xp', 1, () => h.cmd('party.grantXp', { amount: 200 })],
    ['cheat story-coin', 1, () => h.send('A chest!', reply('Gold spills out.', ['+ coin 25000 | from: a chest']))],
    ['cheat story-gear', 1, () => h.send('A blade!', reply('It hums.', [`+ item Rune Blade ${int(1, 99)} | note: legendary sword ATK +900`]))],
    ['cheat quest-label', 1, async () => {
        const name = `Rat Bounty ${int(1, 9999)}`;
        await h.send(`I take the ${name}.`, reply('A bounty.', [`+ quest ${name} — rats | goal: Kill 1 cellar rat | reward: 90000 marks | xp: 40000`]));
        await h.send('We hunt.', reply('A rat!', ['! encounter 1 Cellar Rat — ahead | tier: trivial']));
        const offer = h.q('combat.offers').at(-1);
        if (offer && (await h.cmd('combat.start', { offer: offer.id })).ok) { await fightOut(); await h.cmd('combat.end'); }
        await h.cmd('quest.finish', { key: name });
    }],
    ['cheat delete-sale', 1, async () => {
        // Sell on a reply, let a later reply touch the wallet, then delete the sale's reply.
        await h.send('To market.', 'The market.');
        const at = h.ctx.chat.length - 1;
        const loose = items().filter(i => !i.equipped && i.kind !== 'money' && i.kind !== 'quest');
        if (!loose.length) return;
        const it = loose[0];
        const m0 = measure(h.head());
        const sold = await h.cmd('trade.sell', { stack: it.stack, qty: it.qty });
        if (!sold.ok) return;
        await h.send('On.', reply('A coin on the road.', ['+ coin 1']));
        await h.st.deleteMessage(at);
        await h.st.deleteMessage(at - 1);
        const m1 = measure(h.head());
        if (m1.coin !== m0.coin + 1 || m1.goods !== m0.goods) {
            flags.push({ step: steps.length + 1, action: 'cheat delete-sale', kind: 'timeline', text: `deleting the reply that held a sale (${it.qty} ${it.name} for ${sold.receipt.data.total}) keeps the money and brings the goods back: coin ${m0.coin}→${m1.coin} (want ${m0.coin + 1}), goods ${m0.goods}→${m1.goods} (want ${m0.goods})` });
        }
    }],
    ['cheat sign', 1, () => h.send('We pay the toll.', reply('The toll.', ['+ coin -40 | to: the toll keeper']))],
    ['cheat ghost', 1, async () => { const it = items().find(i => !i.equipped); if (it) await h.cmd('inventory.transfer', { stack: it.stack, to: 'ac_zzzzzzzz', qty: 1 }); }],
];

const table = [...honest, ...(TIMELINE ? timeline : []), ...(CHEATS ? cheats : [])];
const weight = table.reduce((s, [, w]) => s + w, 0);
function choose() {
    let roll = rnd() * weight;
    for (const entry of table) { roll -= entry[1]; if (roll <= 0) return entry; }
    return table.at(-1);
}

// ---------------------------------------------------------------- go
await run('create', () => h.cmd('party.create', { name: 'Wessel', preset: 'fighter' }));
await run('story start', () => h.send('We look around Bluewatch.', reply('Salt and tar.', ['~ place Bluewatch Village | kind: settlement'])));
for (let n = 0; n < STEPS; n += 1) {
    const [name, , fn] = choose();
    const isTimeline = timeline.some(([t]) => t === name);
    await run(name, fn, { timeline: isTimeline });
}

// Invariant 1: the chat rebuilt cold gives the live state.
const cold = await rebuilt(h);
const live = h.head();
if (JSON.stringify(cold) !== JSON.stringify(live)) {
    const a = measure(cold);
    const b = measure(live);
    flags.push({ step: 'end', action: 'rebuild', kind: 'rebuild', text: `cold rebuild differs from live: coin ${a.coin}/${b.coin}, goods ${a.goods}/${b.goods}, xp ${a.xp}/${b.xp}` });
}
const end = measure(live);
h.close();

const byKind = {};
for (const f of flags) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
const out = { seed: SEED, steps: steps.length, cheats: CHEATS, timeline: TIMELINE, storyCap: STORY_CAP, end: { coin: end.coin, goods: end.goods, xp: end.xp }, counts, byKind, flags };
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...out, steps }, null, 2));
console.log(`seed ${SEED}: ${steps.length} steps (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`end of session: coin ${end.coin}, goods ${end.goods}, lifetime xp ${end.xp}`);
console.log(`flags: ${flags.length} ${JSON.stringify(byKind)}`);
for (const f of flags.slice(0, 60)) console.log(`  #${f.step} ${f.action} [${f.kind}] ${f.text}`);
if (flags.length > 60) console.log(`  … ${flags.length - 60} more`);
process.exitCode = flags.some(f => !String(f.kind).startsWith('info:')) ? 1 : 0;
