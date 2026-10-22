// c1 (cell a1): seeded chaos over the chat timeline on the testkit with all four modules, every capture
// kind on v2 and the UI commands of all four modules. Adapted from harness/break/b2-timeline/fuzz.mjs.
import fsSync from 'node:fs';
// usage: B2ROOT=<clones> node fuzz.mjs <seedFrom> <seedTo> <steps> [--stop] [--only=op,op] [--out=file.json]
//   env PACK=0|1|mix (Ersveil pack; mix = odd seeds), ORACLE=1 (also the strict oracle per carrier),
//   ATEVERY=n (fresh.at(i) == live.at(i) for every carrier every n steps, default 5), SWALLOW=1 (ST-swallowed saves).
// After every step: #1 fresh store (runtime's validate + scratch) head == live head, #1b per carrier,
// #2 recorded states, #7 saved chat == live when clean.
import { allHost, persist, storeMod, fakeSt, seededMod } from './lib/host.mjs';
const B = process.env.B2ROOT ?? '/home/user/cell/a1';
const OUT = (process.argv.find(a => a.startsWith('--out=')) ?? '').slice(6);
const ORACLE = process.env.ORACLE === '1';
const AT_EVERY = Number(process.env.ATEVERY ?? 5);
const CMD_STATS = {};
const FAST = process.env.FAST === '1';   // fewer real-time waits (saveFail/slowRace rarer)
const OPCOUNT = {};
const { rebuildAt } = await import(`${B}/Story_block/tests/v2/qa/helpers/oracle.js`);
const { readRecord } = persist;
const { createStore } = storeMod;
const { aiMessage } = fakeSt;
const { prng, seedCrypto } = seededMod;

const args = process.argv.slice(2);
const SEED_FROM = Number(args[0] ?? 1), SEED_TO = Number(args[1] ?? SEED_FROM), STEPS = Number(args[2] ?? 200);
const STOP = args.includes('--stop');
const ONLY = (args.find(a => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const VERBOSE = args.includes('-v');

const plain = v => (v === null || v === undefined ? v ?? null : JSON.parse(JSON.stringify(v)));
const J = v => JSON.stringify(plain(v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isCarrier = m => m && typeof m === 'object' && !m.is_user;
const carriers = chat => chat.map((m, i) => (isCarrier(m) ? i : -1)).filter(i => i >= 0);

const ITEMS = ['Rope', 'Lamp', 'Iron Key', 'Apple', 'Torch', 'Minor Healing Draught', 'Iron Sword', 'Crag Wolf Pelt', 'Coarse Salt', 'Burlap Sack', 'Healing Salve', 'Common Antidote', 'Bandage', 'Spear', 'Iron Cap', 'Gambeson', 'Lamp Oil', 'Crag Wolf Fang', 'Ração Ölü', '<b>Bold</b>'];
const PLACES = ['Bluewatch Village', 'The Weir', 'Old Mill', 'Auvoth', 'Gate Forge', 'East Bluff', 'North Culvert'];
const PEOPLE = ['Fenna', 'Kael', 'Lyra', 'Marrit'];
const SKILLS = ['athletics', 'stealth', 'persuasion', 'STR', 'perception', 'lockpicking'];
const LONG = n => 'x'.repeat(n);
const KIND_COUNT = {};
function line(r, big) {
    const pick = r.int(0, 62);
    KIND_COUNT[pick] = (KIND_COUNT[pick] ?? 0) + 1;
    switch (pick) {
        case 0: case 1: return `+ item ${r.pick(ITEMS)} | qty: ${r.int(1, 3)}${big ? ` | note: ${LONG(r.int(100, 400))}` : ''}`;
        case 2: return `- item ${r.pick(ITEMS)} | qty: ${r.int(1, 2)}`;
        case 3: return `+ coin ${r.int(1, 30)} | from: ${r.pick(PEOPLE)}`;
        case 4: return `- coin ${r.int(1, 12)} | to: ${r.pick(PEOPLE)}`;
        case 5: return `~ place ${r.pick(PLACES)} | kind: ${r.pick(['settlement', 'wild', 'dungeon'])}${r.chance(0.3) ? ` | region: north` : ''}${r.chance(0.2) ? ` | with: ${r.pick(PEOPLE)}` : ''}`;
        case 6: return `${r.pick(['+', '-'])} present ${r.pick(PEOPLE)}`;
        case 7: return `+ quest Find ${r.pick(ITEMS)} — a job | giver: ${r.pick(PEOPLE)} | goal: get it | reward: ${r.int(5, 60)} coin${r.chance(0.4) ? ` | ${r.pick(['rank: F', 'rank: E', 'difficulty: hard', 'difficulty: nightmare', 'rank: Z'])}` : ''}${r.chance(0.3) ? ' | due: tomorrow, 18:00' : ''}`;
        case 8: return `+ hook Rumor ${r.int(1, 9)} — an open thread${r.chance(0.5) ? ` | giver: ${r.pick(PEOPLE)} | reward: ${r.int(5, 50)} coin` : ''}`;
        case 9: return `! time +${r.int(1, 5)}${r.pick(['h', 'h', 'd', 'm'])}`;
        case 10: return `~ wound Ren — a fall | harm: ${r.pick(['scratch', 'wound', 'severe', 'grievous'])}`;
        case 11: return `+ faction Guild ${r.int(1, 4)} — merchants | stance: ${r.pick(['neutral', 'hostile', 'friendly'])}${r.chance(0.3) ? ' | area: north' : ''}`;
        case 12: return `+ landmark ${r.pick(['Old Tower', 'Ruined Gate', 'Moss Cave'])} | region: north | kind: ruin${r.chance(0.2) ? ' | plane: underground' : ''}`;
        case 13: return `+ world Storm ${r.int(1, 3)} — a storm comes | state: looming`;
        case 14: return `? check ${r.pick(SKILLS)} — climb | dc: ${r.pick(['easy', 'normal', 'hard', String(r.int(5, 25))])}${r.chance(0.4) ? ` | roll: ${r.int(1, 2)}` : ''}${r.chance(0.4) ? ` | result: ${r.pick(['success', 'fail'])}` : ''} | who: ${r.pick(['Ren', 'Ren', 'Fenna'])}`;
        case 15: return `! rest ${r.pick(['short', 'long'])} — by the fire`;
        case 16: return `~ wound ${r.pick(['Ren', 'Fenna'])} — ${r.pick(['poisoned', 'cure poisoned', 'bleeding', 'cure bleeding', 'a rest | heal: wound', 'a salve | heal: scratch'])}`;
        case 17: return `! use ${r.pick(['Minor Healing Draught', 'Healing Salve', 'Bandage', 'Common Antidote', 'Torch'])}${r.chance(0.6) ? ` | on: ${r.pick(['Ren', 'Fenna'])}` : ''}${r.chance(0.3) ? ` | qty: ${r.int(1, 2)}` : ''}`;
        case 18: return `+ join ${r.pick(['Fenna', 'Kael'])} — a ranger | level: ${r.int(1, 4)} | role: ${r.pick(['scout', 'healer', 'guard'])}`;
        case 19: return `- leave ${r.pick(['Fenna', 'Kael'])} — goes home`;
        case 20: return `+ skill ${r.pick(['Ren', 'Fenna'])} — ${r.pick(['Power Strike', 'Quick Shot', 'Mend'])}: does a thing | taught by: ${r.pick(PEOPLE)}`;
        case 21: return r.chance(0.6) ? `! market ${r.pick(PLACES)} — salt is short | until: ${r.pick(['tomorrow', '3 days'])}` : `~ market ${r.pick(PLACES)} — supplies back`;
        case 22: return `~ npc ${r.pick(PEOPLE)} | trust: ${r.pick(['+', '-'])}${r.int(1, 12)}${r.chance(0.5) ? ` | affection: ${r.pick(['+', '-'])}${r.int(1, 9)}` : ''}${r.chance(0.2) ? ` | tension: +${r.int(1, 30)}` : ''}`;
        case 23: return `~ quest Find ${r.pick(ITEMS)} | ${r.pick(['progress: halfway', 'met: yes', 'met: no'])}`;
        case 24: return `- quest Find ${r.pick(ITEMS)} — ${r.pick(['turned in', 'failed', 'abandoned'])}`;
        case 25: return `+ agenda ${r.pick(PEOPLE)} — plots | now: ${r.pick(PLACES)} | then: moves | on: tomorrow, 09:00`;
        case 26: return `+ event Fair ${r.int(1, 3)} — a fair | then: ends | on: tomorrow, 12:00`;
        case 27: return `+ clock Doom ${r.int(1, 3)} — bad things | due: tomorrow, 18:00 | shown: ${r.pick(['none', 'sign', 'warning'])}`;
        case 28: return `+ beat Twist ${r.int(1, 3)} — a turn | on: tomorrow, 10:00 | reach: changes things`;
        case 29: return `+ secret Hidden ${r.int(1, 3)} — not yet`;
        case 30: return `~ time ${r.pick(['tomorrow, 08:00', 'day 3, 14:00', '12:30', 'next week'])}`;
        case 31: return `${r.pick(['+', '-'])} route ${r.pick(PLACES)} — ${r.pick(PLACES)} | ${r.pick(['hours: 2', 'days: 1.5', 'hours: 0'])} | kind: ${r.pick(['road', 'river', 'trail'])}`;
        case 32: return `~ world Storm ${r.int(1, 3)} — it worsens`;
        case 33: return `- world Storm ${r.int(1, 3)} — it passed`;
        case 34: return `~ faction Guild ${r.int(1, 4)} | stance: hostile`;
        case 35: return `- faction Guild ${r.int(1, 4)}`;
        case 36: return `~ item ${r.pick(ITEMS)} | note: ${r.pick(['dented', 'wet', 'glowing'])}`;
        case 37: return `+ coin ${r.int(1, 99999)} | from: ${r.pick(PEOPLE)}`;
        case 38: return `+ item ${r.pick(ITEMS)} | qty: ${r.pick([-3, 0, 999, 1.5, 'lots'])}`;
        case 39: return `~ npc ${r.pick(PEOPLE)} | trust: ${r.pick(['+999', '-999', 'NaN', '+0', '50'])}`;
        case 40: return `! encounter ${r.int(1, 2)} ${r.pick(['Rat', 'Wolf'])} — near | tier: ${r.pick(['trivial', 'weak'])} | stakes: normal`;
        case 41: return `+ present ${r.pick(['Ann', 'Bo', 'Cy', '{{user}}', '  '])}`;
        case 42: return `~ place ${r.pick(['Gate Forge', 'Watch Granary', 'Bluewatch Village'])} | kind: settlement | region: River Confederacy`;
        case 43: return `+ item ${r.pick(['Crag Wolf Pelt', 'Coarse Salt', 'Burlap Sack'])} | qty: ${r.int(1, 4)}`;
        case 44: return `+ quest ${r.pick(['Granary Rats', 'East Bluff Wolves', 'Culvert Leeches'])} — a guild job | giver: Guild | goal: clear it | reward: ${r.int(10, 400)} coin`;
        case 45: return `? check ${r.pick(SKILLS)} — another try | dc: normal | who: Ren`;
        case 46: return `! use ${r.pick(ITEMS)} | by: ${r.pick(['Ren', 'Fenna'])} | on: ${r.pick(['Ren', 'Fenna', 'Kael'])}`;
        // pass 2 (Wave B / party wave C / NSD stages)
        case 47: case 48: return `? loot ${Array.from({ length: r.int(1, 4) }, () => `${r.pick(ITEMS)}${r.chance(0.3) ? ` x${r.int(2, 5)}` : ''}`).join(', ')} — ${r.pick(['on the floor', 'in a chest', 'by the body'])}`;
        case 49: case 50: return `+ effect ${r.pick(['Keen Sight', 'Weakness', 'Iron Skin', 'Shaken', 'Haste'])} — ${r.pick(['sharper eyes', 'tired', 'tough'])} | on: ${r.pick(['perception', 'stealth', 'DEX', 'STR', 'attack', 'defence', 'all', 'nonsense'])} | for: ${r.pick(['2h', '30m', '1 day', '3 replies', '1 reply', '9999h', 'forever'])} | who: ${r.pick(['Ren', 'Fenna', 'party', 'Nobody'])} | kind: ${r.pick(['buff', 'debuff'])}${r.chance(0.2) ? ' | strength: major' : ''}`;
        case 51: return `- effect ${r.pick(['Keen Sight', 'Weakness', 'Iron Skin', 'Shaken', 'Haste'])} | who: ${r.pick(['Ren', 'Fenna'])}`;
        case 52: return `~ item ${r.pick(['Cane-Blade', 'Patched Oilcloth Coat', 'Spear', 'Iron Cap', 'Iron Sword', 'Gambeson'])} | wear: ${r.pick(['scuff', 'tear', 'ruin', 'shatter'])}`;
        case 53: return `! encounter ${r.int(1, 3)} ${r.pick(['Rat', 'Wolf', 'Bandit'])} — ahead | rank: ${r.pick(['F', 'E', 'D', 'C', 'S', 'Z'])} | stakes: normal`;
        case 54: return `+ join ${r.pick(['Fenna', 'Kael', 'Lyra'])} — ${r.pick(['a ranger', 'a healer', 'a sellsword'])} | level: ${r.pick([1, 2, 5, 40, 'x'])} | role: ${r.pick(['scout', 'healer', 'guard', 'tank', 'mage'])}`;
        case 55: return `~ npc ${r.pick(PEOPLE)} | bond: ${r.pick(['+', '-'])}${r.int(1, 20)}${r.chance(0.5) ? ` | trust: +${r.int(1, 15)}` : ''}`;
        case 56: return `~ npc ${r.pick(PEOPLE)} | stage: Trusted`;
        case 57: return `! time +${r.pick(['30m', '1h', '3h', '1d'])}`;
        case 58: return `+ item ${r.pick(['Gambeson', 'Iron Cap', 'Spear', 'Hatchet', 'Iron-bound Buckler', 'Fur-lined Cloak'])}${r.chance(0.3) ? ` | qty: ${r.int(2, 6)}` : ''}`;
        case 59: return `+ item ${r.pick(['Hemp Rope', 'Bedroll', 'Backpack', 'Wool Blanket', 'Trail Rations'])} | qty: ${r.int(5, 20)}`;
        case 60: return `- item ${r.pick(['rope', 'the hemp rope', 'Rope, hemp', 'a torch', 'two torches', 'Torches'])}`;
        case 61: return `! use ${r.pick(['Minor Healing Draught', 'Mana Draught', 'Common Antidote', 'Leech-salt Pouch'])} | on: ${r.pick(['Ren', 'Fenna'])}`;
        default: return `+ item ${r.pick(ITEMS)}`;
    }
}
function replyText(r, step, big = false) {
    const story = `Reply ${step}: the story goes on.`;
    if (r.chance(0.15)) return story;
    const lines = Array.from({ length: r.int(1, 6) }, () => line(r, big));
    return `${story}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
}

async function runSeed(seed) {
    const restore = seedCrypto(seed);
    const r = prng(seed);
    const origWarn = console.warn, origErr = console.error;
    const consoleErrors = [];
    console.warn = () => {};
    console.error = (...a) => consoleErrors.push(a.map(String).join(' '));
    const usePack = process.env.PACK === '1' || (process.env.PACK === 'mix' && seed % 2 === 1);
    const useNsd = process.env.NSDSET === '1' || (process.env.NSDSET !== '0' && seed % 3 !== 0);
    const h = await allHost({ pack: usePack, nsdSettings: useNsd });
    const { st, ctx, store, sdk, turn } = h;
    const validate = typeof h.registry.validator === 'function' ? (state, names) => names.flatMap(name => {
        const fn = h.registry.validator(name);
        if (typeof fn !== 'function') return [];
        try { const e = fn(state?.domains?.[name], state); return Array.isArray(e) ? e.map(String) : []; } catch (error) { return [`The ${name} check failed: ${error?.message ?? error}`]; }
    }) : null;
    const mkStore = chatFn => createStore({ chat: chatFn, save: async () => {}, ...(validate ? { validate } : {}), ...(typeof h.registry.scratch === 'function' ? { scratch: name => h.registry.scratch(name) } : {}) });
    const log = [];
    const violations = [];
    let uid = 0;
    const tag = m => { if (m && m.__fz === undefined) m.__fz = ++uid; return m?.__fz; };
    // recorded[`${fz}:${swipe}`] = state JSON when that carrier/swipe last was the head (#2)
    let recorded = new Map();
    const key = m => `${tag(m)}:${Number.isInteger(m?.swipe_id) ? m.swipe_id : 0}`;
    const files = new Map();       // chatId -> the chat as last written to disk
    let saveMode = 'ok';           // ok | fail | slow | swallow
    let saveDelay = 0;
    const realSave = ctx.saveChat;
    ctx.saveChat = async () => {
        if (saveMode === 'fail') { saveMode = 'ok'; throw new Error('fake failure'); }
        if (saveMode === 'swallow') { saveMode = 'ok'; return; }   // ST saveChatConditional: error swallowed
        const snap = JSON.parse(JSON.stringify(ctx.chat));   // what reaches the disk is JSON
        const id = ctx.chatId;
        if (saveDelay) await sleep(saveDelay);
        st.saves.push(snap);
        files.set(id, snap);
    };
    void realSave;

    const fail = (what, detail = '') => {
        const v = { seed, step: log.length, op: log.at(-1), what, detail: String(detail).slice(0, 600) };
        violations.push(v);
        if (VERBOSE) origErr('VIOLATION', JSON.stringify(v));
    };

    const head = () => { try { return store.head(); } catch (e) { fail('head() threw', e.message); return null; } };

    function check(label, { expectRecorded = true, skip = new Set(), full = true } = {}) {
        const chat = ctx.chat;
        const idx = carriers(chat);
        // #1 oracle per carrier (strict; known to lack rebase/scratch: opt-in)
        if (ORACLE) for (const i of idx) {
            let live;
            try { live = store.at(i); } catch (e) { fail(`at(${i}) threw`, e.message); continue; }
            const want = rebuildAt(chat, i).state;
            if (J(live) !== J(want)) fail(`#1 at(${i}) != strict rebuild`, `${label}`);
        }
        const snap = JSON.parse(JSON.stringify(chat));   // a chat file is JSON
        const fresh = mkStore(() => snap);
        // #1b every carrier: a cold rebuild's state at that point == the live store's
        if (AT_EVERY > 0 && (log.length % AT_EVERY === 0)) {
            for (const i of idx) {
                let live, cold;
                try { live = J(store.at(i)); } catch (e) { fail(`at(${i}) threw`, e.message); continue; }
                try { cold = J(fresh.at(i)); } catch (e) { fail(`fresh at(${i}) threw`, e.message); continue; }
                if (live !== cold) { fail('#1b fresh.at(i) != live.at(i)', `${label} i=${i}/${chat.length}: ${diff(live, cold)}`); break; }
            }
        }
        if (J(fresh.head()) !== J(head())) {
            fail('#1 fresh store head != live head', `${label}: live->fresh ${diff(J(head()), J(fresh.head()))} | fresh problems ${J(fresh.problems())} live problems ${J(store.problems())}`);
            if (process.env.DUMPFRESH && !globalThis.__dumped) { globalThis.__dumped = 1; fsSync.writeFileSync('dumps/fresh.json', JSON.stringify({ chat, live: head(), fresh: fresh.head(), log }, null, 1)); }
        }
        // #2 recorded
        if (expectRecorded) {
            // every recorded point after a restoring op (and every 10th step); else the last three carriers
            for (const i of (full || log.length % 10 === 0 ? idx : idx.slice(-3))) {
                const k = key(chat[i]);
                if (!recorded.has(k) || skip.has(k)) continue;
                const live = J(store.at(i));
                if (live !== recorded.get(k)) {
                    fail(`#2 carrier ${i} (${k}) differs from its recorded state`, `${label}: ${diff(recorded.get(k), live)}`);
                    recorded.set(k, live);
                }
            }
        }
        for (const i of idx) { const k = key(chat[i]); if (skip.has(k)) recorded.set(k, J(store.at(i))); }
        // record current head
        const hi = store.headIndex();
        if (hi >= 0) recorded.set(key(chat[hi]), J(head()));
        // #7: clean store => last save holds the live head
        if (!store.dirty() && files.has(ctx.chatId)) {
            const saved = files.get(ctx.chatId);
            const savedSnap = structuredClone(saved);
            const savedHead = mkStore(() => savedSnap).head();
            if (J(savedHead) !== J(head())) fail('#7 clean store but saved head != live head', `${label}: ${diff(J(head()), J(savedHead))}`);
        }
    }
    let lastSavedChatId = ctx.chatId;
    // loading a chat = reading its file
    const origLoad = st.loadChat;
    // SillyTavern's ensureSwipes on load: a missing swipe_info entry is backfilled with an empty extra
    const ensureSwipes = chat => { for (const m of chat) { if (!m || m.is_user || !Array.isArray(m.swipes)) continue; if (!Array.isArray(m.swipe_info)) m.swipe_info = []; for (let i = 0; i < m.swipes.length; i++) if (!m.swipe_info[i] || typeof m.swipe_info[i] !== 'object') m.swipe_info[i] = { send_date: '', extra: {} }; } return chat; };
    st.loadChat = async (chat, id = ctx.chatId) => { files.set(id, structuredClone(chat)); return origLoad(ensureSwipes(structuredClone(chat)), id); };
    const stSave = () => ctx.saveChat().catch(() => {});   // SillyTavern's own save after a delete/edit/swipe
    function diff(a, b) {
        const A = JSON.parse(a ?? 'null'), Bv = JSON.parse(b ?? 'null');
        const out = [];
        const walk = (x, y, p) => {
            if (out.length > 4) return;
            if (JSON.stringify(x) === JSON.stringify(y)) return;
            if (x && y && typeof x === 'object' && typeof y === 'object') {
                for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}/${k}`);
            } else out.push(`${p}: ${JSON.stringify(x)?.slice(0, 80)} -> ${JSON.stringify(y)?.slice(0, 80)}`);
        };
        walk(A, Bv, '');
        return out.join('; ');
    }
    // forget recorded states of carriers at or after index (a middle delete / edit changes them legitimately)
    function forgetFrom(index) {
        const keep = new Map();
        for (const [k, v] of recorded) keep.set(k, v);
        for (let i = index; i < ctx.chat.length; i++) {
            const m = ctx.chat[i];
            if (!isCarrier(m)) continue;
            for (const s of [...keep.keys()]) if (s.startsWith(`${tag(m)}:`)) keep.delete(s);
        }
        recorded = keep;
    }
    // mark identities of every message (cloned chats keep __fz)
    const tagAll = () => ctx.chat.forEach(tag);

    const lastIsCarrier = () => ctx.chat.length > 0 && isCarrier(ctx.chat.at(-1));
    const wrap = async (name, fn) => {
        log.push(name);
        try { return await fn(); } catch (e) { fail(`threw in ${name}`, e?.stack ?? e); return null; }
    };

    // the hero first (RB canGenerate)
    await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    await sdk.command('scene.place', { name: 'Bluewatch Village', kind: 'settlement' });
    await store.flush();
    tagAll();
    check('start');

    const OPS = {
        async send(step) { await h.send(`User ${step}.`, replyText(r, step, r.chance(0.15))); await stSave(); },   // ST saves after each generation
        async group(step) {     // a second carrier in a row (group chat: another character answers)
            await st.generate('normal', { reply: replyText(r, step) });
            const m = ctx.chat.at(-1); if (m && !m.is_user) m.name = r.pick(['Fenna', 'Kael']);
        },
        async ui() {
            // UI commands of all four modules between replies, payloads from the live head.
            const hd = head();
            const D = hd?.domains ?? {};
            const stacks = Object.values(D.inventory?.stacks ?? {});
            const defs = D.inventory?.defs ?? {};
            const party = D.party ?? {};
            const actors = Object.keys(party.actors ?? {});
            const offers = Object.keys(party.offers ?? {});
            const threads = Object.values(D.director?.threads ?? {});
            const orders = Object.keys(D.trade?.orders ?? {});
            const st0 = stacks.length ? r.pick(stacks) : null;
            const who = r.pick(['Ann', 'Bo', 'Cy']);
            const choices = [['scene.present', { add: who }], ['scene.present', { remove: who }],
                ['scene.place', { name: r.pick(PLACES), kind: 'settlement' }],
                ['party.rest', { kind: r.pick(['short', 'long']) }],
                ['check.resolve', { skill: r.pick(SKILLS), dc: r.pick(['easy', 'hard', 12]) }],
                ['npc.adjust', { name: r.pick(PEOPLE), meters: { trust: r.int(-5, 5) } }],
                ['npc.set', { name: r.pick(PEOPLE), meters: { affection: r.int(0, 50) } }]];
            if (st0) {
                const def = defs[st0.def];
                choices.push(['inventory.drop', { stack: st0.id, qty: 1 }], ['inventory.split', { stack: st0.id, qty: 1 }],
                    ['inventory.transfer', { stack: st0.id, to: actors.length > 1 ? r.pick(actors) : 'party' }],
                    ['trade.sell', { stack: st0.id, qty: 1 }], ['item.use', { stack: st0.id }]);
                if (def?.slot) choices.push(st0.equipped ? ['item.unequip', { stack: st0.id }] : ['item.equip', { stack: st0.id }],
                    st0.equipped ? ['inventory.unequip', { stack: st0.id }] : ['inventory.equip', { stack: st0.id }]);
                if (actors.length > 1) choices.push(['item.give', { stack: st0.id, to: r.pick(actors) }]);
                const mats = stacks.filter(x => /Pelt|Salt|Sack|Fang|Lamp Oil/.test(defs[x.def]?.name ?? ''));
                if (mats.length) choices.push(['craft.commission', { piece: r.pick(['Wolf-pelt Mantle', 'Fang Charm', 'Salt Pouch']), materials: [{ stack: r.pick(mats).id, qty: r.int(1, 3) }], crafter: r.pick(['Gate Forge', 'smith', 'apothecary', 'tanner']) }]);
            }
            for (const o of orders) choices.push(['craft.collect', { order: o }]);
            // Wave B: Equip on…, loot picks, wear/repair (module-only: refused from a button)
            const loot = D.inventory?.loot ?? {};
            for (const [sid, offer] of Object.entries(loot).slice(-2)) {
                const n = Object.keys(offer?.items ?? {}).length || 2;
                choices.push(['inventory.lootTake', { sid, pick: [...new Set(Array.from({ length: r.int(1, 3) }, () => r.int(0, n)))] }], ['inventory.lootTake', { sid, pick: [0] }]);
            }
            if (st0) {
                choices.push(['inventory.equipOn', { stack: st0.id, actor: actors.length ? r.pick(actors) : 'party' }]);
                const gear = stacks.filter(x => defs[x.def]?.slot);
                if (gear.length) { const g = r.pick(gear); choices.push(['inventory.equipOn', { stack: g.id, actor: actors.length ? r.pick(actors) : 'x' }], ['inventory.equipOn', { stack: g.id, actor: actors.length ? r.pick(actors) : 'x' }], [r.pick(['inventory.wear', 'inventory.repair']), { stack: g.id, amount: r.int(1, 30) }]); }
                const usable = stacks.filter(x => defs[x.def]?.kind === 'consumable');
                if (usable.length) choices.push(['item.use', { stack: r.pick(usable).id, target: actors.length ? r.pick(actors) : undefined }]);
            }
            try { const ts = sdk.query('party.toSpend', {}); for (const p of ts?.people ?? []) choices.push(['party.spend', { actor: p.id, points: { [r.pick(['STR', 'AGI', 'VIT', 'DEX'])]: 1 } }]); } catch { /* none */ }
            for (const ef of Object.keys(D.effects?.active ?? {}).slice(0, 2)) choices.push(['party.endEffect', { effect: ef }]);
            for (const o of offers) choices.push([r.pick(['party.acceptOffer', 'party.dismissOffer']), { offer: o }]);
            if (actors.length) {
                const a = r.pick(actors);
                if ((party.actors[a]?.points ?? 0) > 0) choices.push(['party.spend', { actor: a, points: { [r.pick(['STR', 'AGI', 'VIT'])]: 1 } }]);
                choices.push(['party.learnSkill', { actor: a, name: r.pick(['Power Strike', 'Quick Shot', 'Mend']) }]);
                const comp = actors.find(x => x !== party.pc);
                if (comp && st0) choices.push(['inventory.transfer', { stack: st0.id, to: comp }], ['party.heal', { actor: comp, hp: r.int(1, 5) }]);
                if (actors.length > 1) choices.push(['party.removeCompanion', { actor: actors.find(x => x !== party.pc) }]);
            }
            for (const t of threads.filter(x => x.kind === 'quest' && !x.ended).slice(0, 6)) {
                if (t.offer && !t.taken) choices.push([r.pick(['quest.take', 'quest.take', 'quest.decline']), { id: t.id }]);
                else choices.push([r.pick(['quest.finish', 'quest.finish', 'quest.abandon']), { id: t.id }]);
            }
            try {
                const m = sdk.query('trade.market');
                if (m?.open) {
                    const stock = sdk.query('trade.stock', { kind: r.pick(['Watch Stores', 'general', 'smith', 'apothecary']) });
                    const item = stock?.items?.length ? r.pick(stock.items) : null;
                    if (item) choices.push(['trade.buy', { shop: stock.shop, def: item.def.id, qty: r.int(1, 2) }]);
                }
            } catch { /* no market */ }
            const [t, p] = r.pick(choices);
            const res = await sdk.command(t, p);
            const c = (CMD_STATS[t] ??= { ok: 0, no: 0, codes: {} });
            if (res?.ok) c.ok++; else { c.no++; c.codes[res?.code ?? '?'] = (c.codes[res?.code ?? '?'] ?? 0) + 1; (c.msg ??= {})[res?.code ?? '?'] ??= String(res?.message ?? '').slice(0, 140); }
            log[log.length - 1] += `:${t}${res?.ok ? '' : '!'}`;
            if (r.chance(FAST ? 0.03 : 0.15)) await sleep(450);       // let the scheduled save fire
        },
        async swipe(step) { if (lastIsCarrier() && ctx.chat.length > 1) { await h.swipe(replyText(r, step)); await stSave(); } },
        async stSwipe(step) {      // SillyTavern's own new-swipe path (non-streaming saveReply)
            if (!lastIsCarrier() || ctx.chat.length < 2) return;
            const last = ctx.chat.length - 1, m = ctx.chat[last];
            // syncMesToSwipe
            if (Array.isArray(m.swipe_info) && m.swipe_info[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
            m.swipe_id = m.swipes.length;
            delete m.extra.memory; delete m.extra.display_text;
            await st.eventSource.emit('message_swiped', last);
            await turn.interceptor(structuredClone(ctx.chat), 8192, () => {}, 'swipe');
            await turn.onPromptReady({ chat: [{ role: 'system', content: 'x' }], dryRun: false });
            m.swipes.length++;
            m.mes = replyText(r, step);
            await st.eventSource.emit('message_received', last, 'swipe');
            m.swipes[m.swipe_id] = m.mes;
            m.swipe_info[m.swipe_id] = { send_date: '', extra: structuredClone(m.extra) };
            await st.eventSource.emit('generation_ended', ctx.chat.length);
            await stSave();
        },
        async swipeTo() {
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            let s = r.int(0, m.swipes.length - 1);
            if (s === m.swipe_id) s = (s + 1) % m.swipes.length;
            if (m.swipe_info?.[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra); // syncMesToSwipe
            await st.swipeTo(i, s);
            await stSave();
        },
        async swipeDelete() {      // ST deleteSwipe: splice swipes + swipe_info, show a neighbour
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            const del = m.swipe_id;
            const fz = tag(m);
            const moved = new Map();
            for (const [k, v] of recorded) {
                const [a, b] = k.split(':').map(Number);
                if (a !== fz) { moved.set(k, v); continue; }
                if (b < del) moved.set(k, v); else if (b > del) moved.set(`${a}:${b - 1}`, v);
            }
            recorded = moved;
            m.swipes.splice(del, 1);
            m.swipe_info.splice(del, 1);
            const now = Math.max(0, Math.min(del, m.swipes.length - 1) - (r.chance(0.5) ? 1 : 0));
            m.swipe_id = now;
            m.mes = m.swipes[now];
            m.extra = structuredClone(m.swipe_info[now]?.extra ?? {});
            await st.eventSource.emit('message_swipe_deleted', { messageId: i, swipeId: del, newSwipeId: now });
            await stSave();
        },
        async regenerate(step) { if (ctx.chat.length > 1) { await h.regenerate(replyText(r, step)); await stSave(); } },
        async cont(step) { if (lastIsCarrier() && ctx.chat.length > 1) await h.cont(r.chance(0.5) ? `\nmore\n<Changes>\n${line(r)}\n</Changes>` : ' more.'); },
        async deleteLast() { if (ctx.chat.length > 1) { await st.deleteMessage(ctx.chat.length - 1); await stSave(); } },
        async deleteMiddle() {
            if (ctx.chat.length < 4) return;
            const i = r.int(1, ctx.chat.length - 2);
            forgetFrom(i);
            await st.deleteMessage(i);
            await stSave();
            return 'nocheck2';
        },
        async deleteMany() {      // ST delete mode: from a message to the end
            if (ctx.chat.length < 3) return;
            const from = r.int(1, ctx.chat.length - 1);
            ctx.chat.splice(from);
            await st.eventSource.emit('message_deleted', ctx.chat.length);
            await stSave();
        },
        async editReply() {
            const idx = carriers(ctx.chat).filter(i => i > 0);
            if (!idx.length) return;
            const i = r.pick(idx);
            await st.editMessage(i, `${ctx.chat[i].mes}\n<Changes>\n${line(r)}\n</Changes>`);
            await stSave();
        },
        async editUser() {
            const idx = ctx.chat.map((m, i) => (m.is_user ? i : -1)).filter(i => i >= 0);
            if (idx.length) { await st.editMessage(r.pick(idx), `edited ${r.int(1, 99)} <Changes>\n+ coin 999\n</Changes>`); await stSave(); }
        },
        async branch() {
            const idx = carriers(ctx.chat);
            if (!idx.length) return;
            const i = r.pick(idx);
            const want = J(store.at(i));
            await store.flush().catch(() => {});
            await ctx.branchChat(i);
            tagAll();
            if (J(head()) !== want) fail('#2 branch head != state at branch point', diff(want, J(head())));
            lastSavedChatId = null;
        },
        async rewind() {
            const idx = carriers(ctx.chat).filter(i => (readRecord(ctx.chat[i])?.receipts ?? []).some(x => Number.isInteger(x?.rev) && x.rev >= 1));
            if (!idx.length) return;
            const i = r.pick(idx);
            const recs = readRecord(ctx.chat[i]).receipts.filter(x => Number.isInteger(x?.rev) && x.rev >= 1);   // corrupt receiptsJunk leaves junk
            if (!recs.length) return;
            const rec = r.pick(recs);
            const k = key(ctx.chat[i]);
            // the rev expected after it: rec.rev - 1 inside the record, else the state before this carrier's
            // first block (revs of deleted carriers leave a gap; b2 r2/r3 lost time on this oracle)
            const first = Math.min(...recs.map(x => x.rev));
            const prevC = carriers(ctx.chat).filter(j => j < i).at(-1);
            const cpRev = readRecord(ctx.chat[i])?.checkpoint?.meta?.rev;
            const wantRev = rec.rev > first ? rec.rev - 1 : Number.isInteger(cpRev) ? cpRev : (prevC === undefined ? 0 : store.at(prevC)?.meta?.rev ?? 0);
            const res = await sdk.rewind({ index: i, beforeRev: rec.rev });
            recorded.delete(k);
            tagAll();
            lastSavedChatId = null;
            if (res?.ok) {
                // expected: state before i + the kept ops, i.e. the head's rev is rec.rev - 1
                if (head()?.meta?.rev !== wantRev) fail('#2 rewind head rev != expected', `${head()?.meta?.rev} vs ${wantRev} (beforeRev ${rec.rev}, first ${first})`);
            } else if (res?.code !== 'STALE') {
                fail('rewind refused', J(res));
                if (process.env.DUMP) { const fs = await import('node:fs'); fs.writeFileSync('dump-rewind.json', JSON.stringify({ i, beforeRev: rec.rev, chat: ctx.chat, old: st.chats }, null, 1)); }
            }
        },
        async reload() {
            const saved = files.get(ctx.chatId);
            if (!saved) return;
            const wasDirty = store.dirty();
            const before = J(head());
            await st.loadChat(saved, ctx.chatId);
            tagAll();
            if (!wasDirty && J(head()) !== before) fail('#7 reload from saved != live before reload', diff(before, J(head())));
            return 'nocheck2';
        },
        async newChat() {
            const kind = r.pick(['empty', 'greeting', 'other']);
            lastSavedChatId = null;
            if (kind === 'empty') await st.loadChat([], `empty-${uid}`);
            else if (kind === 'greeting') await st.loadChat([aiMessage('Hello there.', { name: 'Narrator' })], `greet-${uid}`);
            else await st.loadChat([aiMessage('Other chat.'), { name: 'You', is_user: true, mes: 'hi', extra: {} }], `other-${uid}`);
            tagAll();
            await sdk.command('party.create', { name: 'Ren', preset: 'fighter' }).catch(() => null);
        },
        async corrupt() {
            const idx = carriers(ctx.chat).filter(i => readRecord(ctx.chat[i]));
            if (!idx.length) return;
            const i = r.pick(idx);
            const m = ctx.chat[i];
            const rec = m.extra.storySuite;
            const how = r.pick(['v', 'noOps', 'truncOps', 'badOp', 'swipeInfo', 'noCheckpoint', 'emptyCheckpoint', 'narratedJunk', 'spansJunk', 'string',
                'cpRevString', 'cpNoDomains', 'cpCopied', 'nullRecord', 'arrayRecord', 'opsJunk', 'receiptsJunk', 'sidJunk', 'cpDomainJunk']);
            log[log.length - 1] += `:${how}@${i}`;
            if (how === 'v') rec.v = r.pick([1, '2', 3, null]);
            else if (how === 'noOps') delete rec.ops;
            else if (how === 'truncOps') rec.ops = rec.ops.slice(0, Math.floor(rec.ops.length / 2));
            else if (how === 'badOp') rec.ops.push({ op: 'replace', path: '/domains/nope/x', value: 1 });
            else if (how === 'swipeInfo') { m.swipe_info = m.swipe_info?.slice(0, 1) ?? []; m.swipe_id = (m.swipes?.length ?? 1) - 1; }
            else if (how === 'noCheckpoint') delete rec.checkpoint;
            else if (how === 'emptyCheckpoint') { if (rec.checkpoint) rec.checkpoint = {}; }
            else if (how === 'narratedJunk') rec.narrated = [null, 5, { a: 1 }];
            else if (how === 'spansJunk') rec.spans = 'nope';
            else if (how === 'string') m.extra.storySuite = JSON.stringify(rec).slice(0, 50);
            else if (how === 'cpRevString') { if (rec.checkpoint?.meta) rec.checkpoint.meta.rev = String(rec.checkpoint.meta.rev); }
            else if (how === 'cpNoDomains') { if (rec.checkpoint) delete rec.checkpoint.domains; }
            else if (how === 'cpDomainJunk') { if (rec.checkpoint?.domains) rec.checkpoint.domains[r.pick(Object.keys(rec.checkpoint.domains))] = r.pick([null, 5, 'x', []]); }
            else if (how === 'cpCopied') { const other = idx.filter(j => j !== i && readRecord(ctx.chat[j])?.checkpoint); if (other.length) rec.checkpoint = structuredClone(readRecord(ctx.chat[r.pick(other)]).checkpoint); }
            else if (how === 'nullRecord') m.extra.storySuite = null;
            else if (how === 'arrayRecord') m.extra.storySuite = [rec];
            else if (how === 'opsJunk') rec.ops = r.pick(['ops', 5, { a: 1 }, [null, 1, 'x']]);
            else if (how === 'receiptsJunk') rec.receipts = r.pick(['r', [null], [{ rev: 'x' }]]);
            else if (how === 'sidJunk') rec.sid = r.pick([null, 5, '', 'sw_dup']);
            // a hand-edited chat file: it is what is on disk, and the chat is opened from it; the shown swipe's
            // swipe_info copy is edited alike (else a later swipe back brings the undamaged copy: harness noise)
            if (how !== 'swipeInfo' && Array.isArray(m.swipe_info) && m.swipe_info[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
            forgetFrom(i);
            const file = structuredClone(ctx.chat);
            await st.loadChat(file, ctx.chatId);
            tagAll();
            return 'nocheck2';
        },
        async saveFail(step) {
            saveMode = process.env.SWALLOW === '1' ? r.pick(['fail', 'swallow']) : 'fail';
            const mode = saveMode;
            log[log.length - 1] += `:${mode}`;
            await sdk.command('scene.present', { add: `P${step}` });
            const want = J(head());
            await sleep(450);
            if (mode === 'swallow' && !store.dirty()) {
                // the saved file does not hold the command but the store thinks it is saved
                const saved = st.saves.at(-1);
                const sh = saved ? J(mkStore(() => structuredClone(saved)).head()) : null;
                if (sh !== want) fail('#7 a save that did not happen (ST swallows save errors) left the store clean', `saved rev ${JSON.parse(sh ?? 'null')?.meta?.rev} live rev ${head()?.meta?.rev}`);
                // repair the fixture so later #7 checks stay meaningful
                await ctx.saveChat();
            }
            saveMode = 'ok';
            await h.send(`User ${step}.`, replyText(r, step));
        },
        async slowRace(step) {     // a save racing the next generation
            saveDelay = r.int(5, 40);
            await sdk.command('scene.present', { add: `P${step}` });
            await sleep(r.int(380, 420));
            const p = h.send(`User ${step}.`, replyText(r, step));
            if (r.chance(0.5)) await sdk.command('scene.present', { remove: `P${step}` });
            await p;
            await sleep(60);
            saveDelay = 0;
        },
        async bigReply(step) { await h.send(`User ${step}.`, replyText(r, step, true)); await stSave(); },
        async death(step) {
            const res = await h.send(`User ${step}.`, `A wolf pack!\n<Changes>\n! encounter 3 Wolf — circling | tier: deadly | stakes: death\n</Changes>`);
            for (let n = 0; n < 200; n++) {
                const s = sdk.query('combat.session');
                if (!s || s.status !== 'active') break;
                const a = await sdk.command('combat.act', { action: { type: 'auto' } });
                if (!a.ok) break;
            }
            const point = (() => { try { return sdk.query('return.point'); } catch { return null; } })();
            if (point) {
                const RB = await import(`${B}/rpg_battle/src/v2/return/index.js`);
                const out = await RB.returnInTime(sdk);
                tagAll();
                lastSavedChatId = null;
                if (!out.ok) fail('death return failed', J(out));
                else if (sdk.query('combat.session')?.status === 'active') fail('after return the fight is still active');
            }
            void res;
        },
    };
    const WEIGHTS = { send: 20, group: 3, ui: 8, swipe: 7, stSwipe: 5, swipeTo: 8, swipeDelete: 3, regenerate: 5, cont: 4, deleteLast: 5,
        deleteMiddle: 3, deleteMany: 2, editReply: 3, editUser: 2, branch: 2, rewind: 3, reload: 4, newChat: 1, corrupt: 2, saveFail: 2,
        slowRace: 2, bigReply: 3, death: 1 };
    if (process.env.PROFILE === 'cp') Object.assign(WEIGHTS, { send: 30, bigReply: 25, group: 5, deleteMany: 0.2, newChat: 0, corrupt: 0, deleteMiddle: 1, death: 0.5, saveFail: 0.5 });
    if (process.env.PROFILE === 'long') Object.assign(WEIGHTS, { send: 30, bigReply: 8, deleteMany: 0.3, newChat: 0.1, deleteLast: 3, corrupt: 0.5 });
    if (process.env.PROFILE === 'clean') Object.assign(WEIGHTS, { send: 30, bigReply: 6, deleteMany: 0.3, newChat: 0.1, corrupt: 0, ui: 14 });   // no hand-damaged records
    if (FAST) Object.assign(WEIGHTS, { saveFail: 0.4, slowRace: 0.4 });
    const names = Object.keys(WEIGHTS).filter(n => !ONLY.length || ONLY.includes(n));
    const total = names.reduce((s, n) => s + WEIGHTS[n], 0);
    for (let step = 0; step < STEPS; step++) {
        let x = r() * total, op = names[0];
        for (const n of names) { x -= WEIGHTS[n]; if (x < 0) { op = n; break; } }
        // RB holds every generation back without a hero (a rewind before party.create takes it away): make one again
        if (ctx.chat.length && !head()?.domains?.party?.pc) { await sdk.command('party.create', { name: 'Ren', preset: 'fighter' }).catch(() => null); OPCOUNT.heroAgain = (OPCOUNT.heroAgain ?? 0) + 1; await store.flush().catch(() => {}); tagAll(); const hi0 = store.headIndex(); if (hi0 >= 0) recorded.set(key(ctx.chat[hi0]), J(head())); }
        const hiBefore = store.headIndex();
        const prevKey = hiBefore >= 0 ? key(ctx.chat[hiBefore]) : null;
        const dumpAt = process.env.DUMPAT ? process.env.DUMPAT.split(',').map(Number) : [];
        const fsx = dumpAt.length ? await import('node:fs') : null;
        if (dumpAt.includes(step)) fsx.writeFileSync(`dump-${seed}-${step}-before.json`, JSON.stringify({ op, chat: ctx.chat, recorded: [...recorded] }, null, 1));
        OPCOUNT[op] = (OPCOUNT[op] ?? 0) + 1;
        const out = await wrap(op, () => OPS[op](step));
        if (dumpAt.includes(step)) fsx.writeFileSync(`dump-${seed}-${step}-after.json`, JSON.stringify({ op, chat: ctx.chat, chatId: ctx.chatId, file: files.get(ctx.chatId), dirty: store.dirty() }, null, 1));
        tagAll();
        if (op === 'reload' || op === 'branch' || op === 'rewind' || op === 'newChat' || op === 'death') lastSavedChatId = ctx.chatId;
        const t0 = performance.now();
        const RESTORE = new Set(['swipeTo', 'swipeDelete', 'deleteLast', 'deleteMany', 'reload', 'editReply', 'editUser', 'branch']);
        const skip = new Set();
        if (!RESTORE.has(op)) {
            if (prevKey) skip.add(prevKey);
            const hi = store.headIndex();
            if (hi >= 0) skip.add(key(ctx.chat[hi]));
            const before = carriers(ctx.chat).filter(i => i < hi).at(-1);
            if (before !== undefined) skip.add(key(ctx.chat[before]));   // a cue before the reply lands there
        }
        check(`${step}:${op}`, { expectRecorded: out !== 'nocheck2', skip, full: RESTORE.has(op) || op === 'rewind' });
        const dt = performance.now() - t0;
        if (VERBOSE && step % 50 === 0) origErr(`seed ${seed} step ${step} len ${ctx.chat.length} rev ${head()?.meta?.rev} check ${dt.toFixed(0)}ms`);
        for (const p of turn.problems()) if (/could not be kept|could not be built/.test(p.message)) fail('turn problem', p.message);
        turn.clearProblems();
        if (STOP && violations.length) break;
    }
    if (process.env.FINAL) { const D = head()?.domains ?? {}; origErr('FINAL', JSON.stringify({ effects: Object.keys(D.effects?.active ?? {}).length, loot: Object.keys(D.inventory?.loot ?? {}).length, cond: Object.values(D.inventory?.stacks ?? {}).filter(x => x.cond !== undefined && x.cond !== 100).length, stages: Object.values(D.npc?.npcs ?? {}).map(n => JSON.stringify(n.stages)).join(','), companions: Object.keys(D.party?.actors ?? {}).length, enc: (() => { try { return JSON.stringify(sdk.query('inventory.encumbrance')); } catch (e) { return e.message; } })() })); }
    if (process.env.NOTICES) origErr("NOTICES", JSON.stringify(st.notices.slice(-5)), st.notices.length);
    h.close();
    console.warn = origWarn; console.error = origErr;
    restore();
    const cps = ctx.chat.filter(m => readRecord(m)?.checkpoint).length;
    return { violations, log, consoleErrors, len: ctx.chat.length, cps, bytes: JSON.stringify(ctx.chat).length };
}

const all = [];
for (let seed = SEED_FROM; seed <= SEED_TO; seed++) {
    const out = await runSeed(seed);
    const kinds = {};
    for (const v of out.violations) kinds[v.what.replace(/\d+/g, 'N')] = (kinds[v.what.replace(/\d+/g, 'N')] ?? 0) + 1;
    console.log(`seed ${seed}: ${out.violations.length} violations, chat ${out.len} msgs, ${out.cps} checkpoints, ${out.bytes} bytes`, JSON.stringify(kinds));
    for (const v of out.violations.slice(0, 3)) console.log("   ", JSON.stringify(v));
    if (process.env.LOG) console.log(out.log.map((o, i) => `${i}:${o}`).join(" "));
    all.push(...out.violations);
}
if (OUT) fsSync.writeFileSync(OUT, JSON.stringify({ args, env: { PACK: process.env.PACK, PROFILE: process.env.PROFILE }, violations: all.map(v => ({ ...v, detail: v.detail.slice(0, 300) })), cmdStats: CMD_STATS, kinds: KIND_COUNT, ops: OPCOUNT }));
const byKind = {};
for (const v of all) { const k = v.what.replace(/\d+/g, 'N'); (byKind[k] ??= []).push(`${v.seed}@${v.step}:${v.op}`); }
console.log('\nSUMMARY');
console.log('ui commands', JSON.stringify(CMD_STATS));
for (const [k, list] of Object.entries(byKind)) console.log(`${list.length}\t${k}\t${list.slice(0, 6).join(' ')}`);
process.exit(0);
